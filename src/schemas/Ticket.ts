import { Schema, Document, Types } from 'mongoose';
import type { ServerKey } from '~/types/config.js';
import type { LanguageCode } from '~/lang/index.js';
import type { IOrder } from './Order.js';

type TicketStage =
    | 'languagePreference' // Initial stage after creation
    | 'orderVerification' // Waiting for user to provide order ID
    | 'timezone' // Waiting for user to select timezone
    | 'finished' // All user info collected, awaiting staff action or completed
    | 'completed' // Order fulfilled, ticket processed (often leads to deletion/archive)
    | 'cancelled'; // Order cancelled via command

interface ITicket extends Document {
    channelId: string;
    userId: string;
    stage: TicketStage;
    language: LanguageCode;
    orderId: string;
    order?: Types.ObjectId | IOrder;
    robloxUsername?: string;
    timezone?: string;
    serverName: ServerKey;
    createdAt: Date;
    updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>({
    channelId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    serverName: { type: String, required: true },
    stage: {
      type: String,
      enum: ['languagePreference', 'orderVerification', 'timezone', 'finished', 'completed', 'cancelled'],
      default: 'languagePreference',
      required: true,
    },
    language: {
      type: String,
      enum: ['en', 'es'],
      required: false,
      default: null
    },
    orderId: {
      type: String,
      required: false,
      default: null
    },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    robloxUsername: { type: String, default: null },
    timezone: { type: String, default: null },
  }, {
    timestamps: true
  });

export { ticketSchema, ITicket, TicketStage };
