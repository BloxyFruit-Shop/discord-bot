import {
  ButtonInteraction,
  CacheType,
  Client
} from 'discord.js';
import { ButtonHandler } from '~/types.js';
import { findTicketByChannelId, updateTicketByChannelId } from '~/lib/TicketManager.js';
import { createSummaryEmbed, createTimezoneRecordedEmbed } from '~/lib/Embeds.js';
import { cancelChannelTimeout } from '~/lib/TimeoutManager.js';
import { color } from '~/functions.js';
import { getTranslations } from '~/lang/index.js';
import type { IOrder } from '~/schemas/Order.js';

const timezoneSelectHandler: ButtonHandler = {
  customIdPrefix: 'timezone_',
  execute: async (interaction: ButtonInteraction<CacheType>, client : Client<true>) => {
    const channelId = interaction.channelId;
    const userId = interaction.user.id;
    // Extract timezone
    const selectedTimezone = interaction.customId.replace('timezone_', '');

    const defaultT = getTranslations('en');

    try {
      // Populate the 'order' field when finding the ticket
      const ticket = await findTicketByChannelId(channelId, true);

      if (!ticket) {
        console.warn(color('warn', `[TimezoneSelect] Ticket not found for channel ${channelId}`));
        await interaction.reply({ content: defaultT.TICKET_NOT_FOUND_GENERIC, ephemeral: true });
        return;
      }

      // Now we can use the ticket's language for translations
      const t = getTranslations(ticket.language || 'en');

      if (ticket.userId !== userId) {
        await interaction.reply({ content: t.TICKET_NOT_OWNER, ephemeral: true });
        return;
      }

      if (ticket.stage !== 'timezone') {
        console.warn(color('warn', `[TimezoneSelect] Ticket ${ticket._id} in channel ${channelId} is not in timezone stage (current: ${ticket.stage})`));
        await interaction.reply({ content: t.TICKET_WRONG_STAGE, ephemeral: true });
        return;
      }

      // Ensure the order details are populated
      if (!ticket.order || typeof ticket.order !== 'object' || !('items' in ticket.order)) {
        console.error(color('error', `[TimezoneSelect] Order details not populated for ticket ${ticket._id} in channel ${channelId}`));
        await interaction.reply({ content: t.GENERIC_ERROR, ephemeral: true });
        return;
      }

      const populatedOrder = ticket.order as IOrder;

      // Update the ticket in the database
      const updatedTicket = await updateTicketByChannelId(channelId, {
        timezone: selectedTimezone,
        stage: 'finished',
      });

      if (!updatedTicket || !updatedTicket.order || typeof updatedTicket.order !== 'object') {
        console.error(color('error', `[TimezoneSelect] Failed to update ticket ${ticket._id} or repopulate order for channel ${channelId}`));
        await interaction.reply({ content: t.GENERIC_ERROR, ephemeral: true });
        return;
      }

      const cancelled = cancelChannelTimeout(channelId);
      if (cancelled) {
          console.log(color('text', `[TimezoneSelect] Cancelled inactivity timeout for channel ${channelId} as ticket stage updated to 'finished'.`));
      } else {
          // This might happen if the timeout already executed or was cancelled elsewhere. Usually not an error.
          console.log(color('text', `[TimezoneSelect] No active timeout found to cancel for channel ${channelId} (might have already executed or been cancelled).`));
      }

      console.log(color('text', `[TimezoneSelect] User ${userId} selected timezone '${selectedTimezone}' for ticket ${ticket._id} in channel ${channelId}. Stage -> finished.`));

      const confirmationEmbed = createTimezoneRecordedEmbed(updatedTicket.language || 'en', selectedTimezone, client)

      await interaction.update({
        embeds: [confirmationEmbed],
        components: [], // Remove timezone buttons
      });

      // Create and send the summary embed as a new message
      const summaryEmbed = createSummaryEmbed(
        populatedOrder,
        {
            orderId: updatedTicket.orderId!,
            robloxUsername: updatedTicket.robloxUsername!,
            timezone: selectedTimezone,
            language: updatedTicket.language || 'en'
        },
        client
      );

      if (interaction.channel?.isTextBased() && !interaction.channel.isDMBased()) {
        await interaction.channel.send({ embeds: [summaryEmbed] });
      } else {
        console.warn(color('warn', `[TimezoneSelect] Interaction channel ${channelId} is not a guild text-based channel. Cannot send summary message.`));
      }

    } catch (error) {
      console.error(color('error', `[TimezoneSelect] Error processing timezone selection for channel ${channelId}: ${error}`));
      const errorReply = { content: defaultT.GENERIC_ERROR, ephemeral: true };
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorReply);
        } else {
          await interaction.reply(errorReply);
        }
      } catch (replyError) {
        console.error(color("error", `[TimezoneSelect] Failed to send error reply: ${replyError}`));
      }
    }
  },
};

export default timezoneSelectHandler;
