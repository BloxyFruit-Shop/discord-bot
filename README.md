
# BloxyFruit Discord Bot

This documentation provides a complete, **up-to-date overview of the modular, type-safe BloxyFruit Discord bot**. It details the technical design, extensibility patterns, ticket workflow, command/event handling, and *development lifecycle* for new developers.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Structure](#architecture--structure)
3. [Workflow](#workflow)
    - [Ticket Stages & Lifecycle](#ticket-stages--lifecycle)
    - [Each Step](#each-step)
    - [Automatic Channel Cleanup & Timeouts](#automatic-channel-cleanup--timeouts)
4. [Core Modules & Extensibility](#core-modules--extensibility)
    - [Dynamic Handler Loading](#dynamic-handler-loading)
    - [Command & Button Handlers](#command--button-handlers)
    - [Utility & Helper Layers](#utility--helper-layers)
    - [Type Safety Across Layers](#type-safety-across-layers)
5. [Database-First Ticket System (NO ticketStages.json!)](#database-first-ticket-system-no-ticketstagesjson)
6. [Commands & Permissions](#commands--permissions)
7. [Configuration](#configuration)
    - [Server & Channel/Role Mappings](#server--channelrole-mappings)
    - [Environment & Secrets](#environment--secrets)
8. [Development & Deployment Guide](#development--deployment-guide)
    - [Running the bot in dev mode](#running-the-bot-in-dev-mode)
    - [Recommended .env Setup](#recommended-env-setup)
    - [Contribution Best Practices](#contribution-best-practices)
9. [How to Extend the Bot](#how-to-extend-the-bot)
10. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Overview

The BloxyFruit Discord Bot is a **modern, fully modular TypeScript application** designed for scalable ticket management and order fulfillment across our multiple Roblox gaming communities. **All workflow state now persists in a MongoDB database**—*no more ticketStages.json*. 

Key features:

- Modular handler and event-based architecture
- All active tickets, workflow stages, and user data persist in MongoDB
- Discord.js per-guild command registration, and dynamic event wiring
- Fully type-safe via TypeScript
- Extensible: Add games, commands, workflows, or integrations with zero core changes

---

## Architecture & Structure

Directory/file structure (`src/`):

```
src/
│
├── index.ts                # Entrypoint: loads handlers, sets up client, env, models
│
├── handlers/               # Dynamic loaders (auto-wiring)
│   ├── Button.ts
│   ├── Command.ts
│   └── Event.ts
│
├── buttons/                # Per-button interaction handlers by customId or prefix
│   └── [button].ts
├── commands/               # Slash command logic (file -> command)
│   └── [command].ts
├── events/                 # Discord gateway event listeners (ready, messageCreate, etc.)
│   └── [event].ts
│
├── lib/                    # Core business: tickets, Mongo, Shopify, Discord utils, embeds
│   ├── Mongo.ts
│   ├── TicketManager.ts
│   ├── Shopify.ts
│   ├── DiscordUtils.ts
│   ├── Embeds.ts
│   └── [etc].ts
│
├── config/                 # Static configuration
│   ├── servers.ts          # All production/dev server/role/channel mappings
│   ├── [other config].ts
│
├── lang/                   # i18n support: per-language text files
├── schemas/                # Mongoose/model schemas (Ticket, Order, etc.)
├── types/                  # TypeScript type definitions
│   ├── config.ts
│   ├── translations.ts
│   └── [etc].ts
│
├── functions.ts            # Shared helper functions (color, delay, etc.)
└── models.ts               # Mongoose model initialization
```

**Key Architectural Traits:**

- All workflow logic is *decoupled*: Commands, events, button handlers are modular
- Database is the single source of truth for ticket state 
- Handlers are dynamically loaded with no hard-coded registration required
- All interactions (from API to Discord) are type-checked for safety

---

## Workflow

### Ticket Stages & Lifecycle

Every incoming support request follows a strict, persistently stored workflow. Each ticket is a **MongoDB document** (not an in-memory object nor stored in a file) with fields representing its workflow stage and all related user and order data.

**Stages:**
- `languagePreference`: User chooses preferred language (button).
- `orderVerification`: User submits their order ID. Bot pulls and validates from DB, and sets Roblox username automatically via order info.
- `timezone`: User selects timezone for delivery coordination.
- `finished`: Workflow data complete—ticket is summarized, ready for staff action.

**On ticket creation**, a new Ticket document is created in MongoDB with stage `languagePreference`. Channel/user/server info are all stored.

**At each user interaction (button/message):**
- Bot updates the Ticket document in DB, changing its `stage`, `language`, `orderId`, etc.
- Any deletion/cleanup/summaries reference the latest ticket state *directly* from the DB.

### Each Step

#### 1. **Create Ticket Button**
- User clicks “Claim Ticket” button in configured claim channel.
- Bot creates private ticket channel, sets permissions, saves a new ticket in MongoDB.

#### 2. **Language Selection**
- Bot sends "Choose your language" (embed with buttons).
- User selects; Ticket `language` is updated, stage advances to `orderVerification`.

#### 3. **Order Verification**
- Bot prompts for order ID.
- User enters ID; bot checks MongoDB `Order` collection for existence and state.
  - Handles errors: not found, already claimed, wrong game, missing data, etc.
- If order is valid, order data and username is set on ticket, stage transitions to `timezone`.

#### 4. **Timezone Selection**
- Bot sends timezone selection buttons; user clicks.
- Ticket updated with timezone, stage becomes `finished`.

#### 5. **Finalization**
- Bot posts a summary embed and notifies staff/admins.
- Staff uses slash commands to take action.

### Automatic Channel Cleanup & Timeouts

- **`scheduleChannelDeletion(channel, timeout, reason)`** in `lib/DiscordUtils.ts`: Schedules deletion of inactive ticket channels after a specified timeout (e.g., 1 minute).
- Timeout info is not stored on the ticket record but managed in memory for each channel.
- **`cleanupOrphanedChannels(client, servers)`**: On startup/manual, removes orphans (ticket channels in Discord not present in DB).

---

## Core Modules & Extensibility

### Dynamic Handler Loading

- On startup, `index.ts` loads all files in `/handlers/` and executes each with the Discord client.
- Each handler (`Button.ts`, `Command.ts`, `Event.ts`) loads the files in their domain-specific folder (buttons, commands, events).
- *No hard-coded/linear registration!* Add a file to the right folder and it’s available instantly.

### Command & Button Handlers

- **Commands**: Each `/commands/[name].ts` file exports a SlashCommand object.
  - Registered to every configured guild in `/config/servers.ts` (see prod/dev toggling below).
  - Uses Discord.js’s typings for robust validation, less runtime error.

- **Buttons**: Each `/buttons/[name].ts` exports a handler implementing `{ customId, customIdPrefix, execute }`.
  - Routed automatically by the Button handler loader.
  - Supports both exact and prefix matching (`customIdPrefix` for dynamic parameters in button IDs).

- **Events**: All listeners (`messageCreate`, `interactionCreate`, `ready`, etc.) live in `/events/`, modular back to a file/function per event.

### Utility & Helper Layers

- **Embeds.ts**: Creates all standard embeds (welcome, summary, errors) and button layouts. i18n support is here.
- **TicketManager.ts**: All ticket database logic (CRUD) in one place. Always fetch from DB for up-to-date workflow.
- **DiscordUtils.ts**: Utilities for scheduling deletion of stale ticket channels, orphan/channel cleanup, etc.
- **Shopify.ts**: Integration and logic for order fulfillment through Shopify’s API.
- **Mongo.ts**: DB connection pooling, safety (auto-reconnect), and health logging.

### Type Safety Across Layers

- Every handler, helper, config, and business entity has a clearly defined TypeScript type, found in `/types/` and `/schemas/`.
- Reduces chance for silent errors and allows easy API exploration within IDEs.

---

## Database-First Ticket System (NO ticketStages.json)

**All ticket state—stages, fields, metadata now lives in our MongoDB**. The former `ticketStages.json` file is entirely obsolete and unused in this implementation.

**Where is ticket state stored?**
- Ticket documents (`schemas/Ticket.ts`) in MongoDB store all workflow details.
- All bot logic fetches/mutates ticket state through typed database operations (see `/lib/TicketManager.ts` for reference).

**What if the bot restarts or crashes?**
- No state is lost; ticket channels and all workflow position are persistent.
- Both user and staff can resume ticket handling at the exact last step thanks to DB source-of-truth.

**Data structure:**
```ts
interface ITicket {
    channelId: string;
    userId: string;
    serverName: string;
    stage: "languagePreference" | "orderVerification" | "timezone" | "finished";
    language?: "en" | "es";
    orderId?: string;
    order?: ...;            // Linked via ObjectId or populated data
    timezone?: string;
    createdAt: Date;
    updatedAt: Date;
    // ...other fields, see schema
}
```
All queries and business logic flow through this persistent model.

---

## Commands & Permissions

| Command                | Description |
|------------------------|-------------|
| `/fulfill-order`       | Completes ticket process: marks order fulfilled in Shopify, sets DB flag, renames channel, DMs user, adds customer role, sends transcript. |
| `/delete-completed`    | Deletes all completed ticket channels (those named `completed-*`). |
| `/delete-ticket`       | Deletes the current ticket channel and associated ticket record. |
| `/cancel-order`        | Cancels the order, sets DB status, renames channel. |
| `/generate-transcript` | Manually creates an HTML transcript, posts to transcript channel (fallback for automation). |

All staff-only commands **require the staff/admin role** as set in each server’s config (see `/config/servers.ts`). Usage is always context-sensitive: e.g., `/delete-ticket` only works in actual ticket channels.

Commands are registered per-server on startup; they are immediately available to users with adequate role permissions.

---

## Configuration

### Server & Channel/Role Mappings

**Switching between production and development:**

In `/src/config/servers.ts`:
```typescript
// To use production servers:
export const servers = prodServers;

// For development/testing:
export const servers = devServers;
```
- Simply pick the correct export . The bot will use the appropriate IDs for channels and servers.

> **Double check before deploying. test/dev server IDs won’t work in production, and you can cause delays or downtime in user support.**

### Environment & Secrets

Create a `.env` file. Must contain at minimum:

```env
TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
MONGO_URI=your_mongodb_connection_uri
MONGO_DATABASE_NAME=your_db_name
SHOPIFY_ADMIN_API_KEY=...
SHOPIFY_ADMIN_API_SECRET=...
SHOPIFY_ADMIN_API_TOKEN=...
SHOPIFY_STOREFRONT_TOKEN=...
SHOPIFY_URL=https://your-store-url.com
```
Other secrets as needed—ensure all referenced in the code exist in your `.env`.

---

## Development & Deployment Guide

### Running the bot in dev mode

**Step 1:** Open `/src/config/servers.ts`.

**Step 2:** Change the dev servers to ones you want to use. This will depend on the server you'll be working with your test bot. Then simply switch to the production servers:

```typescript
export const servers = prodServers; // for production
```

**Step 3:** Save and proceed to build/start.

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Compile TypeScript:**
   ```
   npm run build
   ```
   - This transpiles `/src/` into `/dist/`.

3. **Run the bot:**
   ```
   npm start
   ```
   - Alias for `node ./dist/index.js`
   - Bot will start, initialize Discord client, connect to DB, and register handlers.

You'll need to stop, recompile and run again each time you make a change. This may seem annoying, but it's not a big deal.

> If adding completely new helpers, it's recommended to test them in a separate "test.ts" file to ensure they work, then implement them into the bot's workflow. Ensuring your helper functions work beforehand will help you avoid restarting the bot to test your changes.

### Contribution Best Practices

- Always use typed imports and explicit types.
- Use existing modular patterns: add slash commands to `/commands/`, events to `/events/`, new helpers to `/lib/`, translations to `/lang/`.
- Write new config (servers/games) in `/config/servers.ts` and use the correct exported mapping.
- Keep your functions, helpers and commands work always on display via console.logs. This helps with debugging and error tracking.
- Use a linter (ESLint) to catch errors and improve code quality.

---

## How to Extend the Bot

- **Add a slash command:**  
  Place a new TS file exporting a standard Discord.js slash command in `/commands/`. It is auto-registered.

- **Add a new button / UI workflow:**  
  Place a TS file with a handler in `/buttons/` and export correct `customId` or `customIdPrefix`.

- **Add new Discord event logic:**  
  Add your handler in `/events/`—ensure you export the event name and execution logic as per the existing pattern.

- **Expand database models or logic:**  
  Change/extend schemas in `/schemas/`, update type definitions in `/types/`, and add business logic in `/lib/`.

- **Update config or add a new server/game:**  
  Add to `/config/servers.ts` and ensure unique key assignment.

---

## FAQ & Troubleshooting

### What happened to ticketStages.json?
- Gone! All ticket and workflow data is now in MongoDB.

### How do I recover after a bot restart/crash?
- All tickets/users/stages are persisted to DB and restored automatically.

### How do I see what's happening internally?
- The bot uses **rich logging** for key events (handler loading, DB connection, command registration, errors). Tail your console/log output during dev and prod.
