import { GuildTextBasedChannel } from 'discord.js';
import { color } from '~/functions.js';

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
