import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Client,
  ColorResolvable,
} from 'discord.js';
import { getTranslations, type LanguageCode } from '~/lang/index.js';
import { serverInvites } from '~/config/server-invites.js';
import { gameNames } from '~/config/game-names.js';
import type { IOrder, IOrderItem } from '~/schemas/Order.js';
import type { ITicket } from '~/schemas/Ticket.js';

type ItemStatus = IOrderItem['status'] | 'processing' | 'completed';

/**
* Creates a consistent footer for all embeds.
* @param client - The Discord client instance
* @returns The footer object with text and icon
*/
const getFooter = (client: Client<true>) => {
  return {
    text: `BloxyFruit - Most Trusted In-Game Store`,
    iconURL: client.user?.avatarURL() ?? undefined,
  };
};

/**
* Creates the initial embed displayed in the claim channel.
* Prompts users to click the button to create a ticket.
* @param client - The Discord client instance
* @returns The claim embed
*/
export const createClaimEmbed = (client: Client<true>): EmbedBuilder => {
  const t = getTranslations('en');
  return new EmbedBuilder()
    .setColor('#45B7D1')
    .setTitle('🔍 Claim Your Order')
    .setDescription(
      '## Need help with your order? Create a ticket and our support team will assist you!'
    )
    .addFields({
      name: '📝 How it works',
      value:
        '1. Click the button below\n2. Provide your order ID\n3. Our team will assist you',
    })
    .setFooter(getFooter(client))
    .setImage('https://bloxyfruit.com/assets/banner.webp')
    .setTimestamp();
};

/**
* Creates the welcome embed shown after ticket creation.
* Prompts users to select their preferred language.
* @param client - The Discord client instance
* @returns The welcome embed
*/
export const createWelcomeEmbed = (client: Client<true>): EmbedBuilder => {
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
* @returns The language selection buttons
*/
export const createLanguageSelection = (): ActionRowBuilder<ButtonBuilder> => {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('lang_en')
      .setLabel('English')
      .setEmoji('🇬🇧')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('lang_es')
      .setLabel('Español')
      .setEmoji('🇪🇸')
      .setStyle(ButtonStyle.Primary)
  );
};

/**
* Creates the order verification embed.
* Prompts users to provide their order ID.
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The order verification embed
*/
export const createOrderVerificationEmbed = (
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);
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
* @param orderId - The order ID that was not found
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The order not found embed
*/
export const createOrderNotFoundEmbed = (
  orderId: string,
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);
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
* @param orderId - The order ID that was found
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The order found embed
*/
export const createOrderFoundEmbed = (
  orderId: string,
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);
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
* @param serverName - Name of the server/game (should match keys in game-names.ts)
* @returns The claim button
*/

export const createClaimButton = (serverName: keyof typeof gameNames): ActionRowBuilder<ButtonBuilder> => {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
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
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The timezone selection embed
*/
export const createTimezoneEmbed = (
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);
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
* @returns The timezone buttons
*/
export const createTimezoneButtons = (): ActionRowBuilder<ButtonBuilder> => {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
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
 * @param order - The fully populated Order object
 * @param ticket - The relevant Ticket object (or parts of it)
 * @param client - The Discord client instance
 * @returns The summary embed
 */
export const createSummaryEmbed = (
  order: IOrder,
  ticket: Pick<ITicket, 'orderId' | 'robloxUsername' | 'timezone' | 'language'>,
  client: Client<true>
): EmbedBuilder => {
  const lang = ticket.language || 'en';
  const t = getTranslations(lang);

  const statusEmojis: Partial<Record<IOrderItem['status'], string>> & { processing?: string, completed?: string; } = {
    pending: '⌛',
    claimed: '✅',
  };

  const itemsStr = order.items
    .map((item) => {
      const statusEmoji = statusEmojis[item.status] ?? '❓';
      return `${statusEmoji} **${item.title}**\n┗ Quantity: ${item.quantity}x | Category: \`${item.category ?? 'N/A'}\` | Status: \`${item.status}\``;
    })
    .join('\n\n');

  return new EmbedBuilder()
    .setColor('#45B7D1')
    .setTitle(t.SUMMARY_TITLE)
    .addFields(
      {
        name: t.ORDER_DETAILS,
        value: `Order ID: \`${ticket.orderId ?? 'N/A'}\``,
        inline: true,
      },
      {
        name: t.ROBLOX_USERNAME,
        value: `\`${ticket.robloxUsername ?? 'N/A'}\``,
        inline: true,
      },
      {
        name: t.TIMEZONE_LABEL,
        value: `\`${ticket.timezone ?? 'N/A'}\``,
        inline: true
      },
      { name: t.ORDERED_ITEMS, value: itemsStr || 'No items found' }
    )
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
* Creates the embed shown when a duplicate ticket exists for the same order.
* Notifies user of existing ticket and provides a link to it.
* @param orderId - The order ID that already has a ticket
* @param channelId - The ID of the existing ticket channel
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The duplicate ticket embed
*/
export const createTicketExistsEmbed = (
  orderId: string,
  channelId: string,
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.TICKET_EXISTS_TITLE)
    .setDescription(t.TICKET_EXISTS_DESCRIPTION.replace('{orderId}', orderId))
    .addFields({
      name: t.EXISTING_TICKET_CHANNEL,
      value: t.EXISTING_TICKET_LINK.replace('{channelId}', channelId),
    })
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
* Creates the completion message embed.
* Notifies user that their order has been fulfilled.
* @param lang - Language code for translations
* @param reviewsChannelId - The ID of the reviews channel
* @param client - The Discord client instance
* @returns The completion message embed
*/
export const createCompletionMessageEmbed = (
  lang: LanguageCode = 'en',
  reviewsChannelId: string,
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);
  return new EmbedBuilder()
    .setColor('#4ECDC4')
    .setTitle(t.COMPLETION_MESSAGE_TITLE)
    .setDescription(t.COMPLETION_MESSAGE_DESCRIPTION)
    .addFields(
      {
        name: t.LEAVE_REVIEW,
        value: t.LEAVE_REVIEW_CHANNEL.replace(
          '{reviewsChannel}',
          reviewsChannelId
        ),
      },
      { name: t.TRUSTPILOT, value: t.TRUSTPILOT_LINK }
    )
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
* Creates the embed shown when an order is for a different game.
* Provides instructions to join the correct server.
* @param orderId - The order ID that was found
* @param orderGame - The game key associated with the order (from game-names.ts)
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The different game embed
*/
export const createDifferentGameEmbed = (
  orderId: string,
  orderGame: keyof typeof gameNames,
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);

  const gameDisplayName = gameNames[orderGame] ?? 'the correct game';
  const serverInvite = serverInvites[orderGame] ?? '#';

  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.WRONG_GAME_TITLE)
    .setDescription(
      t.WRONG_GAME_DESCRIPTION.replace('{orderId}', orderId).replace(
        '{game}',
        gameDisplayName
      )
    )
    .addFields({
      name: t.WHAT_TO_DO,
      value: t.WRONG_GAME_INSTRUCTIONS.replace(
        '{serverInvite}',
        serverInvite
      ),
    })
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
* Creates the embed shown when an order has been claimed.
* Displays information about the claimed order.
* @param orderId - The order ID that was claimed
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The claimed order embed
*/
export const createOrderClaimedEmbed = (
  orderId: string,
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.ORDER_CLAIMED_TITLE)
    .setDescription(t.ORDER_CLAIMED_DESCRIPTION.replace('{orderId}', orderId))
    .addFields(
      {
        name: t.NEED_HELP,
        value: t.CLAIMED_HELP_TEXT,
      },
      {
        name: t.IMPORTANT,
        value: t.CLAIMED_IMPORTANT_TEXT,
      }
    )
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
* Creates the embed for physical fruit orders (when mixed with other items).
* Provides information about physical fruit fulfillment and server invite.
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The physical fruit embed
*/
export const createPhysicalFruitEmbed = (
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);

  const marketInvite = serverInvites['bloxy-market'] ?? '#';
  return new EmbedBuilder()
    .setColor('#FFD93D')
    .setTitle(t.PHYSICAL_FRUIT_TITLE)
    .setDescription(t.PHYSICAL_FRUIT_DESCRIPTION)
    .addFields(
      {
        name: t.JOIN_SERVER,
        value: marketInvite,
      },
      {
        name: t.IMPORTANT,
        value: t.OTHER_ITEMS,
      }
    )
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
* Creates the embed for account items orders.
* Displays information about account item fulfillment.
* @param orderId - The order ID that was found
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The account items embed
*/
export const createAccountItemsEmbed = (
  orderId: string,
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);
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
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The physical fruit only embed
*/
export const createPhysicalFruitOnlyEmbed = (
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);

  const marketInvite = serverInvites['bloxy-market'] ?? '#';
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.PHYSICAL_FRUIT_TITLE)
    .setDescription(t.PHYSICAL_FRUIT_DESCRIPTION)
    .addFields(
      {
        name: t.JOIN_SERVER,
        value: marketInvite,
      },
      {
        name: t.NEXT_STEPS,
        value: t.PHYSICAL_FRUIT_INSTRUCTIONS,
      }
    )
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates an embed for a transcript of a fulfilled order.
 * @param ticket - The ticket object containing necessary details.
 * @param order - The associated order object.
 * @param client - The Discord client.
 * @returns The embed builder object.
 */
export const createTranscriptEmbed = (
  ticket: Pick<ITicket, 'orderId' | 'robloxUsername' | 'timezone'>,
  order: IOrder,
  client: Client<true>
): EmbedBuilder => {
  const { orderId, robloxUsername, timezone } = ticket;
  const itemsString = order.items
    .map((item) => item.title)
    .join(', ');

  return new EmbedBuilder()
    .setColor('#4ECDC4')
    .setTitle(`Transcript generated for fulfilled order #${orderId}.`)
    .setDescription(
      `The order ${orderId} has been fulfilled. A transcript has been generated for your reference.`
    )
    .addFields({
      name: 'Order Details',
      value: `Order ID: ${orderId}\nUsername: ${robloxUsername ?? 'N/A'}\nTimezone: ${timezone ?? 'N/A'}\nItems: ${itemsString || 'N/A'}`,
    })
    .setThumbnail("https://bloxyfruit.com/favicon.png")
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
* Creates an embed when physical fruits are expected but not found in the order.
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The no physical fruit embed
*/
export const createNoPhysicalFruitEmbed = (
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);
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
* @param lang - Language code for translations
* @param client - The Discord client instance
* @returns The missing receiver account embed
*/
export const createMissingReceiverAccountEmbed = (
  lang: LanguageCode = 'en',
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.MISSING_ROBLOX_ACCOUNT_TITLE)
    .setDescription(t.MISSING_ROBLOX_ACCOUNT_DESCRIPTION)
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates the embed confirming the timezone has been recorded.
 * Notifies the user that staff will assist soon.
 * @param lang - Language code for translations
 * @param client - The Discord client instance
 * @returns The timezone recorded confirmation embed
 */
export const createTimezoneRecordedEmbed = (
  lang: LanguageCode = 'en',
  timezone: string,
  client: Client<true>
): EmbedBuilder => {
  const t = getTranslations(lang);
  return new EmbedBuilder()
    .setColor('#4ECDC4')
    .setTitle(t.TIMEZONE_RECORDED_TITLE)
    .setDescription(t.TIMEZONE_RECORDED_CONTENT.replace("{timezone}", timezone))
    .setFooter(getFooter(client))
    .setTimestamp();
};

/**
 * Creates an embed to notify the user about the risk level of their order.
 * @param riskLevel - The risk level of the order (LOW, MEDIUM, HIGH)
 * @returns The risk order embed
 */
export const createRiskOrderEmbed = (riskLevel: string | null) => {
  const colors: Record<string, ColorResolvable> = {
    LOW: '#4ECDC4',
    MEDIUM: '#FFD93D',
    HIGH: '#FF6B6B',
    default: '#FF6B6B'
  };
  const messages = {
    LOW: 'This order has been flagged as **low** risk. Procceed normally.',
    MEDIUM: 'This order has been flagged as **medium** risk. Please review the order details carefully on Shopify before proceeding.',
    HIGH: 'This order has been flagged as **high** risk. Please review the order details carefully on Shopify before proceeding.',
    default: 'We couldn\'t determine the risk level of this order. Please review the order details carefully on Shopify before proceeding.'
  };
  const color = colors[riskLevel?.toUpperCase() as keyof typeof colors] || colors.default;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle('Order Risk Warning')
    .setDescription(messages[riskLevel?.toUpperCase() as keyof typeof messages] || messages.default)
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/5451/5451854.png');
};

/**
 * Creates the embed shown when an order is cancelled.
 * @param lang - Language code for translations
 * @param client - The Discord client instance
 * @return The order cancelled embed
*/
export const createCancelRefundEmbed = (lang: LanguageCode = 'en', client: Client<true>): EmbedBuilder => {
  const t = getTranslations(lang);
  return new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle(t.ORDER_CANCELLED)
    .setFooter(getFooter(client))
    .setTimestamp();
};