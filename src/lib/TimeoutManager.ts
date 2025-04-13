import { color } from '~/functions.js';

// In-memory store for channel deletion timeouts
// Maps channelId to the NodeJS.Timeout object
const activeTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Stores the timeout ID for a specific channel's deletion task.
 * Clears any pre-existing timeout for the same channel before adding.
 * @param channelId - The Discord channel ID.
 * @param timeoutId - The NodeJS.Timeout ID returned by setTimeout.
 */
export function addChannelTimeout(channelId: string, timeoutId: NodeJS.Timeout): void {
    cancelChannelTimeout(channelId);
    activeTimeouts.set(channelId, timeoutId);
    console.log(color('text', `[TimeoutManager] Added deletion timeout for channel ${channelId}.`));
}

/**
 * Cancels and removes the stored timeout for a specific channel.
 * @param channelId - The Discord channel ID.
 * @returns True if a timeout was found and cleared, false otherwise.
 */
export function cancelChannelTimeout(channelId: string): boolean {
    const timeoutId = activeTimeouts.get(channelId);
    if (timeoutId) {
        clearTimeout(timeoutId);
        activeTimeouts.delete(channelId);
        console.log(color('text', `[TimeoutManager] Cancelled and removed deletion timeout for channel ${channelId}.`));
        return true;
    }
    console.log(color('text', `[TimeoutManager] No active timeout found to cancel for channel ${channelId}.`));
    return false;
}

/**
 * Checks if a timeout is currently active for a channel.
 * @param channelId - The Discord channel ID.
 * @returns True if a timeout exists in the manager, false otherwise.
 */
export function hasActiveTimeout(channelId: string): boolean {
    return activeTimeouts.has(channelId);
}
