import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { Command } from "~/types.js";
import { servers } from '~/config/servers.js';
import { cleanupOrphanedChannels } from "~/lib/DiscordUtils.js";
import { color } from "~/functions.js";

const command: Command = {
    command: new SlashCommandBuilder()
        .setName("clear-stale")
        .setDescription("Manually cleans up orphaned ticket channels (no DB entry) in this server."),
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guildId) {
            await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
            return;
        }

        const serverConfig = Object.values(servers).find(s => s.guild === interaction.guildId);
        if (!serverConfig) {
            console.warn(color("warn", `[ClearStale] Server config not found for guild ${interaction.guildId}`));
            await interaction.reply({ content: "Server configuration error.", ephemeral: true });
            return;
        }

        // Permissions Check
        const member = interaction.member as GuildMember;
        if (!member?.roles.cache.has(serverConfig['admin-role'])) {
            await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const deletedCount = await cleanupOrphanedChannels(
                interaction.client,
                servers,
                interaction.guildId
            );

            await interaction.editReply({
                content: `Stale channel cleanup complete for this server. Deleted ${deletedCount} orphaned channel(s). Check console logs for details.`
            });

        } catch (error: any) {
            console.error(color("error", `[ClearStale] Error during manual cleanup for guild ${interaction.guildId}: ${error}`));
            await interaction.editReply({
                content: `An unexpected error occurred during cleanup: ${error.message || 'Unknown error'}`,
            });
        }
    },
};

export default command;
