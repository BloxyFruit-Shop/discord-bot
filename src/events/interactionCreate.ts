import { Interaction, CacheType, ButtonInteraction } from "discord.js";
import { color } from '~/functions.js';
import { getTranslations } from '~/lang/index.js';
import { BotEvent, ButtonHandler } from "~/types.js";

const event: BotEvent = {
    name: "interactionCreate",
    execute: async (interaction: Interaction<CacheType>) => {
        if (interaction.isChatInputCommand()) {
            let command = interaction.client.slashCommands.get(interaction.commandName);
            let cooldown = interaction.client.cooldowns.get(`${interaction.commandName}-${interaction.user.username}`);
            if (!command) return;
            if (command.cooldown && cooldown) {
                if (Date.now() < cooldown) {
                    interaction.reply(`You have to wait ${Math.floor(Math.abs(Date.now() - cooldown) / 1000)} second(s) to use this command again.`);
                    setTimeout(() => interaction.deleteReply(), 5000);
                    return;
                }
                interaction.client.cooldowns.set(`${interaction.commandName}-${interaction.user.username}`, Date.now() + command.cooldown * 1000);
                setTimeout(() => {
                    interaction.client.cooldowns.delete(`${interaction.commandName}-${interaction.user.username}`);
                }, command.cooldown * 1000);
            } else if (command.cooldown && !cooldown) {
                interaction.client.cooldowns.set(`${interaction.commandName}-${interaction.user.username}`, Date.now() + command.cooldown * 1000);
            }
            command.execute(interaction);
            return;
        }

        if (interaction.isAutocomplete()) {
            const command = interaction.client.slashCommands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                if (!command.autocomplete) return;
                command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
            return;
        }

        if (interaction.isModalSubmit()) {
            const command = interaction.client.slashCommands.get(interaction.customId);
            if (!command) {
                console.error(`No command matching ${interaction.customId} was found.`);
                return;
            }
            try {
                if (!command.modal) return;
                command.modal(interaction);
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
            return; // Button interaction handled
        }
    }
};

export default event;