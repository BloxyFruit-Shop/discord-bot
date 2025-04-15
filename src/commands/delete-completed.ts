import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, GuildMember, TextChannel } from "discord.js";
import { Command } from "~/types.js";
import { servers } from '~/config/servers.js';
import { color } from "~/functions.js";

const command: Command = {
  command: new SlashCommandBuilder()
    .setName("delete-completed")
    .setDescription("Deletes all completed ticket channels (named completed-*) in this server."),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const serverConfig = Object.values(servers).find(s => s.guild === interaction.guildId);
    if (!serverConfig) {
      console.warn(color("warn", `[DeleteCompleted] Server config not found for guild ${interaction.guildId}`));
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
      // Fetch channels from the guild - use cache first for speed, but fetch could be more accurate if needed.
      const channels = interaction.guild.channels.cache;
      const completedChannels = channels.filter(
        (channel): channel is TextChannel => // Type guard
          channel.type === ChannelType.GuildText &&
          channel.name.startsWith('completed-')
      );

      if (completedChannels.size === 0) {
        await interaction.editReply({ content: "No completed ticket channels found to delete." });
        return;
      }

      let deletedCount = 0;
      let failedCount = 0;
      const deletionPromises: Promise<void>[] = [];

      console.log(color('text', `[DeleteCompleted] Attempting to delete ${completedChannels.size} completed channels in guild ${interaction.guildId}...`));

      completedChannels.forEach(channel => {
        const deletePromise = channel.delete(`Bulk delete completed tickets by ${interaction.user.tag}`)
          .then(() => {
            deletedCount++;
            console.log(color('text', `[DeleteCompleted] Deleted channel ${channel.id} (${channel.name})`));
          })
          .catch(error => {
            failedCount++;
            console.error(color('error', `[DeleteCompleted] Failed to delete channel ${channel.id} (${channel.name}): ${error}`));
          });
        deletionPromises.push(deletePromise);
      });

      // Wait for all deletion attempts to finish
      await Promise.all(deletionPromises);

      let replyMessage = `Successfully deleted ${deletedCount} completed ticket channel(s).`;
      if (failedCount > 0) {
        replyMessage += ` Failed to delete ${failedCount} channel(s) (check console logs for details).`;
      }

      await interaction.editReply({ content: replyMessage });

    } catch (error: any) {
      console.error(color("error", `[DeleteCompleted] Error during bulk deletion process: ${error}`));
      await interaction.editReply({
        content: `An unexpected error occurred: ${error.message || 'Unknown error'}`,
      });
    }
  },
};

export default command;
