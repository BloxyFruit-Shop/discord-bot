import { Client, DiscordAPIError, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { color, delay } from "~/functions.js";
import { Command } from "~/types.js";
import 'dotenv/config';
import { servers } from '~/config/servers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Probably move these to config later, for now imma leave them here

// Delay between registering commands for each guild (in milliseconds)
const GUILD_REGISTER_DELAY = 500; // Can test with lower numbers, but I find 500 should be good
// Delay before starting the retry queue processing (in milliseconds)
const RETRY_QUEUE_DELAY = 5000; // Wait 5 seconds before retrying failed guilds
// Delay between retrying guilds in the queue
const RETRY_GUILD_DELAY = 1000; // Using a slightly longer delay for retries
// Maximum number of retry attempts for the entire queue
const MAX_RETRY_ATTEMPTS = 3;

export default async (client: Client) => {
    const commands: (SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder)[] = [];
    const commandsDir = join(__dirname, "../commands"); 

    try {
        const slashFiles = await readdir(commandsDir);
        for (const file of slashFiles) {
            if (!file.endsWith(".js")) continue;

            const filePath = join(commandsDir, file);
            const fileUrl = pathToFileURL(filePath).href; // Convert path to URL

            try {
                const { default: command }: { default: Command; } = await import(fileUrl);
                if (command.command) {
                    commands.push(command.command);
                    client.commands.set(command.command.name, command);
                } else {
                    console.warn(color("error", `❓ Command file ${file} is missing the 'command' property.`));
                }
            } catch (err) {
                console.error(color("error", `❌ Error loading slash command ${file}: ${err}`));
            }
        }
    } catch (err) {
        console.error(color("error", `❌ Could not read slash commands directory: ${err}`));
    }

    // Register Slash Commands
    if (!process.env.TOKEN || !process.env.CLIENT_ID) {
        console.error(color("error", "❌ Missing TOKEN or CLIENT_ID in environment variables. Cannot register commands."));
        return;
    }

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    const commandData = commands.map(command => command.toJSON());
    // Using a Set here to avoid registering for the same guild ID multiple times
    const uniqueGuildIds = new Set<string>(Object.values(servers).map(s => s.guild));
    const retryQueue = new Set<string>(); // Using a Set for the retry queue as well

    console.log(color("text", `⏳ Started refreshing ${commands.length} application (/) commands for ${uniqueGuildIds.size} unique guilds.`));

    for (const guildId of uniqueGuildIds) {
        try {
            const serverConfig = Object.values(servers).find(s => s.guild === guildId);
            const serverName = serverConfig ? serverConfig.name : guildId;

            console.log(color("text", `  -> Registering commands for guild: ${color("variable", serverName)} (${guildId})`));
            const route = Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId);
            await rest.put(route, { body: commandData });
            console.log(color("text", `  ✅ Successfully registered commands for guild: ${color("variable", serverName)}`));

            await delay(GUILD_REGISTER_DELAY);
        } catch (error: any) {
            const serverConfig = Object.values(servers).find(s => s.guild === guildId);
            const serverName = serverConfig ? serverConfig.name : guildId;

            // Check if it's a rate limit error (HTTP 429)
            if (error instanceof DiscordAPIError && error.status === 429) {
                console.warn(color("warn", `  ⚠️ Rate limited on guild ${color("variable", serverName)} (${guildId}). Adding to retry queue.`));
                retryQueue.add(guildId);
                await delay(RETRY_QUEUE_DELAY); // Wait longer before next attempt
            } else {
                // Log other errors
                const errorMessage = error.rawError?.message || error.message || error;
                console.error(color("error", `❌ Failed to register commands for guild ${color("variable", serverName)} (${guildId}): ${errorMessage}`));
                // These do not go towards the retry queue, review logs and fix manually
            }
        }
    }
    console.log(color("text", `🏁 Finished initial registration pass.`));

    // Retry queue processing
    let retryAttempts = 0;
    while (retryQueue.size > 0 && retryAttempts < MAX_RETRY_ATTEMPTS) {
        retryAttempts++;
        console.log(color("text", `⏳ Starting retry attempt ${retryAttempts}/${MAX_RETRY_ATTEMPTS} for ${retryQueue.size} guilds after a delay...`));
        await delay(RETRY_QUEUE_DELAY);

        const guildsToRetry = Array.from(retryQueue); // Create a snapshot for this attempt
        retryQueue.clear(); // Clear the main queue, will re-add failures

        for (const guildId of guildsToRetry) {
            try {
                const serverConfig = Object.values(servers).find(s => s.guild === guildId);
                const serverName = serverConfig ? serverConfig.name : guildId;

                console.log(color("text", `  [RETRY ${retryAttempts}] -> Registering commands for guild: ${color("variable", serverName)} (${guildId})`));
                const route = Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId);
                await rest.put(route, { body: commandData });
                console.log(color("text", `  [RETRY ${retryAttempts}] ✅ Successfully registered commands for guild: ${color("variable", serverName)}`));

                // Success, don't add back to retryQueue

                await delay(RETRY_GUILD_DELAY); // Use the retry delay between attempts
            } catch (error: any) {
                const serverConfig = Object.values(servers).find(s => s.guild === guildId);
                const serverName = serverConfig ? serverConfig.name : guildId;

                // Still failing, add back to the queue for the next attempt
                retryQueue.add(guildId);

                if (error instanceof DiscordAPIError && error.status === 429) {
                    console.warn(color("warn", `  [RETRY ${retryAttempts}] ⚠️ Still rate limited on guild ${color("variable", serverName)} (${guildId}). Will retry again if possible.`));
                     await delay(RETRY_QUEUE_DELAY);
                } else {
                    const errorMessage = error.rawError?.message || error.message || error;
                    console.error(color("error", `  [RETRY ${retryAttempts}] ❌ Failed to register commands for guild ${color("variable", serverName)} (${guildId}): ${errorMessage}`));
                }
            }
        }
    }

    if (retryQueue.size > 0) {
        console.error(color("error", `❌ Failed to register commands for ${retryQueue.size} guilds after ${MAX_RETRY_ATTEMPTS} attempts:`));
        for (const guildId of retryQueue) {
             const serverConfig = Object.values(servers).find(s => s.guild === guildId);
             const serverName = serverConfig ? serverConfig.name : guildId;
             console.error(color("error", `  - ${color("variable", serverName)} (${guildId})`));
        }
    } else if (retryAttempts > 0) {
         console.log(color("text", `✅ Successfully registered commands for all guilds after ${retryAttempts} retry attempt(s).`));
    }

    console.log(color("text", `🔥 Finished refreshing application commands.`));
};
