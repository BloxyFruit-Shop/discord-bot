import {
  ButtonInteraction,
  CacheType,
} from 'discord.js';
import { ButtonHandler } from '~/types.js';
import { findTicketByChannelId, updateTicketByChannelId } from '~/lib/TicketManager.js';
import { createOrderVerificationEmbed } from '~/lib/Embeds.js';
import { color } from '~/functions.js';
import { getTranslations, LanguageCode } from '~/lang/index.js';

const languageSelectHandler: ButtonHandler = {
  customIdPrefix: "lang_",

  execute: async (interaction: ButtonInteraction<CacheType>) => {
      const channelId = interaction.channelId;
      const userId = interaction.user.id;

      // Extract language code from customId
      const selectedLang = interaction.customId.replace("lang_", "") as LanguageCode;

      // validate if the extracted part is a valid language code
      if (selectedLang !== 'en' && selectedLang !== 'es') {
          console.warn(color('warn', `[LanguageSelect] Extracted invalid language code '${selectedLang}' from customId: ${interaction.customId}`));
          await interaction.reply({ content: "An unexpected error occurred with language selection.", ephemeral: true });
          return;
      }

      const t = getTranslations(selectedLang);

      try {
          const ticket = await findTicketByChannelId(channelId);

          // Validations
          if (!ticket) {
              console.warn(color('warn', `[LanguageSelect] Ticket not found for channel ${channelId}`));
              await interaction.reply({ content: t.TICKET_NOT_FOUND_GENERIC, ephemeral: true });
              return;
          }

          if (ticket.userId !== userId) {
              await interaction.reply({ content: t.TICKET_NOT_OWNER, ephemeral: true });
              return;
          }

          if (ticket.stage !== 'languagePreference') {
              console.warn(color('warn', `[LanguageSelect] Ticket ${ticket._id} in channel ${channelId} is not in languagePreference stage (current: ${ticket.stage})`));
              await interaction.reply({ content: t.TICKET_WRONG_STAGE, ephemeral: true });
              return;
          }

          const updatedTicket = await updateTicketByChannelId(channelId, {
              language: selectedLang,
              stage: 'orderVerification',
          });

          if (!updatedTicket) {
               console.error(color('error', `[LanguageSelect] Failed to update ticket ${ticket._id} for channel ${channelId}`));
               await interaction.reply({ content: t.GENERIC_ERROR, ephemeral: true });
               return;
          }

          console.log(color('text', `[LanguageSelect] User ${userId} selected language '${selectedLang}' for ticket ${ticket._id} in channel ${channelId}. Stage -> orderVerification.`));

          // Create the next step embed
          const orderEmbed = createOrderVerificationEmbed(selectedLang, interaction.client);

          await interaction.update({
              embeds: [orderEmbed],
              components: [], // Remove the language buttons
          });

      } catch (error) {
          console.error(color('error', `[LanguageSelect] Error processing language selection for channel ${channelId}: ${error}`));
          const errorReply = { content: t.GENERIC_ERROR, ephemeral: true };
          try {
              if (interaction.replied || interaction.deferred) {
                  await interaction.followUp(errorReply);
              } else {
                  await interaction.reply(errorReply);
              }
          } catch (replyError) {
              console.error(color("error", `[LanguageSelect] Failed to send error reply: ${replyError}`));
          }
      }
  },
};

export default languageSelectHandler;
