import mongoose, { Connection } from "mongoose";
import { color } from "~/functions.js";
import 'dotenv/config';

let dbConnection: Connection | null = null;

export const connectDB = (): Promise<Connection> => {
    // Returning a promise here to handle async connection setup
    return new Promise((resolve, reject) => {
        if (dbConnection && dbConnection.readyState === 1) {
            // If already connected, resolve immediately
            console.log(color("text", `🍃 MongoDB connection already established.`));
            resolve(dbConnection);
            return;
        }

        const MONGO_URI = process.env.MONGO_URI;
        const DB_NAME = process.env.MONGO_DATABASE_NAME;

        if (!MONGO_URI) {
            const errorMsg = `🍃 Mongo URI not found, skipping connection.`;
            console.log(color("text", color("error", errorMsg)));
            reject(new Error(errorMsg)); // Reject the promise
            return;
        }

        const connectionString = DB_NAME ? `${MONGO_URI}/${DB_NAME}` : MONGO_URI;

        try {
            console.log(color("text", `🍃 Attempting MongoDB connection to ${color("variable", DB_NAME || 'default DB')}...`));
            const connection = mongoose.createConnection(connectionString);

            // Event Listeners for the specific connection
            connection.on('connected', () => {
                dbConnection = connection;
                console.log(color("text", `🍃 MongoDB connection to ${color("variable", DB_NAME || 'default DB')} has been ${color("variable", "established.")}`));
                resolve(connection); // Resolve the promise with the connection object
            });

            connection.on('error', err => {
                console.error(color("error", `🍃 MongoDB connection error: ${err.message}`));
                dbConnection = null; // Reset connection on error
                reject(err); // Reject the promise
            });

            connection.on('disconnected', () => {
                console.log(color("text", `🍃 MongoDB connection ${color("error", "disconnected.")}`));
                dbConnection = null; // Reset connection on disconnect
                // TODO: Reconnection
            });

        } catch (error) {
            // For synchronous errors during connection setup
            console.error(color("error", `🍃 MongoDB connection setup failed synchronously: ${error instanceof Error ? error.message : String(error)}`));
            reject(error);
        }
    });
};

export const getConnection = (): Connection | null => {
    return dbConnection;
};
