import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    TextChannel,
    GuildMember,
    ChannelType,
    EmbedBuilder, // You might import specific embed functions instead
  } from 'discord.js';
  import { SlashCommand } from '~/types'; // Adjust path as needed
  
  // --- ASSUMED IMPORTS ---
  // These need to be accessible in your TS structure
  import { ticketStages, saveTicketStages } from '~/state/ticketState'; // Example path
  import { servers } from '~/config/server-config'; // Example path
  import { orders } from '~/database/mongo'; // Example path
  import {
    getFullfilmentOrderId,
    fullFillmentOrder,
  } from '~/utils/shopify'; // Example path
  import {
    createCompletionMessageEmbed,
    createTranscriptEmbed,
  } from '~/utils/embeds'; // Example path
  import { createTranscript } from 'discord-html-transcripts';
  // --- END ASSUMED IMPORTS ---
  
  const FulfillOrderCommand: SlashCommand = {
    command: new SlashCommandBuilder()
      .setName('fulfill-order')
      .setDescription('Mark a ticket as completed and fulfill the order.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // Optional baseline permission
  
    execute: async (interaction: ChatInputCommandInteraction) => {
      if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
          return interaction.reply({ content: 'This command can only be used in server text channels.', ephemeral: true });
      }
  
      const serverConfig = Object.values(servers).find(
          (server) => server.guild === interaction.guildId
      );
  
      if (!serverConfig) {
          return interaction.reply({ content: 'Server configuration not found.', ephemeral: true });
      }
  
      // Check if the member has the required admin role
      const member = interaction.member as GuildMember; // Type assertion
      if (!member.roles.cache.has(serverConfig['admin-role'])) {
          return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      }
  
      // Check if it's a ticket channel (basic check)
      if (!interaction.channel.name.startsWith('ticket-')) {
          return interaction.reply({ content: 'This command can only be used in active ticket channels.', ephemeral: true });
      }
  
      const ticketStage = ticketStages[interaction.channel.id];
      if (!ticketStage || !ticketStage.orderId || ticketStage.stage !== 'finished') {
        return interaction.reply({ content: 'This ticket is not in a state to be fulfilled or is missing order information.', ephemeral: true });
      }
  
      try {
          // Defer reply as this might take time
          await interaction.deferReply({ ephemeral: true });
  
          // --- Shopify Fulfillment ---
          // Add error handling for Shopify calls if needed
          const fulfillmentOrderId = await getFullfilmentOrderId(ticketStage.orderId);
          if (!fulfillmentOrderId || fulfillmentOrderId.length === 0) {
              await interaction.editReply({ content: 'Could not find fulfillment order ID in Shopify.' });
              return;
          }
          const fulfilledOrder = await fullFillmentOrder(fulfillmentOrderId[0]);
          // Maybe add checks on fulfilledOrder result?
  
          // --- Update Database ---
          await orders.findOneAndUpdate(
              { id: ticketStage.orderId },
              { $set: { status: 'completed' } }
          ).exec();
  
          // --- Rename Channel ---
          const baseName = interaction.channel.name.startsWith('ticket-') ? interaction.channel.name.slice(7) : interaction.channel.name;
          await (interaction.channel as TextChannel).setName(`completed-${baseName}`);
  
  
          // --- Notify User ---
          try {
              const user = await interaction.client.users.fetch(ticketStage.userId);
              const embed = createCompletionMessageEmbed(
                  ticketStage.language,
                  serverConfig['reviews-channel'],
                  interaction.client // Pass client if needed by embed function
              );
              await user.send({ embeds: [embed] });
          } catch (dmError) {
              console.warn(`Could not DM user ${ticketStage.userId}:`, dmError);
              await interaction.followUp({ content: `Order fulfilled, but failed to DM the user.`, ephemeral: true }); // Use followUp after deferral
          }
  
          // --- Add Customer Role ---
          try {
              const guildMember = await interaction.guild.members.fetch(ticketStage.userId);
              await guildMember.roles.add(serverConfig['customer-role']);
          } catch (roleError) {
              console.warn(`Could not add role to user ${ticketStage.userId}:`, roleError);
               await interaction.followUp({ content: `Order fulfilled, but failed to add the customer role.`, ephemeral: true });
          }
  
          // --- Generate Transcript ---
           let transcriptMessage = 'Order fulfilled successfully!';
           try {
              const transcriptChannel = await interaction.client.channels.fetch(serverConfig.transcript).catch(() => null) as TextChannel | null;
               if (transcriptChannel && interaction.channel instanceof TextChannel) {
                   const attachment = await createTranscript(interaction.channel, {
                      filename: `transcript-${ticketStage.orderId}.html`,
                      poweredBy: false,
                      footerText: `Exported {number} message{s} | BloxyFruit Transcript System | ${new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}`,
                   });
  
                   const transcriptEmbed = createTranscriptEmbed(ticketStage, interaction.client);
                   await transcriptChannel.send({
                      embeds: [transcriptEmbed],
                      files: [attachment]
                   });
                   transcriptMessage += ' Transcript generated and archived.';
               } else {
                   transcriptMessage += ' Could not find transcript channel or this is not a text channel; transcript not generated.';
                   console.warn('Transcript channel not found or invalid channel type.');
               }
           } catch (transcriptError) {
               console.error('Error creating transcript:', transcriptError);
               transcriptMessage += ' Failed to generate transcript.';
           }
  
          // --- Final Confirmation ---
          await interaction.editReply({ content: transcriptMessage });
  
          // --- Clean up ticket stage ---
          delete ticketStages[interaction.channel.id];
          saveTicketStages(); // Assuming this function persists the state
  
      } catch (error) {
          console.error('Error fulfilling order:', error);
          if (interaction.deferred || interaction.replied) {
              await interaction.editReply({ content: 'An unexpected error occurred while fulfilling the order.' });
          } else {
              await interaction.reply({ content: 'An unexpected error occurred while fulfilling the order.', ephemeral: true });
          }
      }
    },
    cooldown: 0,
  };
  
  export default FulfillOrderCommand;