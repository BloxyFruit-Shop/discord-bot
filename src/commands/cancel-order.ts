import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, GuildMember, TextChannel } from "discord.js";
import { Command } from "~/types";
import { servers } from '~/config/servers.js';
import { findTicketByChannelId, updateTicketByChannelId } from "~/lib/TicketManager.js";
import { getModel } from "~/models.js";
import { color } from "~/functions.js";
import { getTranslations } from "~/lang/index.js";
import { cancelChannelTimeout } from '~/lib/TimeoutManager.js';
import { scheduleChannelDeletion } from '~/lib/DiscordUtils.js';

const command: Command = {
  command: new SlashCommandBuilder()
    .setName("cancel-order")
    .setDescription("Cancels the order associated with this ticket."),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: "This command can only be used in server text channels.", ephemeral: true });
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

    // Check if it's a ticket channel and get ticket data
    const ticket = await findTicketByChannelId(interaction.channelId);
    if (!ticket || !ticket.orderId) {
      await interaction.reply({ content: "This command can only be used in an active ticket channel with a verified order.", ephemeral: true });
      return;
    }

    const lang = ticket.language || 'en';
    const t = getTranslations(lang);

    try {
      await interaction.reply({ content: "Cancelling order...", ephemeral: true });

      const Order = getModel('Order');
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: ticket.order || ticket.orderId },
        { $set: { status: 'cancelled', updatedAt: new Date() } },
        { new: true }
      ).exec();

      if (!updatedOrder) {
        console.error(color("error", `[CancelOrder] Failed to find and update order ${ticket.orderId} for channel ${interaction.channelId}.`));
        await interaction.editReply({ content: t.ORDER_NOT_FOUND_TITLE || "Could not find the order to cancel." });
        return;
      }

      // Update ticket stage to reflect cancellation (optional, but good practice)
      await updateTicketByChannelId(interaction.channelId, { stage: 'cancelled' });

      const cancelled = cancelChannelTimeout(interaction.channelId);
      if (cancelled) {
        console.log(color('text', `[CancelOrder] Cancelled inactivity timeout for channel ${interaction.channelId} as ticket stage updated to 'finished'.`));
      } else {
        // This might happen if the timeout already executed or was cancelled elsewhere. Usually not an error.
        console.log(color('text', `[CancelOrder] No active timeout found to cancel for channel ${interaction.channelId} (might have already executed or been cancelled).`));
      }

      // Rename the channel
      const currentChannel = interaction.channel as TextChannel;
      const newName = `cancelled-${currentChannel.name.replace(/^ticket-/i, '')}`.substring(0, 100);
      await currentChannel.setName(newName, `Order cancelled by ${interaction.user.tag}`);

      await interaction.editReply({ content: "Order has been cancelled!" });
      console.log(color("text", `[CancelOrder] Order ${ticket.orderId} cancelled and channel ${interaction.channelId} renamed by ${interaction.user.tag}.`));

      scheduleChannelDeletion(interaction.channel as TextChannel, 1000 * 60 * 30, `Order cancelled by ${interaction.user.tag}`);

    } catch (error: any) {
      console.error(color("error", `[CancelOrder] Error cancelling order ${ticket.orderId} for channel ${interaction.channelId}: ${error}`));
      await interaction.editReply({
        content: `${t.GENERIC_ERROR || 'An error occurred:'} ${error.message || 'Unknown error'}`,
      });
    }
  },
};

export default command;
