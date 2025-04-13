import { connectDB } from '~/lib/Mongo.js';
import { orderSchema, IOrder } from '~/schemas/Order.js';
import { ticketSchema, ITicket } from '~/schemas/Ticket.js';

import { Model } from 'mongoose';

type Models = {
    Order?: Model<IOrder>;
    Ticket?: Model<ITicket>;
    // Future dev, add other models here
};

const models: Models = {};

// Variable to track if models are initialized
let modelsInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Function to initialize models (ensures connection is ready)
export const initializeModels = (): Promise<void> => {
    if (modelsInitialized) {
        return Promise.resolve();
    }
    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = new Promise(async (resolve, reject) => {
        try {
            console.log("Attempting to connect DB for model initialization...");
            const connection = await connectDB();
            console.log("DB connected. Initializing models...");

            models.Order = connection.model<IOrder>('Order', orderSchema);
            models.Ticket = connection.model<ITicket>('Ticket', ticketSchema);
            // Future dev, add other models here

            console.log("Models initialized:", Object.keys(models));
            modelsInitialized = true;
            resolve();
        } catch (error) {
            console.error("Failed to initialize models:", error);
            initializationPromise = null; // Reset promise on failure
            reject(error);
        }
    });
    return initializationPromise;
};

export default models;

export const getModel = <K extends keyof Models>(modelName: K): NonNullable<Models[K]> => {
    if (!modelsInitialized || !models[modelName]) {
        throw new Error(`Model ${modelName} has not been initialized. Ensure initializeModels() has completed.`);
    }
    return models[modelName]!;
};