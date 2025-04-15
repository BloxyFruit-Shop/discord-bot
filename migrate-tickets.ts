import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { initializeModels, getModel } from './src/models.js';
import { color } from './src/functions.js';
import type { TicketStage } from './src/schemas/Ticket.js';
import type { ServerKey } from './src/types/config.js';
import type { LanguageCode } from './src/lang/index.js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_FILE_PATH = path.join(__dirname, 'ticketStages.json');

interface JsonTicketStage {
    stage: TicketStage | string;
    language: LanguageCode | null;
    orderId: string | null;
    robloxUsername: string | null;
    timezone: string | null;
    serverName: ServerKey;
    userId: string;
    orderDetails?: any;
}

type TicketStagesJson = Record<string, JsonTicketStage>;

async function migrateTickets() {
    console.log(color("text", "🚀 Starting ticket migration script..."));
    let ticketDataJson: TicketStagesJson;
    try {
        console.log(color("text", `📄 Reading ticket data from ${color("variable", JSON_FILE_PATH)}...`));
        const fileContent = await fs.readFile(JSON_FILE_PATH, 'utf-8');
        ticketDataJson = JSON.parse(fileContent);
        console.log(color("text", `📊 Found ${color("variable", Object.keys(ticketDataJson).length)} ticket entries in JSON file.`));
    } catch (error: any) {
        console.error(color("error", `❌ Failed to read or parse ${JSON_FILE_PATH}: ${error.message}`));
        process.exit(1);
    }
    try {
        console.log(color("text", "🔌 Initializing database connection and models..."));
        await initializeModels(); // This handles the connection via connectDB
        console.log(color("text", "✅ Database and models initialized successfully."));
    } catch (error: any) {
        console.error(color("error", `❌ Failed to initialize database/models: ${error.message}`));
        process.exit(1);
    }

    const Ticket = getModel('Ticket');
    const Order = getModel('Order'); // Needed to link orders by ObjectId

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const validStages: TicketStage[] = ['languagePreference', 'orderVerification', 'timezone', 'finished', 'completed', 'cancelled'];
    console.log(color("text", "⏳ Starting migration process..."));
    for (const [channelId, jsonTicket] of Object.entries(ticketDataJson)) {
        try {
            if (!jsonTicket.userId || !jsonTicket.serverName || !jsonTicket.stage) {
                 console.warn(color("warn", `  🟡 Skipping channel ${color("variable", channelId)}: Missing essential data (userId, serverName, or stage) in JSON.`));
                 skippedCount++;
                 continue;
            }

            const existingTicket = await Ticket.findOne({ channelId }).exec();
            if (existingTicket) {
                console.log(color("warn", `  🟡 Skipping channel ${color("variable", channelId)}: Ticket already exists in DB.`));
                skippedCount++;
                continue;
            }

            let orderObjectId: mongoose.Types.ObjectId | null = null;
            if (jsonTicket.orderId) {
                const relatedOrder = await Order.findOne({ id: jsonTicket.orderId }).select('_id').lean().exec();
                if (relatedOrder) {
                    orderObjectId = relatedOrder._id; // Get the actual ObjectId
                } else {
                    console.log(color("warn", `  ⚠️ Warning for channel ${color("variable", channelId)}: Order with ID ${color("variable", jsonTicket.orderId)} not found in DB. Ticket will be created without order link.`));
                }
            }

            let mappedStage: TicketStage = 'finished';
            if (validStages.includes(jsonTicket.stage as TicketStage)) {
                mappedStage = jsonTicket.stage as TicketStage;
            } else {
                 console.log(color("warn", `  ⚠️ Warning for channel ${color("variable", channelId)}: Invalid stage "${jsonTicket.stage}" found in JSON. Defaulting to "${mappedStage}".`));
            }

            type TicketCreationData = {
                channelId: string;
                userId: string;
                serverName: ServerKey;
                stage: TicketStage;
                language: LanguageCode | null;
                orderId: string | null;
                robloxUsername: string | null;
                timezone: string | null;
                order?: mongoose.Types.ObjectId;
            };
            const newTicketData: TicketCreationData = {
                channelId: channelId,
                userId: jsonTicket.userId,
                serverName: jsonTicket.serverName,
                stage: mappedStage,
                language: jsonTicket.language ?? null,
                orderId: jsonTicket.orderId ?? null,
                robloxUsername: jsonTicket.robloxUsername ?? null,
                timezone: jsonTicket.timezone ?? null,
                ...(orderObjectId && { order: orderObjectId }),
            };

            await Ticket.create(newTicketData);
            console.log(color("text", `  ✅ Migrated ticket for channel ${color("variable", channelId)}.`));
            migratedCount++;

        } catch (error: any) {
            console.error(color("error", `  ❌ Error migrating ticket for channel ${color("variable", channelId)}: ${error.message}`));
            errorCount++;
        }
    }
    console.log(color("text", "\n🏁 Migration process finished."));
    console.log(color("text", `  - Migrated: ${color("variable", migratedCount)}`));
    console.log(color("warn", `  - Skipped (missing data or already exists): ${color("variable", skippedCount)}`));
    console.log(color("error", `  - Errors: ${color("variable", errorCount)}`));
    try {
        await mongoose.disconnect();
        console.log(color("text", "🔒 Database connection closed."));
    } catch (error: any) {
        console.error(color("error", `  ⚠️ Error closing database connection: ${error.message}`));
    }
}

// Run the migration function
migrateTickets().catch(err => {
    console.error(color("error", `🚨 Unhandled error during migration script execution: ${err}`));
    mongoose.disconnect(); // Attempt to close connection on unhandled error
    process.exit(1);
});
