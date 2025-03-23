const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { translations } = require('./translations');

const discordServerInvites = {
  rivals: 'https://discord.gg/bloxyrivals',
  'blox-fruits': 'https://discord.gg/bloxyfruit',
  'bloxy-market': 'https://discord.gg/fyTQNnbW7B',
  'pets-go': 'https://discord.gg/bloxypets',
  'anime-vanguards': 'https://discord.gg/5gwAZZpXSw',
  'king-legacy': 'https://discord.gg/8sjBPzzxwA'
};

const gameNames = {
  rivals: 'Rivals',
  'blox-fruits': 'Blox Fruits',
  'bloxy-market': 'Blox Fruits Physicals',
  'pets-go': 'Pets Go',
  'anime-vanguards': 'Anime Vanguards',
  'king-legacy': 'King Legacy'
};

/**
 * Creates a consistent footer for all embeds.
 * @param {Client} client - The Discord client instance
 * @returns {Object} The footer object with text and icon
 */
const getFooter = (client) => {
  return {
    text: `BloxyFruit - Most Trusted In-Game Store`,
    iconURL: client.user.avatarURL()
  };
};

/**
 * Creates the initial embed displayed in the claim channel.
 * Prompts users to click the button to create a ticket.
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The claim embed
 * @see Used in `ready` event handler to reset claim channel
 */
const createClaimEmbed = (client) => {
  return new EmbedBuilder()
    .setColor('#45B7D1')
    .setTitle('🔍 Claim Your Order')
    .setDescription(
      '## Need help with your order? Create a ticket and our support team will assist you!'
    )
    .addFields({
      name: '📝 How it works',
      value:
        '1. Click the button below\n2. Provide your order ID\n3. Our team will assist you'
    })
    .setFooter(getFooter(client))
    .setImage('https://robloxdelivery.com/assets/banner.webp')
    .setTimestamp();
};

/**
 * Creates the welcome embed shown after ticket creation.
 * Prompts users to select their preferred language.
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The welcome embed
 * @see Used in `handleTicketCreation` function
 */
const createWelcomeEmbed = (client) => {
  return new EmbedBuilder()
    .setColor('#45B7D1')
    .setTitle('🌎 Select Your Language')
    .setDescription('Choose your preferred language for support:')
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the language selection buttons.
 * Allows users to choose between English and Spanish.
 * @returns {ActionRowBuilder} The language selection buttons
 * @see Used in `createWelcomeEmbed` and `handleLanguageSelection`
 */
const createLanguageSelection = () => {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('english')
      .setLabel('English')
      .setEmoji('🇬🇧')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('spanish')
      .setLabel('Español')
      .setEmoji('🇪🇸')
      .setStyle(ButtonStyle.Primary)
  );
};

/**
 * Creates the order verification embed.
 * Prompts users to provide their order ID.
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The order verification embed
 * @see Used in `handleLanguageSelection` after language is chosen
 */
const createOrderVerificationEmbed = (lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#4ECDC4')
    .setTitle(t.ORDER_VERIFICATION_TITLE)
    .setDescription(t.ORDER_VERIFICATION_DESCRIPTION)
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the embed shown when an order is not found.
 * Displays error message with the provided order ID.
 * @param {string} orderId - The order ID that was not found
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The order not found embed
 * @see Used in `handleOrderVerification` when order lookup fails
 */
const createOrderNotFoundEmbed = (orderId, lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.ORDER_NOT_FOUND_TITLE)
    .setDescription(t.ORDER_NOT_FOUND_DESCRIPTION.replace('{orderId}', orderId))
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the embed shown when an order is successfully found.
 * Confirms the order ID and prompts next steps.
 * @param {string} orderId - The order ID that was found
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The order found embed
 * @see Used in `handleOrderVerification` when order lookup succeeds
 */
const createOrderFoundEmbed = (orderId, lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#4ECDC4')
    .setTitle(t.ORDER_FOUND_TITLE)
    .setDescription(t.ORDER_FOUND_CONTENT.replace('{orderId}', orderId))
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the button to initiate ticket creation.
 * Custom ID includes server name for tracking.
 * @param {string} serverName - Name of the server/game
 * @returns {ActionRowBuilder} The claim button
 * @see Used in `createClaimEmbed` and `ready` event handler
 */
const createClaimButton = (serverName) => {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`create_ticket_${serverName}`)
      .setLabel('Claim Order')
      .setEmoji('📩')
      .setStyle(ButtonStyle.Primary)
  );
};

/**
 * Creates the timezone selection embed.
 * Prompts users to select their timezone region.
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The timezone selection embed
 * @see Used in `handleUsernameSubmission` after username is provided
 */
const createTimezoneEmbed = (lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#45B7D1')
    .setTitle(t.TIMEZONE_TITLE)
    .setDescription(t.TIMEZONE_DESCRIPTION)
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the timezone selection buttons.
 * Offers options for major timezone regions.
 * @returns {ActionRowBuilder} The timezone buttons
 * @see Used in `createTimezoneEmbed`
 */
const createTimezoneButtons = () => {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('timezone_america')
      .setLabel('America')
      .setEmoji('🌎')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('timezone_europe')
      .setLabel('Europe')
      .setEmoji('🌍')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('timezone_asia')
      .setLabel('Asia')
      .setEmoji('🌏')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('timezone_africa')
      .setLabel('Africa')
      .setEmoji('🌍')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('timezone_australia')
      .setLabel('Australia')
      .setEmoji('🦘')
      .setStyle(ButtonStyle.Primary)
  );
};

/**
 * Creates the summary embed showing ticket details.
 * Displays order ID, username, timezone, and items.
 * @param {Object} orderDetails - The order details object
 * @param {Object} ticketStage - The current ticket stage data
 * @param {string} timezone - The selected timezone
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The summary embed
 * @see Used in `handleTimezoneSelection` after timezone is chosen
 */
const createSummaryEmbed = (
  orderDetails,
  ticketStage,
  timezone,
  lang = 'en',
  client
) => {
  const t = translations[lang];
  const itemsStr = orderDetails.items
    .map((item) => {
      const statusEmoji =
        {
          processing: '⏳',
          pending: '⌛',
          claimed: '✅',
          completed: '✨'
        }[item.status] || '❓';

      return `${statusEmoji} **${item.title}**\n┗ Quantity: ${item.quantity}x | Category: \`${item.category}\` | Status: \`${item.status}\``;
    })
    .join('\n\n');

  return new EmbedBuilder()
    .setColor('#45B7D1')
    .setTitle(t.SUMMARY_TITLE)
    .addFields(
      {
        name: t.ORDER_DETAILS,
        value: `Order ID: \`${ticketStage.orderId}\``,
        inline: true
      },
      {
        name: t.ROBLOX_USERNAME,
        value: `\`${ticketStage.robloxUsername}\``,
        inline: true
      },
      { name: t.TIMEZONE_LABEL, value: `\`${timezone}\``, inline: true },
      { name: t.ORDERED_ITEMS, value: itemsStr || 'No items found' }
    )
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the embed shown when a duplicate ticket exists for the same order.
 * Notifies user of existing ticket and provides a link to it.
 * @param {string} orderId - The order ID that already has a ticket
 * @param {string} channelId - The ID of the existing ticket channel
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The duplicate ticket embed
 * @see Used in `handleOrderVerification` when duplicate ticket is detected
 */
const createTicketExistsEmbed = (orderId, channelId, lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.TICKET_EXISTS_TITLE)
    .setDescription(t.TICKET_EXISTS_DESCRIPTION.replace('{orderId}', orderId))
    .addFields({
      name: t.EXISTING_TICKET_CHANNEL,
      value: t.EXISTING_TICKET_LINK.replace('{channelId}', channelId)
    })
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the completion message embed.
 * Notifies user that their order has been fulfilled.
 * @param {string} [lang='en'] - Language code for translations
 * @param {string} reviewsChannel - The ID of the reviews channel
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The completion message embed
 * @see Used in `/fulfill-order` command handler
 */
const createCompletionMessageEmbed = (lang = 'en', reviewsChannel, client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#4ECDC4')
    .setTitle(t.COMPLETION_MESSAGE_TITLE)
    .setDescription(t.COMPLETION_MESSAGE_DESCRIPTION)
    .addFields(
      {
        name: t.LEAVE_REVIEW,
        value: t.LEAVE_REVIEW_CHANNEL.replace(
          '{reviewsChannel}',
          reviewsChannel
        )
      },
      { name: t.TRUSTPILOT, value: t.TRUSTPILOT_LINK }
    )
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the embed shown when an order is for a different game.
 * Provides instructions to join the correct server.
 * @param {string} orderId - The order ID that was found
 * @param {string} orderGame - The game associated with the order
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The different game embed
 * @see Used in `handleOrderVerification` when order is for different game
 */
const createDifferentGameEmbed = (orderId, orderGame, lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.WRONG_GAME_TITLE)
    .setDescription(
      t.WRONG_GAME_DESCRIPTION.replace('{orderId}', orderId).replace(
        '{game}',
        gameNames[orderGame]
      )
    )
    .addFields({
      name: t.WHAT_TO_DO,
      value: t.WRONG_GAME_INSTRUCTIONS.replace(
        '{serverInvite}',
        discordServerInvites[orderGame]
      )
    })
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the embed shown when an order has been claimed.
 * Displays information about the claimed order.
 * @param {string} orderId - The order ID that was claimed
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The claimed order embed
 * @see Used in `/cancel-order` command handler
 */
const createOrderClaimedEmbed = (orderId, lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.ORDER_CLAIMED_TITLE)
    .setDescription(t.ORDER_CLAIMED_DESCRIPTION.replace('{orderId}', orderId))
    .addFields(
      {
        name: t.NEED_HELP,
        value: t.CLAIMED_HELP_TEXT
      },
      {
        name: t.IMPORTANT,
        value: t.CLAIMED_IMPORTANT_TEXT
      }
    )
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the embed for physical fruit orders.
 * Provides information about physical fruit fulfillment and server invite.
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The physical fruit embed
 * @see Used in `handleOrderVerification` when physical fruits are detected
 */
const createPhysicalFruitEmbed = (lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#FFD93D')
    .setTitle(t.PHYSICAL_FRUIT_TITLE)
    .setDescription(t.PHYSICAL_FRUIT_DESCRIPTION)
    .addFields(
      {
        name: t.JOIN_SERVER,
        value: `${discordServerInvites['bloxy-market']}`
      },
      {
        name: t.IMPORTANT,
        value: t.OTHER_ITEMS
      }
    )
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the embed for account items orders.
 * Displays information about account item fulfillment.
 * @param {string} orderId - The order ID that was found
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The account items embed
 * @see Used in `handleOrderVerification` when only account items are found
 */
const createAccountItemsEmbed = (orderId, lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.ACCOUNT_ITEMS_TITLE)
    .setDescription(t.ACCOUNT_ITEMS_DESCRIPTION.replace('{orderId}', orderId))
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the embed for orders with only physical fruits.
 * Provides instructions for physical fruit fulfillment.
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The physical fruit only embed
 * @see Used in `handleOrderVerification` when only physical fruits are found
 */
const createPhysicalFruitOnlyEmbed = (lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.PHYSICAL_FRUIT_TITLE)
    .setDescription(t.PHYSICAL_FRUIT_DESCRIPTION)
    .addFields(
      {
        name: t.JOIN_SERVER,
        value: `${discordServerInvites['bloxy-market']}`
      },
      {
        name: t.NEXT_STEPS,
        value: t.PHYSICAL_FRUIT_INSTRUCTIONS
      }
    )
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates an embed for a transcript of a fulfilled order.
 *
 * @param {string} orderId - The ID of the order.
 * @param {object} ticket - The ticket object containing order details.
 * @param {Client} client - The Discord client.
 * @returns {EmbedBuilder} - The embed builder object.
 * @see Used in `/fulfill-order` command handler
 */
const createTranscriptEmbed = (ticket, client) => {
  const { orderId } = ticket;
  return new EmbedBuilder()
    .setColor('#45B7D1')
    .setTitle(`Transcript generated for fulfilled order #${orderId}.`)
    .setDescription(
      `The order ${orderId} has been fulfilled. A transcript has been generated for your reference.`
    )
    .addFields({
      name: 'Order Details',
      value: `Order ID: ${ticket.orderId}\nUsername: ${
        ticket.robloxUsername
      }\nTimezone: ${ticket.timezone}\nItems: ${ticket.orderDetails.items
        .map((item) => item.title)
        .join(', ')}`
    })
    .setFooter(getFooter(client))
    .setTimestamp();
};

const createNoPhysicalFruitEmbed = (lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.NO_PHYSICAL_FRUIT_TITLE)
    .setDescription(t.NO_PHYSICAL_FRUIT_DESCRIPTION)
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the embed shown when a user attempts to create a ticket without setting a receiver account on the order.
 * Notifies user that they need to set the Roblox account for the order on the website.
 * @param {string} [lang='en'] - Language code for translations
 * @param {Client} client - The Discord client instance
 * @returns {EmbedBuilder} The missing receiver account embed
 * @see Used when verifying if user has set a receiver account before ticket creation
 */
const createMissingReceiverAccountEmbed = (lang = 'en', client) => {
  const t = translations[lang];
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.MISSING_ROBLOX_ACCOUNT_TITLE)
    .setDescription(t.MISSING_ROBLOX_ACCOUNT_DESCRIPTION)
    .setFooter(getFooter(client))
    .setTimestamp();
};

module.exports = {
  createClaimEmbed,
  createWelcomeEmbed,
  createOrderVerificationEmbed,
  createClaimButton,
  createTimezoneButtons,
  createSummaryEmbed,
  createLanguageSelection,
  createOrderNotFoundEmbed,
  createOrderFoundEmbed,
  createTimezoneEmbed,
  createDifferentGameEmbed,
  createOrderClaimedEmbed,
  createPhysicalFruitEmbed,
  createPhysicalFruitOnlyEmbed,
  createAccountItemsEmbed,
  createTicketExistsEmbed,
  createCompletionMessageEmbed,
  createNoPhysicalFruitEmbed,
  createTranscriptEmbed,
  createMissingReceiverAccountEmbed
};