import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, GuildMember, TextChannel } from "discord.js";
import { Command } from "~/types";
import { servers } from '~/config/servers.js';
import { findTicketByChannelId, updateTicketByChannelId } from "~/lib/TicketManager.js";
import { getModel } from "~/models.js";
import { getFulfillmentOrderDetails, fulfillOrderLineItems, initializeShopify } from "~/lib/Shopify.js";
import { createCompletionMessageEmbed, createTranscriptEmbed } from "~/lib/Embeds.js";
import { color } from "~/functions.js";
import { getTranslations } from "~/lang/index.js";
import { createTranscript } from 'discord-html-transcripts';
import { IOrder } from "~/schemas/Order";

const command: Command = {
  command: new SlashCommandBuilder()
    .setName("fulfill-order")
    .setDescription("Marks the order as fulfilled in Shopify & DB, archives ticket."),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: "This command can only be used in server text channels.", ephemeral: true });
      return;
    }

    const serverConfig = Object.values(servers).find(s => s.guild === interaction.guildId);
    if (!serverConfig) {
      console.warn(color("warn", `[FulfillOrder] Server config not found for guild ${interaction.guildId}`));
      await interaction.reply({ content: "Server configuration error.", ephemeral: true });
      return;
    }

    // Permissions Check
    const member = interaction.member as GuildMember;
    if (!member.roles.cache.has(serverConfig['admin-role'])) {
      await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
      return;
    }

    // Defer reply as this can take time
    await interaction.deferReply({ ephemeral: true });

    // Check if it's a ticket channel and get ticket data
    const ticket = await findTicketByChannelId(interaction.channelId, true);
    if (!ticket || !ticket.orderId || ticket.stage === 'cancelled') {
      await interaction.editReply({ content: "This command requires an active, non-cancelled ticket channel with a verified order." });
      return;
    }

    // Ensure order is populated
    if (!ticket.order || typeof ticket.order === 'string') {
      await interaction.editReply({ content: "Could not retrieve full order details associated with this ticket." });
      console.error(color("error", `[FulfillOrder] Order details not populated for ticket ${interaction.channelId}.`));
      return;
    }

    const order = ticket.order as IOrder;
    const lang = ticket.language || 'en';
    const t = getTranslations(lang);

    try {
      console.log(color("text", `[FulfillOrder] Starting Shopify fulfillment for Order ID: ${order.id} (DB _id: ${order._id})`));
      await initializeShopify(); // safe to call multiple times

      const fulfillmentDetailsList = await getFulfillmentOrderDetails(order.id);
      console.log(fulfillmentDetailsList)
      if (!fulfillmentDetailsList || fulfillmentDetailsList.length === 0) {
        await interaction.editReply({ content: "⚠️ No fulfillable items found on Shopify for this order. Cannot fulfill automatically. Please check Shopify admin and logs." });
        console.warn(color("warn", `[FulfillOrder] No fulfillment orders found or no fulfillable items for Shopify Order ID ${order.id}.`));
        return;
      }

      let allShopifyFulfillmentsSucceeded = true;
      for (const details of fulfillmentDetailsList) {
        console.log(color("text", `[FulfillOrder] Attempting to fulfill Shopify FulfillmentOrder: ${details.fulfillmentOrderId}`));
        const success = await fulfillOrderLineItems(details);
        if (!success) {
          allShopifyFulfillmentsSucceeded = false;
          console.error(color("error", `[FulfillOrder] Failed Shopify fulfillment for FulfillmentOrder: ${details.fulfillmentOrderId}`));
          // Continue trying other fulfillment orders if they exist, but log the failure.
        } else {
          console.log(color("text", `[FulfillOrder] Successfully fulfilled Shopify FulfillmentOrder: ${details.fulfillmentOrderId}`));
        }
      }

      if (!allShopifyFulfillmentsSucceeded) {
        // Maybe only send a warning and continue? Or stop? Depends on business logic.
        await interaction.followUp({ // Use followUp because we deferred
          content: "⚠️ Warning: One or more Shopify fulfillment requests failed. Please check Shopify admin and logs. Proceeding with Discord updates.",
          ephemeral: true
        });
      } else {
        await interaction.editReply({ content: "Shopify fulfillment successful. Proceeding with Discord updates..." }); // Update status
      }

      // --- Database Update ---
      const OrderModel = getModel('Order');
      await OrderModel.findByIdAndUpdate(order._id, { $set: { status: 'completed', updatedAt: new Date() } }).exec();
      await updateTicketByChannelId(interaction.channelId, { stage: 'completed' }); // Update ticket stage
      console.log(color("text", `[FulfillOrder] Marked Order ${order.id} and Ticket ${interaction.channelId} as completed in DB.`));

      // --- Discord Updates ---
      const user = await interaction.client.users.fetch(ticket.userId).catch(() => null);
      const guildMember = await interaction.guild.members.fetch(ticket.userId).catch(() => null);

      // Rename Channel (before sending DM, in case DM fails)
      const currentChannel = interaction.channel as TextChannel;
      const newName = `completed-${currentChannel.name.replace(/^ticket-/i, '')}`.substring(0, 100);
      try {
        await currentChannel.setName(newName, `Order fulfilled by ${interaction.user.tag}`);
        console.log(color("text", `[FulfillOrder] Renamed channel ${interaction.channelId} to ${newName}.`));
      } catch (renameError) {
        console.error(color("error", `[FulfillOrder] Failed to rename channel ${interaction.channelId}: ${renameError}`));
        await interaction.followUp({ content: "Failed to rename the ticket channel.", ephemeral: true });
      }


      // Send DM
      if (user) {
        try {
          const dmEmbed = createCompletionMessageEmbed(lang, serverConfig['reviews-channel'], interaction.client);
          await user.send({ embeds: [dmEmbed] });
          console.log(color("text", `[FulfillOrder] Sent completion DM to user ${user.id}.`));
        } catch (dmError) {
          console.warn(color("warn", `[FulfillOrder] Failed to send completion DM to user ${ticket.userId}: ${dmError}. Maybe DMs are disabled?`));
          await interaction.followUp({ content: "Couldn't send DM to the user (they may have DMs disabled).", ephemeral: true });
        }
      } else {
        console.warn(color("warn", `[FulfillOrder] Could not fetch user ${ticket.userId} to send DM.`));
      }

      // Add Role
      if (guildMember && serverConfig['customer-role']) {
        try {
          await guildMember.roles.add(serverConfig['customer-role']);
          console.log(color("text", `[FulfillOrder] Added customer role to user ${guildMember.id}.`));
        } catch (roleError) {
          console.error(color("error", `[FulfillOrder] Failed to add customer role to user ${ticket.userId}: ${roleError}`));
          await interaction.followUp({ content: "Failed to add the customer role to the user.", ephemeral: true });
        }
      } else if (!guildMember) {
        console.warn(color("warn", `[FulfillOrder] User ${ticket.userId} not found in guild ${interaction.guildId}, cannot add role.`));
      }


      // --- Transcript Generation ---
      await interaction.editReply({ content: "Order fulfilled! Generating transcript..." }); // Final status before transcript

      try {
        const transcriptChannel = await interaction.client.channels.fetch(serverConfig.transcript).catch(() => null) as TextChannel | null;
        if (!transcriptChannel) {
          throw new Error(`Transcript channel ${serverConfig.transcript} not found or inaccessible.`);
        }

        const attachment = await createTranscript(currentChannel, {
          filename: `transcript-${order.id}-${currentChannel.id}.html`,
          poweredBy: false,
          footerText: `Exported {number} message{s} | BloxyFruit Transcript System | ${new Date().toLocaleString(lang === 'es' ? 'es-ES' : 'en-US')}`
        });

        const transcriptEmbed = createTranscriptEmbed(ticket, order, interaction.client); // Pass populated order
        await transcriptChannel.send({
          embeds: [transcriptEmbed],
          files: [attachment]
        });
        console.log(color("text", `[FulfillOrder] Transcript for ${interaction.channelId} sent to ${transcriptChannel.id}.`));
        await interaction.editReply({ content: "Order fulfilled and transcript generated!" });

      } catch (transcriptError: any) {
        console.error(color("error", `[FulfillOrder] Error generating or sending transcript for ${interaction.channelId}: ${transcriptError}`));
        await interaction.editReply({ content: `Order fulfilled, but failed to generate/send transcript: ${transcriptError.message || 'Unknown error'}` });
      }

    } catch (error: any) {
      console.error(color("error", `[FulfillOrder] Critical error during fulfillment for ticket ${interaction.channelId}: ${error}`));
      // Ensure the deferred reply is handled
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: `${t.GENERIC_ERROR || 'A critical error occurred during fulfillment:'} ${error.message || 'Unknown error'}`,
        }).catch(e => console.error(color("error", `[FulfillOrder] Failed to edit reply after critical error: ${e}`))); // Catch potential error editing reply itself
      } else {
        await interaction.reply({
          content: `${t.GENERIC_ERROR || 'A critical error occurred during fulfillment:'} ${error.message || 'Unknown error'}`,
          ephemeral: true
        }).catch(e => console.error(color("error", `[FulfillOrder] Failed to send reply after critical error: ${e}`)));
      }
    }
  },
};

export default command;
