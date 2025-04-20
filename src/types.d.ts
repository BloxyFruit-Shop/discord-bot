import { SlashCommandBuilder, ModalSubmitInteraction, CacheType, Collection, PermissionResolvable, Message, AutocompleteInteraction, ChatInputCommandInteraction, ButtonInteraction, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js"

export interface ButtonHandler {
    customId?: string; // For matching an exact custom ID
    customIdPrefix?: string; // For matching IDs that start with prefix (lang_, create_ticket_, etc.)
    // Other matchers can be added later (customIdRegex?: RegExp)
    execute: (interaction: ButtonInteraction<CacheType>, client : Client<true>) => Promise<void>;
}

export interface Command {
    command:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction) => void;
    modal?: (interaction: ModalSubmitInteraction<CacheType>) => void;
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
            MONGO_URI: string,
            MONGO_DATABASE_NAME: string,
            SHOPIFY_ADMIN_API_KEY?: string,
            SHOPIFY_ADMIN_API_SECRET?: string,
            SHOPIFY_ADMIN_API_TOKEN?: string,
            SHOPIFY_STOREFRONT_TOKEN?: string,
            SHOPIFY_URL?: string
        }
    }
}

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, Command>
        buttonHandlersExact: Collection<string, ButtonHandler>;
        buttonHandlersPrefix: Collection<string, ButtonHandler>;
    }
}