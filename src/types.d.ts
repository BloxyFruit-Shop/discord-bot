import { SlashCommandBuilder, ModalSubmitInteraction, CacheType, Collection, PermissionResolvable, Message, AutocompleteInteraction, ChatInputCommandInteraction, ButtonInteraction } from "discord.js"

export interface ButtonHandler {
    customId?: string; // For matching an exact custom ID
    customIdPrefix?: string; // For matching IDs that start with this prefix
    // You could add other matchers later, like a regex: customIdRegex?: RegExp;
    execute: (interaction: ButtonInteraction<CacheType>, client : Client<true>) => Promise<void>;
}

export interface SlashCommand {
    command: SlashCommandBuilder,
    execute: (interaction : ChatInputCommandInteraction) => void,
    autocomplete?: (interaction: AutocompleteInteraction) => void,
    modal?: (interaction: ModalSubmitInteraction<CacheType>) => void,
    cooldown?: number // in seconds
}

export interface Command {
    name: string,
    execute: (message: Message, args: Array<string>) => void,
    permissions: Array<PermissionResolvable>,
    aliases: Array<string>,
    cooldown?: number,
}

export interface BotEvent {
    name: string,
    once?: boolean | false,
    execute: (...args: any[]) => void
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string,
            CLIENT_ID: string,
            PREFIX: string,
            MONGO_URI: string,
            MONGO_DATABASE_NAME: string
        }
    }
}

declare module "discord.js" {
    export interface Client {
        slashCommands: Collection<string, SlashCommand>
        commands: Collection<string, Command>,
        cooldowns: Collection<string, number>,
        buttonHandlersExact: Collection<string, ButtonHandler>;
        buttonHandlersPrefix: Collection<string, ButtonHandler>;
    }
}