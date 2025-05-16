import { Events, Message, Client, ChannelType } from 'discord.js';
import { BotEvent } from '~/types.js';
import { color } from '~/functions.js';
import { servers } from '~/config/servers.js';
import { getModel } from '~/models.js';
import {
  findTicketByChannelId,
  updateTicketByChannelId,
  deleteTicketByChannelId,
  findActiveTicketByOrderId
} from '~/lib/TicketManager.js';
import {
  createOrderNotFoundEmbed,
  createTicketExistsEmbed,
  createMissingReceiverAccountEmbed,
  createDifferentGameEmbed,
  createOrderClaimedEmbed,
  createAccountItemsEmbed,
  createPhysicalFruitOnlyEmbed,
  createNoPhysicalFruitEmbed,
  createOrderFoundEmbed,
  createTimezoneEmbed,
  createTimezoneButtons,
  createRiskOrderEmbed,
  createCancelRefundEmbed
} from '~/lib/Embeds.js';
import { getTranslations } from '~/lang/index.js';
import type { ServerKey } from '~/types/config.js';
import type { IOrder } from '~/schemas/Order.js';
import { getOrderStatusDetails, initializeShopify } from '~/lib/Shopify.js';

/*
 * This handles the order verification stage of the ticketing system.
 * It checks the order ID provided by the user and verifies it against the database.
 */
const event: BotEvent = {
  name: Events.MessageCreate,
  async execute(message: Message, client: Client<true>) {
    if (message.author.bot || message.channel.type !== ChannelType.GuildText) {
      return;
    }
    if (!message.channel.name.startsWith('ticket-')) {
      return;
    }
    
    // Fetch the ticket associated with the channel from db. If no ticket document exists for this channel, or the message author isn't the ticket owner, ignore
    const ticket = await findTicketByChannelId(message.channel.id);
    if (!ticket || message.author.id !== ticket.userId) {
      return;
    }

    // Only process messages if the ticket is awaiting order verification
    if (ticket.stage !== 'orderVerification') {
      return;
    }

    const orderId = message.content.trim().replace(/^#/, '');
    const lang = ticket.language || 'en';
    const t = getTranslations(lang);
    const serverConfig = servers[ticket.serverName as ServerKey];

    if (!serverConfig) {
      console.error(color('error', `[MessageCreate] Server config not found for server: ${ticket.serverName} in ticket ${ticket.channelId}`));
      return;
    }

    try {
      const Order = getModel('Order');
      const order = await Order.findOne<IOrder>({ id: orderId });

      // Order Not Found or Cancelled
      if (!order || order.status === 'cancelled') {
        const embed = createOrderNotFoundEmbed(orderId, lang, client);
        await message.channel.send({ embeds: [embed] });
        await deleteTicketByChannelId(message.channel.id);
        return;
      }

      // Check for Existing Active Ticket for this Order
      const existingTicket = await findActiveTicketByOrderId(orderId, ticket.serverName as ServerKey);
      if (existingTicket && existingTicket.channelId !== message.channel.id) {
        const embed = createTicketExistsEmbed(orderId, existingTicket.channelId, lang, client);
        await message.channel.send({ embeds: [embed] });
        await deleteTicketByChannelId(message.channel.id);
        return;
      }

      // Check for Missing Receiver Account
      const robloxUsername = order.reciever?.username;
      if (!robloxUsername) {
        const embed = createMissingReceiverAccountEmbed(lang, client);
        await message.channel.send({ embeds: [embed] });
        await deleteTicketByChannelId(message.channel.id);
        return;
      }

      // Check for Game Mismatch
      const orderGame = order.game as ServerKey | undefined;
      const currentServer = ticket.serverName as ServerKey;
      const isAllowedMarketOrder = orderGame === 'blox-fruits' && currentServer === 'bloxy-market';

      if (orderGame && orderGame !== currentServer && !isAllowedMarketOrder) {
        const embed = createDifferentGameEmbed(orderId, orderGame, lang, client);
        await message.channel.send({ embeds: [embed] });
        await deleteTicketByChannelId(message.channel.id);
        return;
      }

      // Check if Order is Already Completed
      if (order.status === 'completed') {
        const embed = createOrderClaimedEmbed(orderId, lang, client);
        await message.channel.send({ embeds: [embed] });
        await deleteTicketByChannelId(message.channel.id);
        return;
      }

      // Check for Account-Only Items
      const onlyAccountItems = order.items.every((item) => item.deliveryType === 'account');
      if (onlyAccountItems) {
        const embed = createAccountItemsEmbed(orderId, lang, client);
        await message.channel.send({ embeds: [embed] });
        await deleteTicketByChannelId(message.channel.id);
        return;
      }

      // Check for Physical-Fruit-Only Items (if NOT in bloxy-market)
      const onlyPhysicalFruit = order.items.every((item) => item.category === 'Physical Fruit');
      if (onlyPhysicalFruit && currentServer !== 'bloxy-market') {
        const embed = createPhysicalFruitOnlyEmbed(lang, client);
        await message.channel.send({ embeds: [embed] });
        await deleteTicketByChannelId(message.channel.id);
        return;
      }

      // Check for Non-Physical-Fruit Items (if IN bloxy-market)
      const noPhysicalFruit = order.items.every((item) => item.category !== 'Physical Fruit');
      if (noPhysicalFruit && currentServer === 'bloxy-market') {
        const embed = createNoPhysicalFruitEmbed(lang, client);
        await message.channel.send({ embeds: [embed] });
        await deleteTicketByChannelId(message.channel.id);
        return;
      }

      let orderStatus;
      try {
        await initializeShopify();
        orderStatus = await getOrderStatusDetails(orderId);
      } catch {
        console.error(color('error', `[MessageCreate] Error fetching order status details for Order ID: ${orderId}`));
        orderStatus = null;
        const embed = createRiskOrderEmbed(null);
        await message.channel.send({ embeds: [embed] });
      }

      if (orderStatus && (orderStatus.isCancelled || orderStatus?.financialStatus === 'REFUNDED' || orderStatus?.financialStatus === 'PARTIALLY_REFUNDED')) {
        const embed = createCancelRefundEmbed(lang, client);
        await message.channel.send({ embeds: [embed] });

        const Order = getModel('Order');
        const updatedOrder = await Order.findOneAndUpdate(
          { id: orderId },
          { $set: { status: 'cancelled', updatedAt: new Date() } },
          { new: true }
        ).exec();

        if (!updatedOrder) {
          console.error(color("error", `[MessageCreate] Order ${orderId} failed to find/update local DB record. Further investigation needed.`));
        } else {
          console.log(color("text", `[MessageCreate] Local DB order status updated to 'cancelled' for order ${orderId}.`));
        }

        await deleteTicketByChannelId(message.channel.id);
        return;
      }

      // Verification Successful
      console.log(color('text', `[MessageCreate] Order ${orderId} verified for ticket ${ticket.channelId}. Proceeding to timezone stage.`));

      // Update the ticket document in the database
      const updatedTicket = await updateTicketByChannelId(message.channel.id, {
        stage: 'timezone',
        orderId: order.id,
        order: order,
        robloxUsername: robloxUsername,
      });

      if (!updatedTicket) {
        console.error(color('error', `[MessageCreate] Failed to update ticket ${ticket.channelId} after order verification.`));
        await message.channel.send(t.GENERIC_ERROR);
        return;
      }

      // Send confirmation and next step prompt
      const orderFoundEmbed = createOrderFoundEmbed(orderId, lang, client);
      await message.channel.send({ embeds: [orderFoundEmbed] });

      if (orderStatus && orderStatus.riskLevel != 'LOW') {
        const embed = createRiskOrderEmbed(orderStatus.riskLevel);
        await message.channel.send({ embeds: [embed] });
      }

      const timezoneEmbed = createTimezoneEmbed(lang, client);
      const timezoneButtons = createTimezoneButtons();
      await message.channel.send({ embeds: [timezoneEmbed], components: [timezoneButtons] });

    } catch (error) {
      console.error(color('error', `[MessageCreate] Error during order verification for ticket ${ticket.channelId}: ${error}`));
      await message.channel.send(t.GENERIC_ERROR);
    }
  },
};

export default event;
