import { ChannelType, Client, Guild, GuildTextBasedChannel, TextChannel } from 'discord.js';
import { color } from '~/functions.js';
import { getModel } from '~/models.js';
import type { ServerConfig } from '~/types/config.js';

/**
 * Schedules a Discord channel for deletion after a specified delay.
 * Includes error handling and an optional callback on successful deletion attempt.
 * Returns the NodeJS Timeout ID so it can be cancelled.
 *
 * @param channel - The channel object to delete.
 * @param delayMs - The delay in milliseconds before attempting deletion.
 * @param reason - Optional reason for the deletion (for logging).
 * @param onDeleteSuccess - Optional callback function to execute after successful deletion attempt (passes channelId).
 * @returns The NodeJS.Timeout ID for the scheduled task, or null if scheduling failed.
 */
export function scheduleChannelDeletion(
    channel: GuildTextBasedChannel,
    delayMs: number,
    reason?: string,
    onDeleteSuccess?: (channelId: string) => Promise<void> | void
): NodeJS.Timeout | null {
    if (!channel) {
        console.warn(color('error', `[DiscordUtils] Attempted to schedule deletion for a null/undefined channel.`));
        return null;
    }

    const logReason = reason ? ` Reason: ${reason}` : '';
    console.log(color('text', `[DiscordUtils] Scheduling channel ${color('variable', channel.id)} (${channel.name}) for deletion in ${delayMs / 1000}s.${logReason}`));

    const timeoutId = setTimeout(async () => {
        let deletionAttemptedOrCompleted = false;
        try {
            // Re-fetch the channel right before deleting to ensure it still exists
            const freshChannel = await channel.client.channels.fetch(channel.id).catch(() => null);

            if (freshChannel && freshChannel.isTextBased() && !freshChannel.isDMBased()) {
                await freshChannel.delete(`Automatic deletion: ${reason || 'Inactive Ticket'}`);
                console.log(color('text', `[DiscordUtils] Successfully deleted channel ${color('variable', channel.id)} (${channel.name}).${logReason}`));
                deletionAttemptedOrCompleted = true;
            } else {
                 console.log(color('text', `[DiscordUtils] Channel ${color('variable', channel.id)} was already deleted or is not deletable when timeout executed.`));
                 deletionAttemptedOrCompleted = true; // Treat as completed if channel is gone
            }
        } catch (error: any) {
            if (error.code === 50013) { // Missing Permissions
                 console.warn(color('warn', `[DiscordUtils] Could not delete channel ${color('variable', channel.id)} (${channel.name}) due to permissions: ${error.message}`));
                 deletionAttemptedOrCompleted = true;
            } else if (error.code === 10003) { // Unknown Channel
                 console.log(color('text', `[DiscordUtils] Channel ${color('variable', channel.id)} was already deleted (caught during delete attempt).`));
                 deletionAttemptedOrCompleted = true;
            } else {
                console.error(color('error', `[DiscordUtils] Unexpected error deleting channel ${color('variable', channel.id)} (${channel.name}): ${error}`), error);
            }
        } finally {
            // Execute the callback if deletion was attempted/completed and callback exists
            if (deletionAttemptedOrCompleted && onDeleteSuccess) {
                try {
                    console.log(color('text', `[DiscordUtils] Executing onDeleteSuccess callback for channel ${channel.id}.`));
                    await onDeleteSuccess(channel.id);
                } catch (callbackError) {
                    console.error(color('error', `[DiscordUtils] Error executing onDeleteSuccess callback for channel ${channel.id}: ${callbackError}`));
                }
            }
        }
    }, delayMs);

    return timeoutId;
}

/**
 * Finds and deletes orphaned ticket channels (channels matching ticket patterns
 * but having no corresponding entry in the Ticket database).
 *
 * @param client - The Discord Client instance.
 * @param servers - The server configuration object.
 * @param targetGuildId - Optional: If provided, only cleans up channels in this specific guild.
 * @returns A promise resolving to the number of channels successfully deleted.
 */
export async function cleanupOrphanedChannels(
    client: Client<true>,
    servers: Record<string, ServerConfig>,
    targetGuildId?: string
): Promise<number> {
    console.log(color('text', `[DiscordUtils] Starting cleanup of orphaned ticket channels${targetGuildId ? ` for guild ${targetGuildId}` : ''}...`));
    let deletedCount = 0;
    const channelsToDelete: TextChannel[] = [];

    try {
        // Get all channel IDs from the Ticket database
        const Ticket = getModel('Ticket');
        const tickets = await Ticket.find({}, 'channelId').lean();
        const dbChannelIds = new Set(tickets.map(t => t.channelId));
        console.log(color('text', `[DiscordUtils] Found ${dbChannelIds.size} ticket channel IDs in the database.`));

        // Determine which guilds to check
        let guildsToCheck: Guild[] = [];
        if (targetGuildId) {
            // Check only the target guild
            const guild = await client.guilds.fetch(targetGuildId).catch(() => null);
            if (guild) {
                guildsToCheck.push(guild);
            } else {
                console.warn(color('warn', `[DiscordUtils] Could not fetch target guild ${targetGuildId}. Skipping cleanup for this guild.`));
            }
        } else {
            // Check all configured guilds
            for (const serverConfig of Object.values(servers)) {
                const guild = await client.guilds.fetch(serverConfig.guild).catch(() => null);
                if (guild) {
                    guildsToCheck.push(guild);
                } else {
                    console.warn(color('warn', `[DiscordUtils] Could not fetch guild ${serverConfig.guild} for server ${serverConfig.name}. Skipping.`));
                }
            }
        }

        // Iterate through the selected guilds
        for (const guild of guildsToCheck) {
            try {
                console.log(color('text', `[DiscordUtils] Checking guild: ${guild.name} (${guild.id})`));

                // Fetch and filter channels in the guild
                const guildChannels = await guild.channels.fetch();
                const potentialOrphans = guildChannels.filter(
                    (ch): ch is TextChannel =>
                        ch !== null &&
                        ch.type === ChannelType.GuildText &&
                        (ch.name.startsWith('ticket-') || ch.name.startsWith('cancelled-'))
                );

                console.log(color('text', `[DiscordUtils] Found ${potentialOrphans.size} potential ticket channels in ${guild.name}.`));

                // Identify orphans by checking against DB IDs
                potentialOrphans.forEach(channel => {
                    if (!dbChannelIds.has(channel.id)) {
                        console.log(color('text', `[DiscordUtils] Identified orphaned channel: #${channel.name} (${channel.id}) in ${guild.name}.`));
                        channelsToDelete.push(channel);
                    }
                });

            } catch (guildError) {
                console.error(color('error', `[DiscordUtils] Error processing guild ${guild.id} (${guild.name}): ${guildError}`));
            }
        }

        // Delete identified orphaned channels
        if (channelsToDelete.length > 0) {
            console.log(color('text', `[DiscordUtils] Attempting to delete ${channelsToDelete.length} orphaned channels...`));
            const deletionPromises: Promise<void>[] = [];

            for (const channel of channelsToDelete) {
                const deletePromise = channel.delete(`Orphaned ticket channel cleanup (no DB entry)`)
                    .then(() => {
                        deletedCount++;
                        console.log(color('text', `[DiscordUtils] Deleted orphaned channel ${channel.id} (${channel.name}) in guild ${channel.guild.name}.`));
                    })
                    .catch(error => {
                        if (error.code === 10003) {
                             console.log(color('text', `[DiscordUtils] Orphaned channel ${channel.id} (${channel.name}) was already deleted.`));
                        } else if (error.code === 50013) {
                             console.warn(color('warn', `[DiscordUtils] Missing permissions to delete orphaned channel ${channel.id} (${channel.name}) in guild ${channel.guild.name}.`));
                        } else {
                            console.error(color('error', `[DiscordUtils] Failed to delete orphaned channel ${channel.id} (${channel.name}): ${error}`));
                        }
                    });
                deletionPromises.push(deletePromise);
                await new Promise(resolve => setTimeout(resolve, 200)); // Tiny delay to avoid rate limits
            }

            await Promise.all(deletionPromises);
        } else {
            console.log(color('text', `[DiscordUtils] No orphaned channels found to delete${targetGuildId ? ` in guild ${targetGuildId}` : ''}.`));
        }

    } catch (error) {
        console.error(color('error', `[DiscordUtils] Critical error during orphaned channel cleanup: ${error}`));
    }

    console.log(color('text', `[DiscordUtils] Orphaned channel cleanup finished. Deleted ${deletedCount} channels${targetGuildId ? ` in guild ${targetGuildId}` : ''}.`));
    return deletedCount;
}