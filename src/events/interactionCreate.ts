import { Interaction, CacheType } from "discord.js";
import { color } from '~/functions.js';
import { getTranslations } from '~/lang/index.js';
import { BotEvent, ButtonHandler } from "~/types.js";

const event: BotEvent = {
    name: "interactionCreate",
    execute: async (interaction: Interaction<CacheType>) => {
        if (interaction.isChatInputCommand()) {
            let command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(color("error", `[InteractionCreate] ❓ No command matching ${interaction.commandName} was found.`));
                try {
                    await interaction.reply({ content: "Sorry, I couldn't find that command!", ephemeral: true });
                } catch (replyError) {
                     console.error(color("error", `[InteractionCreate] Failed to send 'command not found' reply: ${replyError}`));
                }
                return;
            }
            
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(color("error", `[InteractionCreate] ❌ Error executing command ${interaction.commandName}: ${error}`));
                const t = getTranslations(
                    (interaction.locale as any) || 'en'
                );
                 const replyOptions = {
                    content: t.GENERIC_ERROR || 'An error occurred while executing this command.',
                    ephemeral: true,
                };
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(replyOptions);
                    } else {
                        await interaction.reply(replyOptions);
                    }
                } catch (replyError) {
                    console.error(color("error", `[InteractionCreate] Failed to send error reply for command ${interaction.commandName}: ${replyError}`));
                }
            }
            return;
        }

        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                if (!command.autocomplete) return;
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
            return;
        }

        if (interaction.isModalSubmit()) {
            const command = interaction.client.commands.get(interaction.customId);
            if (!command) {
                console.error(`No command matching ${interaction.customId} was found.`);
                return;
            }
            try {
                if (!command.modal) return;
                await command.modal(interaction);
            } catch (error) {
                console.error(error);
            }
            return;
        }

        if (interaction.isButton()) {
            let handler: ButtonHandler | undefined = undefined;
            const customId = interaction.customId;

            // Check for exact match first
            handler = interaction.client.buttonHandlersExact.get(customId);

            // If no exact match, check for prefix match
            if (!handler) {
                const prefixKeys = [...interaction.client.buttonHandlersPrefix.keys()];

                const matchingPrefix = prefixKeys
                    .sort((a, b) => b.length - a.length) // Sort descending by length
                    .find((prefix) => customId.startsWith(prefix));

                if (matchingPrefix) {
                    handler = interaction.client.buttonHandlersPrefix.get(matchingPrefix);
                }
            }

            // Execute handler if found
            if (handler) {
                console.log(color('text', `[InteractionCreate] Executing button handler for ${customId}`));
                try {
                    await handler.execute(interaction, interaction.client);
                } catch (error) {
                    console.error(color('error', `[InteractionCreate] ❌ Error executing button handler for ${customId}: ${error}`));
                    const t = getTranslations(
                        (interaction.locale as any) || 'en'
                    );
                    const replyOptions = {
                        content: t.GENERIC_ERROR || 'An error occurred processing this action.',
                        ephemeral: true,
                    };
                    try {
                        if (interaction.replied || interaction.deferred) {
                            await interaction.followUp(replyOptions);
                        } else {
                            await interaction.reply(replyOptions);
                        }
                    } catch (replyError) {
                        console.error(color("error", `[InteractionCreate] Failed to send error reply for button ${customId}: ${replyError}`));
                    }
                }
            } else {
                console.warn(color('warn', `[InteractionCreate] ❓ No button handler found for customId: ${customId}`));

                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: "This button isn't configured or is no longer active.", ephemeral: true });
                    }
                } catch (replyError) {
                    console.error(color("error", `[InteractionCreate] Failed to send 'unhandled button' reply: ${replyError}`));
                }
            }
            return;
        }
    }
};

export default event;