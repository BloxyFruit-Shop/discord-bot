import { getModel } from '~/models.js';
import type { ITicket, TicketStage } from '~/schemas/Ticket.js';
import type { LanguageCode } from '~/lang/index.js';
import type { ServerKey } from '~/types/config.js';
import type { IOrder } from '~/schemas/Order.js';
import mongoose from 'mongoose';

interface CreateTicketData {
  channelId: string;
  userId: string;
  serverName: ServerKey;
}

/**
 * Creates a new ticket document in the database with the default stage 'languagePreference'.
 */
export async function createTicketInDB(data: CreateTicketData): Promise<ITicket> {
  const Ticket = getModel('Ticket');
  const newTicket = new Ticket({
    channelId: data.channelId,
    userId: data.userId,
    serverName: data.serverName,
    stage: 'languagePreference',
    // language, orderId, timezone, robloxUsername are set later
  });
  await newTicket.save();
  console.log(`[TicketManager] Created ticket for channel ${data.channelId} with stage 'languagePreference'`);
  return newTicket;
}

/**
 * Finds a ticket by its Discord channel ID.
 * Optionally populates the referenced Order document.
 */
export async function findTicketByChannelId(channelId: string, populateOrder = false): Promise<ITicket | null> {
  const Ticket = getModel('Ticket');
  let query = Ticket.findOne({ channelId });
  if (populateOrder) {
    query = query.populate('order');
  }
  return query.exec();
}

/**
 * Finds tickets by user ID and server name.
 */
export async function findTicketsByUserId(userId: string, serverName: ServerKey): Promise<ITicket[]> {
  const Ticket = getModel('Ticket');
  return Ticket.find({ userId, serverName }).exec();
}

/**
 * Finds an active (non-completed/cancelled) ticket by Order ID and server name.
 */
export async function findActiveTicketByOrderId(orderId: string, serverName: ServerKey): Promise<ITicket | null> {
  const Ticket = getModel('Ticket');
  const activeStages: TicketStage[] = ['languagePreference', 'orderVerification', 'timezone', 'finished'];
  return Ticket.findOne({
    orderId,
    serverName,
    stage: { $in: activeStages }
  }).exec();
}

interface UpdateTicketData {
  stage?: TicketStage;
  language?: LanguageCode;
  orderId?: string;
  order?: mongoose.Types.ObjectId | IOrder;
  robloxUsername?: string;
  timezone?: string;
}

/**
 * Updates a ticket found by its channel ID.
 */
export async function updateTicketByChannelId(channelId: string, updates: UpdateTicketData): Promise<ITicket | null> {
  const Ticket = getModel('Ticket');
  const updatePayload = { ...updates, updatedAt: new Date() };
  const updatedTicket = await Ticket.findOneAndUpdate(
    { channelId },
    { $set: updatePayload },
    { new: true } // Return the updated document
  ).exec();

  if (updatedTicket) {
    console.log(`[TicketManager] Updated ticket for channel ${channelId}`);
  } else {
    console.warn(`[TicketManager] Attempted to update non-existent ticket for channel ${channelId}`);
  }
  return updatedTicket;
}

/**
 * Deletes a ticket from the database by channel ID.
 */
export async function deleteTicketByChannelId(channelId: string): Promise<boolean> {
  const Ticket = getModel('Ticket');
  const result = await Ticket.deleteOne({ channelId }).exec();
  const success = result.deletedCount > 0;
  if (success) {
    console.log(`[TicketManager] Deleted ticket for channel ${channelId}`);
  } else {
    console.warn(`[TicketManager] Attempted to delete non-existent ticket for channel ${channelId}`);
  }
  return success;
}

/**
 * Finds tickets that haven't been updated recently and are in specific early stages,
 * suitable for automatic cleanup.
 */
export async function findInactiveTicketsForCleanup(inactiveThresholdMinutes: number): Promise<ITicket[]> {
  const Ticket = getModel('Ticket');
  const thresholdDate = new Date(Date.now() - inactiveThresholdMinutes * 60 * 1000);
  const stagesToCheck: TicketStage[] = ['languagePreference', 'orderVerification'];

  return Ticket.find({
    stage: { $in: stagesToCheck },
    updatedAt: { $lt: thresholdDate }
  }).exec();
}
