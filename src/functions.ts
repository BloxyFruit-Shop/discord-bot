import chalk from "chalk"
import { GuildMember, PermissionFlagsBits, PermissionResolvable, TextChannel } from "discord.js"
import { deleteTicketByChannelId } from './lib/TicketManager.js';

type colorType = "text" | "variable" | "error" | "warn"

const themeColors = {
    text: "#ff8e4d",
    variable: "#ff624d",
    error: "#f5426c",
    warn: "#f0b323"
}

export const getThemeColor = (color: colorType) => Number(`0x${themeColors[color].substring(1)}`)

export const color = (color: colorType, message: any) => {
    return chalk.hex(themeColors[color])(message)
}

export const checkPermissions = (member: GuildMember, permissions: Array<PermissionResolvable>) => {
    let neededPermissions: PermissionResolvable[] = []
    permissions.forEach(permission => {
        if (!member.permissions.has(permission)) neededPermissions.push(permission)
    })
    if (neededPermissions.length === 0) return null
    return neededPermissions.map(p => {
        if (typeof p === "string") return p.split(/(?=[A-Z])/).join(" ")
        else return Object.keys(PermissionFlagsBits).find(k => Object(PermissionFlagsBits)[k] === p)?.split(/(?=[A-Z])/).join(" ")
    })
}

export const sendTimedMessage = (message: string, channel: TextChannel, duration: number) => {
    channel.send(message)
        .then(m => setTimeout(async () => (await channel.messages.fetch(m)).delete(), duration))
    return
}

export const handleTimeoutDeletion = async (channelId: string): Promise<void> => {
  console.log(color('text', `[CreateTicketCallback] Handling timeout cleanup for channel ${channelId}.`));
  try {
    // Delete the ticket from db
    await deleteTicketByChannelId(channelId);
    console.log(color('text', `[CreateTicketCallback] Deleted ticket associated with channel ${channelId}.`));
  } catch (error) {
    console.error(color('error', `[CreateTicketCallback] Error updating ticket stage for timed-out channel ${channelId}: ${error}`));
  }
};

/**
 * Helper function to introduce a delay.
 * @param ms - Milliseconds to wait.
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));