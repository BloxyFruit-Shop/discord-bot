import { ButtonHandler, Command } from "~/types.js";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { readdir } from 'fs/promises';
import { initializeModels } from '~/models.js';
import models from '~/models.js';
import { color } from "~/functions.js";
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Guilds, MessageContent, GuildMessages, GuildMembers } = GatewayIntentBits;
const client = new Client({ intents: [Guilds, MessageContent, GuildMessages, GuildMembers] });

client.commands = new Collection<string, Command>();
client.buttonHandlersExact = new Collection<string, ButtonHandler>();
client.buttonHandlersPrefix = new Collection<string, ButtonHandler>();

async function startBot() {
  try {
    // Initialize Database Models
    console.log(color("text", "⏳ Initializing database models..."));
    await initializeModels();
    console.log(color("text", "✅ Database models initialized."));

    // Dynamically load and execute handlers
    const handlersDir = join(__dirname, "handlers");
    const handlerFiles = (await readdir(handlersDir)).filter(file => file.endsWith('.js'));;

    console.log(color("text", "⏳ Loading handlers..."));
    for (const handlerFile of handlerFiles) {
      const handlerPath = join(handlersDir, handlerFile);
      const handlerUrl = pathToFileURL(handlerPath).href;
      try {
        const { default: handler } = await import(handlerUrl);
        // Execute the handler function
        if (typeof handler === 'function') {
            await handler(client);
        } else {
            console.warn(color("variable", `❓ Handler ${handlerFile} does not have a default export function.`));
        }
      } catch (err) {
        console.error(color("error", `❌ Error loading handler ${handlerFile}: ${err}`));
      }
    }
    console.log(color("text", "✅ Handlers loaded."));

    // Check if Order model is actually loaded before using it
    if (models.Order) {
        const orderCount = await models.Order.countDocuments();
        console.log(color("text", `Found ${orderCount} orders in DB.`));
    } else {
        console.warn(color("variable", "❓ Order model not found after initialization. Cannot count documents."));

    }

    // Login to Discord
    if (!process.env.TOKEN) {
      console.error(color("error", "❌ Discord TOKEN not found in environment variables!"));
      process.exit(1); // Exit if token is missing
    }
    console.log(color("text", "⏳ Logging in to Discord..."));
    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error(color("error", `❌ Fatal error during bot startup: ${error}`));
    process.exit(1);
  }
}

startBot();
