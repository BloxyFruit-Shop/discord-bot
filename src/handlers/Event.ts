import { Client } from "discord.js";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { color } from "~/functions.js";
import { BotEvent } from "~/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async (client: Client) => {
    const eventsDir = join(__dirname, "../events");

    try {
        const files = await readdir(eventsDir);
        for (const file of files) {
            if (!file.endsWith(".js")) continue;

            const filePath = join(eventsDir, file);
            const fileUrl = pathToFileURL(filePath).href;

            try {
                const { default: event }: { default: BotEvent; } = await import(fileUrl);

                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
                console.log(color("text", `🌠 Successfully loaded event ${color("variable", event.name)}`));
            } catch (err) {
                console.error(color("error", `❌ Error loading event ${file}: ${err}`));
            }
        }
    } catch (err) {
        console.error(color("error", `❌ Could not read events directory: ${err}`));
    }
};
