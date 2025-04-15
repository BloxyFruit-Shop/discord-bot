import { Client, Collection } from "discord.js";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { color } from "~/functions.js";
import { ButtonHandler } from "~/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async (client: Client) => {
    const buttonsDir = join(__dirname, "../buttons");
    client.buttonHandlersExact = new Collection<string, ButtonHandler>();
    client.buttonHandlersPrefix = new Collection<string, ButtonHandler>();

    try {
        const files = await readdir(buttonsDir);
        let loadedCount = 0;
        for (const file of files) {
            if (!file.endsWith(".js")) continue;

            const filePath = join(buttonsDir, file);
            const fileUrl = pathToFileURL(filePath).href;

            try {
                const { default: buttonHandler }: { default: ButtonHandler } = await import(fileUrl);

                if (typeof buttonHandler.execute !== 'function') {
                    console.warn(color("error", `❓ Button handler file ${file} is missing 'execute' function.`));
                    continue;
                }

                let loaded = false;
                // Prioritize exact match
                if (buttonHandler.customId) {
                    if (client.buttonHandlersExact.has(buttonHandler.customId)) {
                        console.warn(color("warn", `⚠️ Duplicate button handler customId detected: ${buttonHandler.customId} in file ${file}. Overwriting.`));
                    }
                    client.buttonHandlersExact.set(buttonHandler.customId, buttonHandler);
                    console.log(color("text", `🔘 Successfully loaded button handler for exact ID ${color("variable", buttonHandler.customId)}`));
                    loaded = true;
                }
                // Load prefix match if no exact match was defined in the file
                else if (buttonHandler.customIdPrefix) {
                    if (client.buttonHandlersPrefix.has(buttonHandler.customIdPrefix)) {
                        console.warn(color("warn", `⚠️ Duplicate button handler prefix detected: ${buttonHandler.customIdPrefix} in file ${file}. Overwriting.`));
                    }
                    client.buttonHandlersPrefix.set(buttonHandler.customIdPrefix, buttonHandler);
                    console.log(color("text", `🔘 Successfully loaded button handler for prefix ${color("variable", buttonHandler.customIdPrefix)}`));
                    loaded = true;
                }

                if (!loaded) {
                     console.warn(color("error", `❓ Button handler file ${file} is missing 'customId' or 'customIdPrefix'.`));
                } else {
                    loadedCount++;
                }

            } catch (err) {
                console.error(color("error", `❌ Error loading button handler ${file}: ${err}`));
            }
        }
        console.log(color("text", `🔘 Loaded ${color("variable", loadedCount)} button handler(s).`));

    } catch (err: any) {
        // Handle case where directory might not exist
        if (err.code === 'ENOENT') {
            console.log(color("text", "📂 Buttons directory not found, skipping button handler loading."));
        } else {
            console.error(color("error", `❌ Could not read buttons directory: ${err}`));
        }
    }
};
