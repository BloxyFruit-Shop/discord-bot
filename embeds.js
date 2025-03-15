const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { translations } = require('./translations')

const discordServerInvites = {
  "rivals": "https://discord.gg/bloxyrivals",
  "blox-fruits": "https://discord.gg/bloxyfruit",
  "bloxy-market": "https://discord.gg/fyTQNnbW7B",
  "pets-go": "https://discord.gg/bloxypets",
  "anime-vanguards": "https://discord.gg/5gwAZZpXSw",
  "king-legacy": "https://discord.gg/8sjBPzzxwA"
}

const gameNames = {
  "rivals": "Rivals",
  "blox-fruits": "Blox Fruits",
  "bloxy-market": "Blox Fruits Physicals",
  "pets-go": "Pets Go",
  "anime-vanguards": "Anime Vanguards",
  "king-legacy": "King Legacy"
}

const getFooter = (client) => {
  return { 
      text: `BloxyFruit - Most Trusted In-Game Store`, 
      iconURL: client.user.avatarURL() 
  }
}

const createClaimEmbed = (client) => {
  return new EmbedBuilder()
      .setColor('#45B7D1')
      .setTitle('🔍 Claim Your Order')
      .setDescription('## Need help with your order? Create a ticket and our support team will assist you!')
      .addFields(
          { name: '📝 How it works', value: '1. Click the button below\n2. Provide your order ID\n3. Our team will assist you' },
      )
      .setFooter(getFooter(client))
      .setImage("https://robloxdelivery.com/assets/banner.webp")
      .setTimestamp()
}

const createWelcomeEmbed = (client) => {
  return new EmbedBuilder()
      .setColor('#45B7D1')
      .setTitle("🌎 Select Your Language")
      .setDescription("Choose your preferred language for support:")
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createLanguageSelection = () => {
  return new ActionRowBuilder()
    .addComponents(
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
    )
}

const createOrderVerificationEmbed = (lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#4ECDC4')
      .setTitle(t.ORDER_VERIFICATION_TITLE)
      .setDescription(t.ORDER_VERIFICATION_DESCRIPTION)
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createOrderNotFoundEmbed = (orderId, lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle(t.ORDER_NOT_FOUND_TITLE)
      .setDescription(t.ORDER_NOT_FOUND_DESCRIPTION.replace('{orderId}', orderId))
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createOrderFoundEmbed = (orderId, lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#4ECDC4')
      .setTitle(t.ORDER_FOUND_TITLE)
      .setDescription(t.ORDER_FOUND_CONTENT.replace('{orderId}', orderId))
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createProvideUsernameButton = (lang = 'en', client) => {
  const t = translations[lang]
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('provideRobloxUsername')
        .setLabel(t.ROBLOX_USERNAME_PROMPT_TITLE)
        .setStyle(ButtonStyle.Primary)
    )
}

const createProvideRobloxUsernameEmbed = (lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#4ECDC4')
      .setTitle(t.ROBLOX_USERNAME_PROMPT_TITLE)
      .setDescription(t.ROBLOX_USERNAME_PROMPT_CONTENT)
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createProvidedUsernameEmbed = (robloxUsername, lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#4ECDC4')
      .setTitle(t.ROBLOX_USERNAME_RECORDED_TITLE)
      .setDescription(t.ROBLOX_USERNAME_RECORDED_CONTENT.replace('{robloxUsername}', robloxUsername))
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createClaimButton = (serverName) => {
  return new ActionRowBuilder()
      .addComponents(
          new ButtonBuilder()
              .setCustomId(`create_ticket_${serverName}`)
              .setLabel("Claim Order")
              .setEmoji('📩')
              .setStyle(ButtonStyle.Primary)
      )
}

const createTimezoneEmbed = (lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#45B7D1')
      .setTitle(t.TIMEZONE_TITLE)
      .setDescription(t.TIMEZONE_DESCRIPTION)
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createTimezoneButtons = () => {
  return new ActionRowBuilder()
      .addComponents(
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
      )
}

const createSummaryEmbed = (orderDetails, ticketStage, timezone, lang = 'en', client) => {
  const t = translations[lang]
  const itemsStr = orderDetails.items.map(item => {
      const statusEmoji = {
          'processing': '⏳',
          'pending': '⌛',
          'claimed': '✅',
          'completed': '✨'
      }[item.status] || '❓'
      
      return `${statusEmoji} **${item.title}**\n┗ Quantity: ${item.quantity}x | Category: \`${item.category}\` | Status: \`${item.status}\``
  }).join('\n\n')

  return new EmbedBuilder()
      .setColor('#45B7D1')
      .setTitle(t.SUMMARY_TITLE)
      .addFields(
          { name: t.ORDER_DETAILS, value: `Order ID: \`${ticketStage.orderId}\``, inline: true },
          { name: t.ROBLOX_USERNAME, value: `\`${ticketStage.robloxUsername}\``, inline: true },
          { name: t.TIMEZONE_LABEL, value: `\`${timezone}\``, inline: true },
          { name: t.ORDERED_ITEMS, value: itemsStr || 'No items found' }
      )
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createTicketExistsEmbed = (orderId, channelId, lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle(t.TICKET_EXISTS_TITLE)
      .setDescription(t.TICKET_EXISTS_DESCRIPTION.replace('{orderId}', orderId))
      .addFields({
          name: t.EXISTING_TICKET_CHANNEL,
          value: t.EXISTING_TICKET_LINK.replace('{channelId}', channelId)
      })
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createCompletionMessageEmbed = (lang = 'en', reviewsChannel, client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#4ECDC4')
      .setTitle(t.COMPLETION_MESSAGE_TITLE)
      .setDescription(t.COMPLETION_MESSAGE_DESCRIPTION)
      .addFields(
          { name: t.LEAVE_REVIEW, value: t.LEAVE_REVIEW_CHANNEL.replace('{reviewsChannel}', reviewsChannel) },
          { name: t.TRUSTPILOT, value: t.TRUSTPILOT_LINK }
      )
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createDifferentGameEmbed = (orderId, orderGame, lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle(t.WRONG_GAME_TITLE)
      .setDescription(t.WRONG_GAME_DESCRIPTION.replace('{orderId}', orderId).replace('{game}', gameNames[orderGame]))
      .addFields(
          { 
              name: t.WHAT_TO_DO, 
              value: t.WRONG_GAME_INSTRUCTIONS.replace('{serverInvite}', discordServerInvites[orderGame])
          }
      )
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createOrderClaimedEmbed = (orderId, lang = 'en', client) => {
  const t = translations[lang]
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
      .setTimestamp()
}

const createPhysicalFruitEmbed = (lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#FFD93D')
      .setTitle(t.PHYSICAL_FRUIT_TITLE)
      .setDescription(t.PHYSICAL_FRUIT_DESCRIPTION)
      .addFields(
          { 
              name: t.JOIN_SERVER, 
              value: `${discordServerInvites["bloxy-market"]}`
          },
          {
              name: t.IMPORTANT,
              value: t.OTHER_ITEMS
          }
      )
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createAccountItemsEmbed = (orderId, lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle(t.ACCOUNT_ITEMS_TITLE)
      .setDescription(t.ACCOUNT_ITEMS_DESCRIPTION.replace('{orderId}', orderId))
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createPhysicalFruitOnlyEmbed = (lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle(t.PHYSICAL_FRUIT_TITLE)
      .setDescription(t.PHYSICAL_FRUIT_DESCRIPTION)
      .addFields(
          { 
              name: t.JOIN_SERVER, 
              value: `${discordServerInvites["bloxy-market"]}`
          },
          {
              name: t.NEXT_STEPS,
              value: t.PHYSICAL_FRUIT_INSTRUCTIONS
          }
      )
      .setFooter(getFooter(client))
      .setTimestamp()
}

const createNoPhysicalFruitEmbed = (lang = 'en', client) => {
  const t = translations[lang]
  return new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle(t.NO_PHYSICAL_FRUIT_TITLE)
      .setDescription(t.NO_PHYSICAL_FRUIT_DESCRIPTION)
      .setFooter(getFooter(client))
      .setTimestamp()
}

module.exports = {
  createClaimEmbed,
  createWelcomeEmbed,
  createOrderVerificationEmbed,
  createClaimButton,
  createTimezoneButtons,
  createSummaryEmbed,
  createLanguageSelection,
  createOrderNotFoundEmbed,
  createProvideUsernameButton,
  createProvideRobloxUsernameEmbed,
  createOrderFoundEmbed,
  createTimezoneEmbed,
  createProvidedUsernameEmbed,
  createDifferentGameEmbed,
  createOrderClaimedEmbed,
  createPhysicalFruitEmbed,
  createPhysicalFruitOnlyEmbed,
  createAccountItemsEmbed,
  createTicketExistsEmbed,
  createCompletionMessageEmbed,
  createNoPhysicalFruitEmbed
}