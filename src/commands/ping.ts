import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "~/types";

const command: Command = {
    command: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply("Pong!");
    },
};

export default command;