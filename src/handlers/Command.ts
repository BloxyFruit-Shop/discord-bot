import { Client, Routes, SlashCommandBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { color } from "~/functions.js";
import { Command } from "~/types.js";
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// For dev testing
const TEST_GUILD_ID = process.env.TEST_GUILD_ID;
const IS_DEV = !!TEST_GUILD_ID;

export default async (client: Client) => {
    const commands: SlashCommandBuilder[] = [];
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

    try {
        const commandData = commands.map(command => command.toJSON());
        let route: `/${string}`;
        let mode: string;

        if (IS_DEV && TEST_GUILD_ID) {
            // Register to test guild
            route = Routes.applicationGuildCommands(process.env.CLIENT_ID, TEST_GUILD_ID);
            mode = `guild (${TEST_GUILD_ID})`;
        } else {
            // Register globally
            route = Routes.applicationCommands(process.env.CLIENT_ID);
            mode = "global";
        }

        console.log(color("text", `⏳ Started refreshing ${commands.length} application (/) commands (${mode}).`));

        const data: any = await rest.put(route, { body: commandData });

        console.log(color("text", `🔥 Successfully loaded ${color("variable", data.length)} slash command(s) (${mode})`));

    } catch (error) {
        console.error(color("error", `❌ Failed to register application commands: ${error}`));
    }
};
