import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, GuildMember, TextChannel } from "discord.js";
import { Command } from "~/types";
import { servers } from '~/config/servers.js';
import { findTicketByChannelId } from "~/lib/TicketManager.js";
import { createTranscript } from 'discord-html-transcripts';
import { createTranscriptEmbed } from "~/lib/Embeds.js";
import { color } from "~/functions.js";
import type { IOrder } from "~/schemas/Order.js";

const command: Command = {
  command: new SlashCommandBuilder()
    .setName("generate-transcript")
    .setDescription("Manually generates an HTML transcript for the current ticket channel."),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: "This command can only be used in server text channels.", ephemeral: true });
      return;
    }

    // Basic check if it looks like a ticket channel (can be refined)
    const channelName = interaction.channel.name;
    if (!channelName.startsWith('completed-')) {
      await interaction.reply({ content: "This command should be used in a completed ticket.", ephemeral: true });
      return;
    }

    const serverConfig = Object.values(servers).find(s => s.guild === interaction.guildId);
    if (!serverConfig) {
      console.warn(color("warn", `[GenerateTranscript] Server config not found for guild ${interaction.guildId}`));
      await interaction.reply({ content: "Server configuration error.", ephemeral: true });
      return;
    }

    // Permissions Check
    const member = interaction.member as GuildMember;
    if (!member.roles.cache.has(serverConfig['admin-role'])) {
      await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Find ticket data - crucial for the embed context
      const ticket = await findTicketByChannelId(interaction.channelId, true);

      if (!ticket) {
        console.warn(color("warn", `[GenerateTranscript] Ticket data not found in DB for channel ${interaction.channelId}.`));
        await interaction.editReply({ content: "Ticket data not found. Transcript generation failed." });
        return;
      }

      if (ticket && (!ticket.order || typeof ticket.order !== 'object')) {
        console.error(color("error", `[GenerateTranscript] Order details not populated for ticket ${interaction.channelId}. Transcript embed might be incomplete.`));
        await interaction.editReply({ content: "Ticket data is incomplete. Transcript generation might be limited." });
      }

      const order = ticket.order as IOrder;
      const lang = ticket?.language || 'en';

      // Fetch the transcript channel
      const transcriptChannel = await interaction.client.channels.fetch(serverConfig.transcript).catch(() => null) as TextChannel | null;
      if (!transcriptChannel) {
        await interaction.editReply({ content: `Error: Transcript channel (<#${serverConfig.transcript}>) not found or inaccessible.` });
        console.error(color("error", `[GenerateTranscript] Transcript channel ${serverConfig.transcript} not found for server ${serverConfig.name}.`));
        return;
      }

      console.log(color('text', `[GenerateTranscript] Generating transcript for channel ${interaction.channelId}...`));

      // Generate Transcript
      const attachment = await createTranscript(interaction.channel as TextChannel, {
        filename: `transcript-${ticket?.orderId ?? interaction.channelId}-${Date.now()}.html`,
        poweredBy: false,
        footerText: `Exported {number} message{s} | BloxyFruit Transcript System | ${new Date().toLocaleString(lang === 'es' ? 'es-ES' : 'en-US')}`
      });

      // Create Embed
      const transcriptEmbed = createTranscriptEmbed(
        {
          orderId: ticket?.orderId ?? 'N/A',
          robloxUsername: ticket?.robloxUsername ?? 'N/A',
          timezone: ticket?.timezone ?? 'N/A'
        },
        order ?? { items: [], id: ticket?.orderId ?? 'N/A', _id: 'N/A', status: 'unknown', createdAt: new Date(), updatedAt: new Date() },
        interaction.client
      );

      // Send to Transcript Channel
      await transcriptChannel.send({
        content: `Manually generated transcript for channel: #${interaction.channel.name} (${interaction.channelId})`,
        embeds: [transcriptEmbed],
        files: [attachment]
      });

      console.log(color('text', `[GenerateTranscript] Transcript for ${interaction.channelId} sent to ${transcriptChannel.id}.`));
      await interaction.editReply({ content: "Transcript generated and sent successfully!" });

    } catch (error: any) {
      console.error(color("error", `[GenerateTranscript] Error generating transcript for ${interaction.channelId}: ${error}`));
      await interaction.editReply({
        content: `Failed to generate transcript: ${error.message || 'Unknown error'}`,
      });
    }
  },
};

export default command;
