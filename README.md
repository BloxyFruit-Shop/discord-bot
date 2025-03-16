# Discord Bot Documentation

This document aims to provide a comprehensive overview of the present Discord bot. This includes commands, configuration, and internal workings.

The bot is designed to manage a ticketing system for order fulfillment across multiple Discord servers, each representing a different roblox game. It integrates with Shopify our MongoDB for order processing, although data persistency is handled with the `ticketStages.json` file.

## Table of Contents

1. [Introduction](#introduction)
2. [Dependencies](#dependencies)
3. [Configuration](#configuration)

- [Environment Variables](#environment-variables)
- [Server Configuration](#server-configuration)
- [Ticket Timeout](#ticket-timeout)

4. [Core Functionality](#core-functionality)

- [Ticket Stages](#ticket-stages)
- [Loading and Saving Ticket Stages](#loading-and-saving-ticket-stages)
- [Ticket Deletion Scheduling](#ticket-deletion-scheduling)
- [Stale Ticket Cleanup](#stale-ticket-cleanup)

5. [Event Handlers](#event-handlers)

- [`ready`](#ready-event)
- [`interactionCreate`](#interactioncreate-event)
- [`messageCreate`](#messagecreate-event)
- [`rateLimited`](#ratelimited-event)

6. [Functions](#functions)

- [`handleTicketCreation(interaction)`](#handleticketcreationinteraction)
- [`handleLanguageSelection(interaction, ticketStage)`](#handlelanguageselectioninteraction-ticketstage)
- [`handleOrderVerification(serverName, message, ticketStage)`](#handleorderverificationservername-message-ticketstage)
- [`handleUsernameButton(interaction, ticketStage)`](#handleusernamebuttoninteraction-ticketstage)
- [`handleUsernameSubmission(message, ticketStage)`](#handleusernamesubmissionmessage-ticketstage)
- [`handleTimezoneSelection(interaction, ticketStage)`](#handletimezoneselectioninteraction-ticketstage)
- [`handleSlashCommands(interaction, ticketStage)`](#handleslashcommandsinteraction-ticketstage)
- [`clearDeletionTimeout(channelId)`](#cleardeletiontimeoutchannelid)

7. [Slash Commands](#slash-commands)

- [`/fulfill-order`](#fulfill-order)
- [`/delete-completed`](#delete-completed)
- [`/delete-ticket`](#delete-ticket)
- [`/cancel-order`](#cancel-order)
- [`/generate-transcript`](#generate-transcript)

8. [Data Structures](#data-structures)

- `servers`
- `ticketStages`

9. [External Modules](#external-modules)

- [`./mongo`](#mongo)
- [`./embeds`](#embeds)
- [`./shopify`](#shopify)
- [`./translations`](#translations)

## 1. Introduction <a name="introduction"></a>

The Discord bot acts as a bridge between customers placing orders through our online shop, and the staff fulfilling those orders. It creates a dedicated ticket channel for each order, guiding the customer through a series of steps:

1. Language selection
2. Order ID verification
3. Roblox username submission
4. Timezone selection

Staff members can then use slash commands to manage the tickets, marking them as complete, canceling orders, or deleting tickets.

The bot also handles automated cleanup of inactive or completed tickets.

## 2. Dependencies <a name="dependencies"></a>

The bot relies on:

- **`discord.js`**: The library for interacting with the Discord API. Used for creating the bot, event handling, and managing channels, messages, embeds, and buttons.
- **`fs`**: Node.js's built-in file system module. Used for persistent storage of `ticketStages` data in `ticketStages.json`.
- **`./mongo`**: A custom module for interacting with a MongoDB database. Handles storage and retrieval of **order** information.
- **`./embeds`**: A custom module providing functions to create pre-designed Discord embeds used in the bot's workflow.
- **`./shopify`**: A custom module for interacting with the Shopify API. Handles order fulfillment.
- **`./translations`**: A custom module to handle embed's translations.
- **`dotenv`**: Loads environment variables from a `.env` file, securely storing sensitive data like the bot token and API keys.

## 3. Configuration <a name="configuration"></a>

### Environment Variables <a name="environment-variables"></a>

The bot uses environment variables for configuration, loaded using the `dotenv` module. The key environment variable is:

- **`DISCORD_TOKEN`**: The bot's secret token, required for connecting to Discord. This should be kept private.
- **`MONGO_URI`**: The connection string for the MongoDB database.
- **`SHOPIFY_ADMIN_API_KEY`**: Shopify Admin API key.
- **`SHOPIFY_ADMIN_API_SECRET`**: Shopify Admin API secret key.
- **`SHOPIFY_ADMIN_API_TOKEN`**: Shopify Admin API access token.
- **`SHOPIFY_STOREFRONT_TOKEN`**: Shopify Storefront API access token.
- **`SHOPIFY_URL`**: The URL of the Shopify store.

Whenever using, or developing features for the bot, ensure to set these environment variables correctly.

### Server Configuration <a name="server-configuration"></a>

The `servers` object (in `server-config.js`) defines configurations for each supported Discord server:

```javascript
const servers = {
  game: {
    name: 'name-of-the-game',
    guild: '123456789',
    claim: '123456789',
    'admin-role': '123456789',
    'customer-role': '123456789',
    'reviews-channel': '123456789',
    transcript: '123456789'
  }
};
```

Each server configuration includes:

- **`name`**: A short name for the server (e.g., "rivals", "blox-fruits").
- **`guild`**: The Discord server's unique ID.
- **`claim`**: The ID of the channel where users can create new tickets.
- **`admin-role`**: The ID of the role that grants users permission to use administrative slash commands.
- **`customer-role`**: The ID of the role assigned to users after their order is fulfilled.
- **`reviews-channel`**: The ID of the channel where users are prompted to leave reviews after order completion.
- **`transcript`**: The ID of the channel where the transcript of the ticket conversation is meant to be send after fulfillment.

### Ticket Timeout <a name="ticket-timeout"></a>

- **`TICKET_TIMEOUT`**: Inactivity period (milliseconds) before automatic ticket deletion. Set to `60 * 1000` (1 minute).

## 4. Core Functionality <a name="core-functionality"></a>

### Ticket Stages <a name="ticket-stages"></a>

The `ticketStages` object is the central data structure for managing the state of each ticket. It's a dictionary where keys are channel IDs and values are objects containing ticket information:

```javascript
ticketStages = {
  1234567890: {
    // Channel ID
    stage: 'languagePreference', // Current stage of the ticket
    language: null, // Selected language ('en' or 'es')
    orderId: null, // The customer's order ID
    robloxUsername: null, // The customer's Roblox username
    timezone: null, // The customer's selected timezone
    serverName: 'rivals', // The server the ticket belongs to
    userId: '9876543210', // The ID of the user who created the ticket
    deletionTimeout: 12345, // Timeout ID for scheduled deletion
    orderDetails: {} // The complete order object retrieved by the bot
  }
  // ... other tickets ...
};
```

The `stage` property determines the current step in the ticket workflow. Possible values are:

- **`languagePreference`**: Waiting for the user to select a language (English or Spanish).
- **`orderVerification`**: Waiting for the user to provide their order ID.
- **`robloxUsername`**: Waiting for the user to provide their Roblox username.
- **`timezone`**: Waiting for the user to select their timezone.
- **`finished`**: The ticket has been completed (all information collected).

### Loading and Saving Ticket Stages <a name="loading-and-saving-ticket-stages"></a>

- **`loadTicketStages()`**: Loads the `ticketStages` data from `ticketStages.json` if the file exists. This ensures that ticket data is persisted across bot restarts.
- **`saveTicketStages()`**: Saves the `ticketStages` object to `ticketStages.json`. The `deletionTimeout` property is excluded from the saved data to avoid issues on restarts.

### Ticket Deletion Scheduling <a name="ticket-deletion-scheduling"></a>

- **`scheduleTicketDeletion(channel, ticketStage)`**: Schedules the deletion of a ticket channel after `TICKET_TIMEOUT` milliseconds of inactivity.
  - It uses `setTimeout` to create a timer.
  - Before deleting, it checks if the ticket still exists and is in the expected stage (`orderVerification` or the stage it was when it was created). This prevents accidental deletion if the user is actively working on the ticket.
  - If the ticket meets the deletion criteria, it's removed from `ticketStages`, the changes are saved, and the channel is deleted using `channel.delete()`.
  - The `setTimeout` ID is stored in the `deletionTimeout` property of the `ticketStage` object. This allows the timeout to be cleared if the user interacts with the ticket.

### Stale Ticket Cleanup <a name="stale-ticket-cleanup"></a>

- **`cleanupStaleTickets()`**: This function cleans up tickets that might have become "stale" due to various reasons (e.g., bot restart, errors).
  - It iterates through all entries in the `ticketStages` object.
  - For each ticket, it attempts to fetch the corresponding channel using `client.channels.fetch(channelId)`. If the channel doesn't exist (returns `null`), the ticket is considered stale.
  - Tickets without an `orderId` (and not in `languagePreference`) or in the stage `orderVerification` are also stale.
  - Stale tickets are removed from `ticketStages`, and the updated data is saved. The associated channel is deleted if it exists.

## 5. Event Handlers <a name="event-handlers"></a>

The bot uses event handlers to respond to various events from the Discord API.

### `ready` Event <a name="ready-event"></a>

- Triggered when the bot successfully connects to Discord.
- Calls `loadTicketStages()` to load existing ticket data.
- Calls `cleanupStaleTickets()` to remove any stale tickets.
- Logs a message indicating the bot is logged in (`Logged in as ${client.user.tag}`).
- Clears and resets the claim message in each configured server's claim channel.
  - Fetches the claim channel using `client.channels.fetch(channels.claim)`.
  - Clears existing messages using `bulkDelete`.
  - Sends a new claim message with the `createClaimEmbed` and `createClaimButton` components.
- Registers the slash commands for each server.
  - Iterates through the `servers` configuration.
  - Fetches the guild using `client.guilds.fetch(serverConfig.guild)`.
  - Registers the commands using `guild.commands.set(commands)`.

### `interactionCreate` Event <a name="interactioncreate-event"></a>

- Triggered on user interaction (button, command, etc.).
- **Ticket Creation:**
  - Checks for button presses with the `customId` starting with `create_ticket_`.
  - If so, calls `handleTicketCreation(interaction)` to handle the ticket creation process.
- **Ticket Stage Handling:**
  - Gets `ticketStage` from `ticketStages` using the channel ID.
  - **Language Selection:** If the interaction is a button press and the custom ID is `english` or `spanish`, it calls `handleLanguageSelection(interaction, ticketStage)`.
  - **Username Button:** If the interaction is a button press and the custom ID is `provideRobloxUsername`, it calls `handleUsernameButton(interaction, ticketStage)`.
  - **Timezone Selection:** If the interaction is a button press and the custom ID starts with `timezone_`, it calls `handleTimezoneSelection(interaction, ticketStage)`.
- **Slash Command Handling:**
  - If the interaction is a command, it calls `handleSlashCommands(interaction, ticketStage)`.

### `messageCreate` Event <a name="messagecreate-event"></a>

- Triggered when a message is sent on any channel the bot can see.
- Checks if the message is from a bot or if there's no associated ticket in `ticketStages`. If either is true, it returns early.
- Retrieves the `ticketStage` and server configuration.
- **Order Verification:** If the `ticketStage.stage` is `orderVerification`, it calls `handleOrderVerification(serverName, message, ticketStage)`.
- **Roblox Username Submission:** If the `ticketStage.stage` is `robloxUsername`, it calls `handleUsernameSubmission(message, ticketStage)`.
- It ensures that it's only processing message of the users of the tickets.

### `rateLimited` Event <a name="ratelimited-event"></a>

- Triggered on API rate limit.
- Logs information about the rate limit. Stuff like the timeout, limit, method, path, route, and whether it's a global rate limit for future debugging.

## 6. Functions <a name="functions"></a>

### `handleTicketCreation(interaction)` <a name="handleticketcreationinteraction"></a>

- Handles the creation of a new ticket channel.
- **Server Identification:** Extracts the `serverName` from the button's custom ID (e.g., `create_ticket_rivals`).
- **Ticket Limit:** Checks if the user already has 2 active tickets in the server. If so, sends an ephemeral message and returns.
- **Channel Creation:** Creates a new text channel with the name `ticket-${interaction.user.username}`.
- **Permissions:**
  - Denies access to `@everyone`.
  - Allows the user who created the ticket to view, send messages, and read history.
  - Allows the bot to view, send messages, and read history.
  - Allows users with the `admin-role` to view, send messages, and read history.
- **Ticket Stage:** Adds a new entry to `ticketStages` with the initial stage set to `languagePreference` and other relevant information.
- **Confirmation Message:** Sends an ephemeral message to the user confirming the ticket creation.
- **Welcome Message:** Sends a welcome message (using `createWelcomeEmbed`) and language selection buttons (using `createLanguageSelection`) to the newly created ticket channel.
- **Deletion Scheduling**: Schedules ticket deletion using `scheduleTicketDeletion()`.

### `handleLanguageSelection(interaction, ticketStage)` <a name="handlelanguageselectioninteraction-ticketstage"></a>

- Handles the user's language selection.
- **Stage Check:** Ensures the ticket is in the `languagePreference` stage.
- **User Check**: Ensures that the user who pressed the button created the ticket.
- **Language Update:** Sets the `language` property in `ticketStages` based on the button pressed (`english` or `spanish`).
- **Stage Transition:** Updates the `stage` to `orderVerification`.
- **Prompt:** Sends an embed (using `createOrderVerificationEmbed`) prompting the user to enter their order ID.

### `handleOrderVerification(serverName, message, ticketStage)` <a name="handleorderverificationservername-message-ticketstage"></a>

- Handles the verification of the user's order ID.
- **Order ID Extraction:** Extracts the order ID from the message content, removing any leading `#`.
- **Order Retrieval:** Attempts to find the order in the MongoDB database using `orders.findOne({ id: orderId })`.
- **Order Not Found:** If the order is not found or has been canceled, sends an embed (using `createOrderNotFoundEmbed`) and returns.
- **Existing Ticket Check:** Checks if a ticket already exists for the same order ID (excluding the current channel). If so, sends an embed (using `createTicketExistsEmbed`), deletes the current ticket, and returns.
- **Game Mismatch:** Verifies the order's game (if present) against `serverName`.
  - If there is a game and the server is different (except the Blox Fruits/Bloxy Market combination) it will create and send the `createDifferentGameEmbed`, and it will schedule a deletion after 60 seconds if the orderId is still `null`.
- **Order Already Claimed:** If the order status is `completed`, deletes the channel and returns.
- **Item Category Handling:** Handles edge cases:
  - `onlyAccountItems`: All items have `deliveryType: 'account'`. Sends `createAccountItemsEmbed`, schedules deletion (60 seconds), and returns.
  - `onlyPhysicalFruit`: All items have `category: 'Physical Fruit'` and the server _isn't_ `bloxy-market`. Sends `createPhysicalFruitOnlyEmbed`, deletes the ticket, schedules deletion (60 seconds), and returns.
  - `noPhysicalFruit`: All items _don't_ have `category: 'Physical Fruit'` and the server _is_ `bloxy-market`. Sends `createNoPhysicalFruitEmbed`.
- **Deletion Timeout**: clears the timeout using `clearDeletionTimeout()`.
- **Order Found:** If the order is found and valid:
  - Updates `ticketStages` with `orderId` and the retrieved `orderDetails`.
  - Sends an embed (using `createOrderFoundEmbed`) confirming the order and a button (using `createProvideUsernameButton`) prompting for the Roblox username.
  - Updates the `stage` to `robloxUsername`.

### `handleUsernameButton(interaction, ticketStage)` <a name="handleusernamebuttoninteraction-ticketstage"></a>

- Handles the button press that prompts the user for their Roblox username.
- **Stage Check:** Ensures the ticket is in the `robloxUsername` stage.
- **User Check**: Ensures that the user who pressed the button created the ticket.
- **Username Prompt:** Sends an embed (using `createProvideRobloxUsernameEmbed`) prompting the user to enter their Roblox username.

### `handleUsernameSubmission(message, ticketStage)` <a name="handleusernamesubmissionmessage-ticketstage"></a>

- Handles the submission of the user's Roblox username.
- **Deletion Timeout**: clears the timeout using `clearDeletionTimeout()`.
- **Username Extraction:** Extracts the Roblox username from the message content.
- **Username Update:** Updates the `robloxUsername` property in `ticketStages`.
- **Stage Transition:** Updates the `stage` to `timezone`.
- **Timezone Selection:** Sends embeds for the provided username (`createProvidedUsernameEmbed`) and timezone selection (`createTimezoneEmbed`), along with timezone buttons (`createTimezoneButtons`).

### `handleTimezoneSelection(interaction, ticketStage)` <a name="handletimezoneselectioninteraction-ticketstage"></a>

- Handles the user's timezone selection.
- **Stage Check:** Ensures the ticket is in the `timezone` stage.
- **User Check**: Ensures that the user who pressed the button created the ticket.
- **Timezone Extraction:** Extracts the selected timezone from the button's custom ID.
- **Timezone Update:** Updates the `timezone` property in `ticketStages`.
- **Stage Transition:** Updates the `stage` to `finished`.
- **Summary:** Creates a summary embed (`createSummaryEmbed`) with the collected information.
- **Physical Fruit Check:** If the order contains physical fruit (and it isn't the bloxy-market server): create and send a `createPhysicalFruitEmbed`.

* **Deletion Timeout**: clears the timeout using `clearDeletionTimeout()`.

- **Send Summary:** Sends the summary embed to the channel.

### `handleSlashCommands(interaction, ticketStage)` <a name="handleslashcommandsinteraction-ticketstage"></a>

- Handles the bot's slash commands.
- **Server and Role Check:** Determines the server configuration and checks if the user has the `admin-role`. If not, sends an ephemeral message and returns.
- **Command Handling:** Uses a series of `if` statements to handle different commands:
  - **`delete-ticket`**: Deletes the current ticket channel (if it's a ticket channel).
  - **`cancel-order`**: Marks the order as `cancelled` in the database and renames the channel.
  - **`fulfill-order`**:
    - Marks the order as `completed` in the database.
    - Renames the channel.
    - Sends a completion message to the user via DM (using `createCompletionMessageEmbed`).
    - Adds the `customer-role` to the user.
  - **`delete-completed`**: Deletes all channels that start with `completed-`.

### `clearDeletionTimeout(channelId)` <a name="cleardeletiontimeoutchannelid"></a>

- Clears the deletion timeout for a given channel ID. This is called when user activity is detected, preventing the ticket from being deleted while the user is interacting with it.

## 7. Slash Commands <a name="slash-commands"></a>

The bot provides the following slash commands for staff members:

### `/fulfill-order` <a name="fulfill-order"></a>

- **Description:** Marks a ticket as completed. This also fulfills the order in Shopify.
- **Permissions:** Requires the `admin-role`.
- **Usage:** Must be used within a ticket channel.
- **Actions**:
  - Gets fullfilment order id through `getFullfilmentOrderId` and `fullFillmentOrder`.
  - Changes channel's name.
  - Sets the order status to `completed`.
  - Sends a DM with a completion message.
  - Adds a customer role to the user.

### `/delete-completed` <a name="delete-completed"></a>

- **Description:** Deletes all completed tickets (channels named `completed-*`).
- **Permissions:** Requires the `admin-role`.

### `/delete-ticket` <a name="delete-ticket"></a>

- **Description:** Deletes the current ticket channel.
- **Permissions:** Requires the `admin-role`.
- **Usage:** Must be used within a ticket channel.

### `/cancel-order` <a name="cancel-order"></a>

- **Description:** Cancels the order associated with the current ticket.
- **Permissions:** Requires the `admin-role`.
- **Usage:** Must be used within a ticket channel.
- **Actions:**
  - Sets order status to `cancelled`.
  - Changes channel's name.

### `/generate-transcript` <a name="generate-transcript"></a>

- **Description:** Generates a transcript of the ticket conversation. This command is only meant to be used in case of an error with the automatic transcript generation. If the ticket doesn't exist in the internal ticketStages data structure, the command will fail.
- **Permissions:** Requires the `admin-role`.
- **Usage:** Must be used within a ticket channel.
- **Actions:**
  - Fetches the ticket channel's messages.
  - Generates a transcript of the messages as an HTML document.
  - Sends the transcript as a file attachment to the channel specified in `server-config.js` under the attribute `transcript`.

## 8. Data Structures <a name="data-structures"></a>

### `servers` <a name="servers"></a>

(Described in [Configuration](#configuration))

### `ticketStages` <a name="ticketstages"></a>

(Described in [Ticket Stages](#ticket-stages))

## 9. External Modules <a name="external-modules"></a>

### `./mongo` <a name="mongo"></a>

- **`Schema`**: Defines the structure of MongoDB documents.

  - `orderItemSchema`: Defines the schema for items within an order.
  - `ordersSchema`: Defines the schema for the entire order.

- **`orders`**: A Mongoose model for the "orders" collection.

### `./embeds` <a name="embeds"></a>

This module exports functions that return pre-configured `EmbedBuilder` instances or `ActionRowBuilder` instances (for buttons):

- **`createClaimEmbed(client)`**: The initial embed in the claim channel.
- **`createWelcomeEmbed(client)`**: Welcome message with language selection.
- **`createOrderVerificationEmbed(language, client)`**: Prompts for order ID.
- **`createClaimButton(serverName)`**: Button to create a ticket.
- **`createTimezoneButtons()`**: Buttons for timezone selection.
- **`createSummaryEmbed(orderDetails, ticketStage, timezone, language, client)`**: Summarizes ticket information.
- **`createLanguageSelection()`**: Buttons for language selection.
- **`createOrderNotFoundEmbed(orderId, language, client)`**: Order not found message.
- **`createOrderFoundEmbed(orderId, language, client)`**: Order found confirmation.
- **`createProvideUsernameButton(language, client)`**: Button to prompt for username.
- **`createProvideRobloxUsernameEmbed(language, client)`**: Embed prompting for username.
- **`createTimezoneEmbed(language, client)`**: Embed prompting for timezone.
- **`createProvidedUsernameEmbed(robloxUsername, language, client)`**: Confirms username.
- **`createDifferentGameEmbed(orderId, order.game, language, client)`**: Wrong game message.
- **`createOrderClaimedEmbed(orderId, language, client)`**: Order already claimed message.
- **`createPhysicalFruitEmbed(language, client)`**: Notification about physical fruits.
- **`createPhysicalFruitOnlyEmbed(language, client)`**: Message for orders with _only_ physical fruits.
- **`createAccountItemsEmbed(orderId, language, client)`**: Message for orders with _only_ account items.
- **`createTicketExistsEmbed(orderId, existingChannelId, language, client)`**: Duplicate ticket message.
- **`createCompletionMessageEmbed(language, reviewsChannelId, client)`**: Completion message sent via DM.
- **`createNoPhysicalFruitEmbed(language, client)`**: Message for orders in `bloxy-market` without physical fruits.
- **`createTranscriptEmbed(ticket, client)`**: Message sent paired with the file attachment in the transcript channel after `/fulfill-order` or `/generate-transcript` is ran.

* **Helper Functions:**
  - **`getFooter(client)`**: Creates a consistent footer for embeds.

- **Constants:**
  - `discordServerInvites`: Object mapping server names to Discord invite links.
  - `gameNames`: Object mapping server names to game names.

### `./shopify` <a name="shopify"></a>

- **`shopify`**: A configured instance of the `@shopify/shopify-api` client.
- **`shopifySession`**: A Shopify API session.
- **`getFullfilmentOrderId(orderId)`**: Gets the fulfillment order ID from Shopify using a GraphQL query.
- **`fullFillmentOrder(fulfillmentOrderId)`**: Marks a fulfillment order as fulfilled in Shopify via GraphQL.

### `./translations` <a name="translations"></a>

- **`translations`**: Contains the translations for both `en` and `es`.
