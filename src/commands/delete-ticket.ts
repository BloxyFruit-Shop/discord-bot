import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, GuildMember, TextChannel } from "discord.js";
import { Command } from "~/types";
import { servers } from '~/config/servers.js';
import { findTicketByChannelId, deleteTicketByChannelId } from "~/lib/TicketManager.js";
import { color } from "~/functions.js";

const command: Command = {
    command: new SlashCommandBuilder()
        .setName("delete-ticket")
        .setDescription("Deletes the current ticket channel and associated data."),
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
            await interaction.reply({ content: "This command can only be used in server text channels.", ephemeral: true });
            return;
        }

        const serverConfig = Object.values(servers).find(s => s.guild === interaction.guildId);
        if (!serverConfig) {
            console.warn(color("warn", `[DeleteTicket] Server config not found for guild ${interaction.guildId}`));
            await interaction.reply({ content: "Server configuration error.", ephemeral: true });
            return;
        }

        // Permissions Check
        const member = interaction.member as GuildMember;
        if (!member.roles.cache.has(serverConfig['admin-role'])) {
            await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
            return;
        }

        // Check if it's potentially a ticket channel
        const ticket = await findTicketByChannelId(interaction.channelId);
        if (!ticket) {
            // Fallback check for channels missed by DB but matching name pattern (e.g., completed/cancelled)
            if (!interaction.channel.name.startsWith('ticket-') && !interaction.channel.name.startsWith('completed-') && !interaction.channel.name.startsWith('cancelled-')) {
                 await interaction.reply({ content: "This command can only be used in ticket channels (or completed/cancelled ones).", ephemeral: true });
                 return;
            }
             console.log(color("text", `[DeleteTicket] Deleting channel ${interaction.channelId} by name pattern (not found in DB).`));
        }

        try {
            await interaction.reply({ content: "Deleting ticket...", ephemeral: true });

            // Attempt to delete from DB first (if found)
            if (ticket) {
                await deleteTicketByChannelId(interaction.channelId);
            }

            // Delete the channel
            await interaction.channel.delete(`Ticket deleted by ${interaction.user.tag}`);

            // No need to edit reply as the channel will be gone. Log success.
            console.log(color("text", `[DeleteTicket] Ticket channel ${interaction.channelId} deleted successfully by ${interaction.user.tag}.`));

        } catch (error: any) {
            console.error(color("error", `[DeleteTicket] Error deleting ticket ${interaction.channelId}: ${error}`));
              await interaction.followUp({
                  content: `There was an error deleting the ticket: ${error.message || 'Unknown error'}`,
                  ephemeral: true
              });
        }
    },
};

export default command;
