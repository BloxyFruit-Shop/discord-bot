import { ActivityType, ChannelType, Client, Events } from 'discord.js';
import { servers } from '~/config/servers.js';
import { createClaimEmbed, createClaimButton } from '~/lib/Embeds.js';
import { getModel } from '~/models.js';
import { deleteTicketByChannelId } from '~/lib/TicketManager.js';
import { color, handleTimeoutDeletion } from '~/functions.js';
import { BotEvent } from '~/types.js';
import { cleanupOrphanedChannels, scheduleChannelDeletion } from '~/lib/DiscordUtils.js';
import { addChannelTimeout } from '~/lib/TimeoutManager.js';

const event: BotEvent = {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client<true>) {
        console.log(color('text', `✅ Bot is ready! Logged in as ${color('variable', client.user.tag)}`));
        client.user.setActivity('Bloxy Market', { type: ActivityType.Watching });

        try {
            // Cleanup Tickets for Deleted Channels
            console.log(color('text', '🧹 Starting cleanup of tickets for deleted channels or uncompleted tickets...'));
            const Ticket = getModel('Ticket');
            const allTickets = await Ticket.find({}).lean();
            let cleanedCount = 0;
            for (const ticket of allTickets) {
                try {
                    // Try to fetch the channel
                    const ch = await client.channels.fetch(ticket.channelId);

                    if (ticket.stage === 'finished' || ticket.stage === 'completed' || !ch || ch.type !== ChannelType.GuildText) continue;

                    // Reset the timeout if the channel is still active
                    const timeoutId = scheduleChannelDeletion(
                        ch,
                        1000 * 60 * 1, // 1 minute timeout for inactivity instead of two, so they can be deleted faster
                        'Ticket Inactivity',
                        handleTimeoutDeletion
                    );

                    // Store the timeout ID using the manager only if scheduling was successful
                    if (timeoutId) {
                        addChannelTimeout(ch.id, timeoutId);
                    } else {
                        console.error(color('error', `[Clean Up] Failed to schedule deletion for channel ${ch.id}. Timeout ID was null.`));
                    }
                } catch (error: any) {
                    // DiscordAPIError[10003]: Unknown Channel
                    if (error.code === 10003 || error.httpStatus === 404) {
                        console.log(color('text', `🗑️ Channel ${color('variable', ticket.channelId)} not found. Deleting corresponding ticket document...`));
                        await deleteTicketByChannelId(ticket.channelId);
                        cleanedCount++;
                    } else {
                        // Log errors but don't delete the ticket, might be temporary issue
                        console.error(color('error', `⚠️ Error fetching channel ${ticket.channelId} during cleanup (ticket not deleted): ${error.message}`));
                    }
                }
            }
            console.log(color('text', `🧹 Cleanup finished. Removed ${color('variable', cleanedCount)} ticket documents for deleted channels.`));

            await cleanupOrphanedChannels(client, servers);

            // Setup Claim Channels
            console.log(color('text', '🔧 Setting up claim channels...'));
            for (const [serverKey, serverConfig] of Object.entries(servers)) {
                try {
                    const claimChannel = await client.channels.fetch(serverConfig.claim);

                    if (!claimChannel || claimChannel.type !== ChannelType.GuildText) {
                        console.warn(color('error', `❓ Claim channel ${serverConfig.claim} for server ${serverKey} not found or not a text channel.`));
                        continue; // Skip to the next server
                    }

                    try {
                        const messages = await claimChannel.messages.fetch({ limit: 50 });
                        const botMessages = messages.filter(msg => msg.author.id === client.user.id);
                        if (botMessages.size > 0) {
                            await claimChannel.bulkDelete(botMessages);
                            console.log(color('text', `🧹 Cleared ${botMessages.size} bot messages in claim channel for ${serverKey}.`));
                        }
                    } catch (err) {
                        console.error(color('error', `❌ Failed to clear messages in claim channel for ${serverKey}: ${err}`));
                    }

                    // Send the new claim embed and button
                    const claimEmbed = createClaimEmbed(client);
                    const claimButton = createClaimButton(serverKey as keyof typeof servers);

                    await claimChannel.send({
                        embeds: [claimEmbed],
                        components: [claimButton],
                    });
                    console.log(color('text', `✅ Setup complete for claim channel in ${serverKey}.`));

                } catch (error) {
                    console.error(color('error', `❌ Failed to setup claim channel for ${serverKey}: ${error}`));
                }
            }
            console.log(color('text', '🎉 Bot startup sequence completed successfully.'));

        } catch (error) {
            console.error(color('error', `❌ Fatal error during 'ready' event execution: ${error}`));
            process.exit(1);
        }
    },
};

export default event;
