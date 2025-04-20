import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, GuildMember, TextChannel } from "discord.js";
import { Command } from "~/types";
import { servers } from '~/config/servers.js';
import { deleteTicketByChannelId, findActiveTicketByOrderId } from "~/lib/TicketManager.js";
import { getModel } from "~/models.js";
import { color } from "~/functions.js";
import { getTranslations } from "~/lang/index.js";
import { cancelChannelTimeout } from '~/lib/TimeoutManager.js';
import { scheduleChannelDeletion } from '~/lib/DiscordUtils.js';
import { initializeShopify, cancelOrder } from '~/lib/Shopify.js';
import { ServerKey } from '~/types/config.js';

const command: Command = {
  command: new SlashCommandBuilder()
    .setName("cancel-order")
    .setDescription("Cancels a specific order in Shopify and the local DB by its ID.")
    .addStringOption(option =>
      option.setName('orderid')
        .setDescription('The Shopify Order ID (numeric part) to cancel.')
        .setRequired(true)),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const serverConfig = Object.values(servers).find(s => s.guild === interaction.guildId);
    if (!serverConfig) {
      console.warn(color("warn", `[CancelOrder] Server config not found for guild ${interaction.guildId}`));
      await interaction.reply({ content: "Server configuration error.", ephemeral: true });
      return;
    }

    // Permissions Check
    const member = interaction.member as GuildMember;
    if (!member.roles.cache.has(serverConfig['admin-role'])) {
      await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
      return;
    }

    // Get Order ID from options
    const orderIdToCancel = interaction.options.getString('orderid', true);
    // Basic validation for numeric ID format (optional but recommended)
    if (!/^\d+$/.test(orderIdToCancel)) {
        await interaction.reply({ content: "Invalid Order ID format. Please provide only the numeric ID.", ephemeral: true });
        return;
    }

    const lang = 'en';
    const t = getTranslations(lang);

    // Defer reply since this could take a while
    await interaction.deferReply({ ephemeral: true });

    try {
      await initializeShopify();

      const staffNote = `Cancelled via /cancel-order by ${interaction.user.tag} (${interaction.user.id}) on ${new Date().toISOString()}`;

      console.log(color("text", `[CancelOrder] Attempting Shopify cancellation for order ${orderIdToCancel}...`));
      const shopifyCancelSuccess = await cancelOrder(
        orderIdToCancel,
        staffNote,
        true, // notifyCustomer
        true   // restock
      );

      if (!shopifyCancelSuccess) {
        console.error(color("error", `[CancelOrder] Shopify API failed to cancel order ${orderIdToCancel}. See Shopify.ts logs for details.`));
        await interaction.editReply({ content: "Failed to cancel the order in Shopify. Please check the logs or Shopify admin. The order status has not been changed locally." });
        return; // Stop if Shopify cancellation failed
      }
      console.log(color("text", `[CancelOrder] Shopify cancellation successful for order ${orderIdToCancel}.`));

      // Now we update the db
      const Order = getModel('Order');
      const updatedOrder = await Order.findOneAndUpdate(
        { id: orderIdToCancel },
        { $set: { status: 'cancelled', updatedAt: new Date() } },
        { new: true }
      ).exec();

      if (!updatedOrder) {
        // Log error, but don't stop the process if Shopify succeeded.
        // The order might not exist inside the db, or the query field might be wrong.
        console.error(color("error", `[CancelOrder] Order ${orderIdToCancel} cancelled in Shopify, but failed to find/update local DB record.`));
        await interaction.followUp({ content: "Order cancelled in Shopify, but the local database record was not found or couldn't be updated. Please check manually.", ephemeral: true });
      } else {
         console.log(color("text", `[CancelOrder] Local DB order status updated to 'cancelled' for order ${orderIdToCancel}.`));
      }

      const guild = interaction?.guild?.name as ServerKey;

      if (!guild) {
        console.warn(color("warn", `[CancelOrder] Guild name not found for order ${orderIdToCancel}.`));
        await interaction.editReply({ content: "Guild name not found. Unable to proceed with ticket cleanup." });
        return;
      }

      const existingTicket = await findActiveTicketByOrderId(orderIdToCancel, guild);
      let ticketCleanupMessage = "";

      if (existingTicket && existingTicket.channelId) {
        console.log(color("text", `[CancelOrder] Found existing ticket channel ${existingTicket.channelId} for order ${orderIdToCancel}. Proceeding with cleanup.`));
        ticketCleanupMessage = "\nAn associated ticket channel was found and will be closed shortly.";

        try {
            const channel = await interaction.guild.channels.fetch(existingTicket.channelId) as TextChannel | null;

            if (channel && channel.type === ChannelType.GuildText) {
                // Delete ticket record
                await deleteTicketByChannelId(existingTicket.channelId);

                // Cancel timeout
                const cancelledTimeout = cancelChannelTimeout(existingTicket.channelId);
                if (cancelledTimeout) {
                    console.log(color('text', `[CancelOrder] Cancelled inactivity timeout for channel ${existingTicket.channelId}.`));
                }

                // Rename channel
                const newName = `cancelled-${channel.name.replace(/^ticket-/i, '')}`.substring(0, 100);
                const auditLogReason = `Order ${orderIdToCancel} cancelled via /cancel-order by ${interaction.user.tag}`;
                await channel.setName(newName, auditLogReason);

                // Schedule deletion
                scheduleChannelDeletion(channel, 1000 * 60 * 2, auditLogReason); // 2 minutes

                console.log(color("text", `[CancelOrder] Ticket channel ${existingTicket.channelId} renamed and scheduled for deletion.`));
            } else {
                 console.warn(color("warn", `[CancelOrder] Ticket channel ${existingTicket.channelId} for order ${orderIdToCancel} not found or not a text channel.`));
                 ticketCleanupMessage = "\nCould not find or access the associated ticket channel for cleanup.";
                 // Attempt to delete the ticket record anyway if the channel is gone
                 await deleteTicketByChannelId(existingTicket.channelId).catch(err => console.error(`[CancelOrder] Failed to delete potentially orphaned ticket record for channel ${existingTicket.channelId}: ${err}`));
            }
        } catch (channelError: any) {
            console.error(color("error", `[CancelOrder] Error cleaning up ticket channel ${existingTicket.channelId}: ${channelError.message || channelError}`), channelError);
            ticketCleanupMessage = "\nAn error occurred while cleaning up the associated ticket channel.";
        }
      } else {
        console.log(color("text", `[CancelOrder] No active ticket channel found for order ${orderIdToCancel}.`));
      }

      // 6. Final Success Reply
      await interaction.editReply({ content: "Order has been successfully cancelled in Shopify and locally!" + ticketCleanupMessage });
      console.log(color("text", `[CancelOrder] Order ${orderIdToCancel} fully processed as cancelled by ${interaction.user.tag}.`));

    } catch (error: any) {
      console.error(color("error", `[CancelOrder] Error during cancellation process for order ${orderIdToCancel}: ${error.message || error}`), error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: `${t.GENERIC_ERROR || 'An error occurred:'} ${error.message || 'Unknown error'}`, ephemeral: true });
      } else {
        await interaction.editReply({
          content: `${t.GENERIC_ERROR || 'An error occurred during the cancellation process:'} ${error.message || 'Unknown error'}`,
        });
      }
    }
  },
};

export default command;
