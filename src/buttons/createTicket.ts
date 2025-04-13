import {
  ButtonInteraction,
  CacheType,
  ChannelType,
  PermissionsBitField,
} from 'discord.js';
import { ButtonHandler } from '~/types.js';
import { servers } from '~/config/servers.js';
import {
  createTicketInDB,
  findTicketsByUserId,
  updateTicketByChannelId,
} from '~/lib/TicketManager.js';
import {
  createWelcomeEmbed,
  createLanguageSelection,
} from '~/lib/Embeds.js';
import { addChannelTimeout } from '~/lib/TimeoutManager.js';
import { scheduleChannelDeletion } from '~/lib/DiscordUtils.js';
import { color } from '~/functions.js';
import { getTranslations } from '~/lang/index.js';

const TICKET_TIMEOUT = 60 * 1000 * 2; // 2 minutes timeout for inactivity

const handleTimeoutDeletion = async (channelId: string): Promise<void> => {
  console.log(color('text', `[CreateTicketCallback] Handling timeout cleanup for channel ${channelId}.`));
  try {
      // Find the ticket and update its stage to 'cancelled'
      const updatedTicket = await updateTicketByChannelId(channelId, {
          stage: 'cancelled',
      });
      if (updatedTicket) {
          console.log(color('text', `[CreateTicketCallback] Marked ticket ${updatedTicket._id} (channel ${channelId}) as cancelled due to inactivity timeout.`));
      } else {
          // This might happen if the ticket was deleted manually before the timeout callback ran
          console.warn(color('warn', `[CreateTicketCallback] Ticket for channel ${channelId} not found during timeout cleanup.`));
      }
  } catch (error) {
      console.error(color('error', `[CreateTicketCallback] Error updating ticket stage for timed-out channel ${channelId}: ${error}`));
  }
};

const createTicketHandler: ButtonHandler = {
  customIdPrefix: 'create_ticket_',
  execute: async (interaction: ButtonInteraction<CacheType>) => {
    const t = getTranslations("en");

    try {
      // Extract server name from the custom ID
      const serverName = interaction.customId.replace(
        'create_ticket_',
        ''
      ) as keyof typeof servers;
      const serverConfig = servers[serverName];

      await interaction.deferReply({ ephemeral: true });

      if (!serverConfig || !interaction.guild) {
        console.warn(color('warn', `[CreateTicket] Invalid server config or guild for ID: ${interaction.customId}`));
        await interaction.editReply({
          content: t.GENERIC_ERROR,
        });
        return;
      }

      // Check Ticket Limit
      const userTickets = await findTicketsByUserId(
        interaction.user.id,
        serverName
      );
      // Filter for non-finished tickets
      const activeUserTickets = userTickets.filter(
        (ticket) => ticket.stage !== 'finished' && ticket.stage !== 'completed' && ticket.stage !== 'cancelled'
      );

      if (activeUserTickets.length >= 2) {
        await interaction.editReply({
          content: 'You can only have 2 active tickets at a time in this server.',
        });
        return;
      }

      const channelName = `ticket-${interaction.user.username.substring(0, 25)}`;
      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        // parent: serverConfig.category, // consider this for future update
        permissionOverwrites: [
          {
            id: interaction.guild.id, // @everyone role
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.EmbedLinks,
              PermissionsBitField.Flags.AttachFiles,
            ],
          },
          {
            id: interaction.client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageMessages,
              PermissionsBitField.Flags.EmbedLinks,
            ],
          },
          {
            id: serverConfig['admin-role'],
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageMessages,
              PermissionsBitField.Flags.EmbedLinks,
              PermissionsBitField.Flags.AttachFiles,
            ],
          },
        ],
        topic: `Ticket for ${interaction.user.tag} (ID: ${interaction.user.id}). Order: Pending.`,
      });

      // Create Ticket in Database
      const newTicket = await createTicketInDB({
        channelId: ticketChannel.id,
        userId: interaction.user.id,
        serverName: serverName,
      });
      console.log(color('text', `[CreateTicket] Created DB entry for ticket ${newTicket._id} in channel ${ticketChannel.id}`));

      // Schedule Inactivity Deletion & Store Timeout ID
      const timeoutId = scheduleChannelDeletion(
        ticketChannel,
        TICKET_TIMEOUT,
        'Ticket Inactivity',
        handleTimeoutDeletion
      );
      
      // Store the timeout ID using the manager only if scheduling was successful
      if (timeoutId) {
        addChannelTimeout(ticketChannel.id, timeoutId);
      } else {
        console.error(color('error', `[CreateTicket] Failed to schedule deletion for channel ${ticketChannel.id}. Timeout ID was null.`));
      }
      
      // Send Welcome Message
      const welcomeEmbed = createWelcomeEmbed(interaction.client);
      const languageButtons = createLanguageSelection();
      await ticketChannel.send({
        content: `${interaction.user}, welcome!`,
        embeds: [welcomeEmbed],
        components: [languageButtons],
      });
      
      // Send confirmation message to the user
      await interaction.editReply({
        content: `Ticket created! Please head over to ${ticketChannel} to continue.`,
      });
      
    } catch (error) {
      console.error(
        color('error', `[CreateTicket] Error creating ticket: ${error}`)
      );
      const errorReply = {
        content: 'Sorry, there was an error creating your ticket. Please try again later or contact support.',
        ephemeral: true,
      };
      try {
        // Use editReply if deferred, otherwise reply
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(errorReply);
        } else {
          await interaction.reply(errorReply);
        }
      } catch (replyError) {
        console.error(
          color(
            'error',
            `[CreateTicket] Failed to send error reply: ${replyError}`
          )
        );
      }
    }
  },
};

export default createTicketHandler;
