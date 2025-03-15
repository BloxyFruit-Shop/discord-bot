const { Client, GatewayIntentBits, ChannelType } = require("discord.js")
const fs = require('fs')
const { orders } = require('./mongo')
const {
  createClaimEmbed,
  createWelcomeEmbed,
  createOrderVerificationEmbed,
  createClaimButton,
  createTimezoneButtons,
  createSummaryEmbed,
  createLanguageSelection,
  createOrderNotFoundEmbed,
  createOrderFoundEmbed,
  createProvideUsernameButton,
  createProvideRobloxUsernameEmbed,
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
} = require('./embeds')
const { shopify, shopifySession, getFullfilmentOrderId, fullFillmentOrder } = require('./shopify')
require('dotenv').config()

const TOKEN = process.env.DISCORD_TOKEN
const TICKET_TIMEOUT = 60 * 1000 // 2 minutes in milliseconds

const servers = {
  "rivals": {
    "name": "rivals",
    "guild": "1307806087029719150",
    "claim": "1307810129772675183",
    "admin-role": "1307807245647614052",
    "customer-role": "1307825472817594419",
    "reviews-channel": "1307810413609746503"
  },
  "anime-vanguards": {
    "name": "anime-vanguards",
    "guild": "1307849927606534278",
    "claim": "1307851786413146244",
    "admin-role": "1307869392708702289",
    "customer-role": "1307869068925337610",
    "reviews-channel": "1307851882714107976"
  },
  "blox-fruits": { 
    "name": "blox-fruits",
    "guild": "1227899053858099211",
    "claim": "1308870249529217044",
    "admin-role": "1228459695094890518",
    "customer-role": "1227908406078210100",
    "reviews-channel": "1249618905257873479"
  },
  "bloxy-market": {
    "name": "bloxy-market",
    "guild": "1244326151673872455",
    "claim": "1308872951763963995",
    "admin-role": "1244337505566724246",
    "customer-role": "1244339233574096916",
    "reviews-channel": "1244336701652865055"
  },
  "pets-go": {
    "name": "pets-go",
    "guild": "1307808175587725322",
    "claim": "1307818267716620348",
    "admin-role": "1307820453183623239",
    "customer-role": "1308895158586179595",
    "reviews-channel": "1307818339938336768"
  },
  "king-legacy": {
    "name": "king-legacy",
    "guild": "1310312947452477592",
    "claim": "1310312947851071582",
    "admin-role": "1310312947452477601",
    "customer-role": "1310312947452477595",
    "reviews-channel": "1310312947851071583"
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
})

let ticketStages = {}

const loadTicketStages = () => {
  if (fs.existsSync('ticketStages.json')) {
    const data = fs.readFileSync('ticketStages.json', 'utf8')
    ticketStages = JSON.parse(data)
  }
}

const saveTicketStages = () => {
  const serializedTicketStages = Object.fromEntries(
    Object.entries(ticketStages).map(([key, value]) => {
      const { deletionTimeout, ...stageWithoutTimeout } = value
      return [key, stageWithoutTimeout]
    })
  )

  fs.writeFileSync('ticketStages.json', JSON.stringify(serializedTicketStages), 'utf8')
}

function scheduleTicketDeletion(channel, ticketStage) {
  console.log("TICKET SCHEDULED FOR DELETION", ticketStages[channel.id]?.stage, ticketStage)
  const timeoutId = setTimeout(async () => {
    // Check if ticket still exists and is in the same stage
    if (ticketStages[channel.id]?.stage === ticketStage.stage || ticketStages[channel.id]?.stage === "orderVerification") {
      try {
        // Delete from ticketStages
        delete ticketStages[channel.id]
        saveTicketStages()
        
        // Delete the channel
        await channel.delete()
      } catch (error) {
        console.error('Error deleting inactive ticket:', error)
      }
    }
  }, TICKET_TIMEOUT)

  // Store the timeout ID in the ticket stage
  ticketStages[channel.id].deletionTimeout = timeoutId
}

async function cleanupStaleTickets() {
  try {
    for (const [channelId, ticketData] of Object.entries(ticketStages)) {
      const channel = await client.channels.fetch(channelId).catch(() => null)
      
      // Delete ticket if:
      // Channel doesn't exist anymore
      // No orderId and not in language selection stage
      // In orderVerification stage
      if (!channel || !ticketData.orderId) {
        delete ticketStages[channelId]
        
        if (channel) {
          await channel.delete().catch(err => 
            console.error(`Failed to delete stale channel ${channelId}:`, err)
          )
        }
      }
    }
    
    // Save cleaned up ticket stages
    saveTicketStages()
  } catch (error) {
    console.error('Error during ticket cleanup:', error)
  }
}

client.once('ready', async () => {
  loadTicketStages()
  await cleanupStaleTickets()
  console.log(`Logged in as ${client.user.tag}`)

  for (const [serverName, channels] of Object.entries(servers)) {
    console.log(serverName, channels)

    const claimChannel = await client.channels.fetch(channels.claim)
    
    if (!claimChannel) continue

    try {
      const messages = await claimChannel.messages.fetch()
      await claimChannel.bulkDelete(messages)
    } catch (error) {
      console.error(`Failed to clear messages in ${serverName}:`, error)
    }

    const claimEmbed = createClaimEmbed(client)
    const claimButton = createClaimButton(serverName)

    await claimChannel.send({ embeds: [claimEmbed], components: [claimButton] })
  }

  const commands = [
    {
      name: 'fulfill-order',
      description: 'Mark a ticket as completed'
    },
    {
      name: 'delete-completed',
      description: 'Delete all completed tickets'
    },
    {
      name: "delete-ticket",
      description: "Delete a ticket"
    },
    {
      name: "cancel-order",
      description: "Cancel an order"
    }
  ]

  try {
    for (const serverConfig of Object.values(servers)) {
      const guild = await client.guilds.fetch(serverConfig.guild)
      if (guild) {
        await guild.commands.set(commands)
        console.log(`Slash commands registered for ${serverConfig.name}`)
      }
    }
  } catch (error) {
    console.error('Error registering slash commands:', error)
  }
})

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId.startsWith('create_ticket_')) {
      await handleTicketCreation(interaction)
      return
    }
  
    const ticketStage = ticketStages[interaction.channel?.id]
    if (interaction.isButton() && ticketStage) {
      if (interaction.isButton() && (interaction.customId === 'english' || interaction.customId === 'spanish')) {
        await handleLanguageSelection(interaction, ticketStage)
      }

      if (interaction.isButton() && interaction.customId === 'provideRobloxUsername') {
        await handleUsernameButton(interaction, ticketStage)
      }

      if (interaction.isButton() && interaction.customId.startsWith('timezone_')) {
        await handleTimezoneSelection(interaction, ticketStage)
      }

      return
    }

    if (interaction.isCommand()) {
      await handleSlashCommands(interaction, ticketStage)
    }
  } catch (error) {
    console.error('Interaction error:', error)
  }
})

client.on('messageCreate', async (message) => {
  if (!ticketStages[message.channel.id] || message.author.bot) return

  const ticketStage = ticketStages[message.channel.id]
  const serverName = ticketStage.serverName
  const serverConfig = servers[serverName]
  
  if (!serverConfig) return

  if (message.author.id !== ticketStage.userId) {
    return
  }

  if (ticketStage.stage === 'orderVerification') {
    await handleOrderVerification(serverName, message, ticketStage)
  } else if (ticketStage.stage === 'robloxUsername') {
    await handleUsernameSubmission(message, ticketStage)
  }
})

client.rest.on('rateLimited', (info) => {
  console.log('Rate limit hit:', {
    timeout: info.timeToReset,
    limit: info.limit,
    method: info.method,
    path: info.path,
    route: info.route,
    global: info.global
  })
})

async function handleTicketCreation(interaction) {
  try {
    const serverName = interaction.customId.replace('create_ticket_', '')
    const serverConfig = servers[serverName]
    
    if (!serverConfig) return

    const userTicketCount = Object.values(ticketStages).filter(ticket => 
      ticket.userId === interaction.user.id && 
      ticket.serverName === serverName &&
      ticket.stage !== 'finished'
    ).length

    if (userTicketCount >= 2) {
      await interaction.reply({ 
        content: 'You can only have 2 active tickets at a time in this server.', 
        ephemeral: true 
      })
      return
    }

    const guild = interaction.guild

    const ticketChannel = await guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
        {
          id: interaction.user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
        {
          id: client.user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
        {
          id: serverConfig['admin-role'],
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        }
      ]
    })

    ticketStages[ticketChannel.id] = {
      stage: 'languagePreference',
      language: null,
      orderId: null,
      robloxUsername: null,
      timezone: null,
      serverName: serverName,
      userId: interaction.user.id
    }
    saveTicketStages()

    await interaction.reply({ 
      content: `Ticket Created ${ticketChannel}`, 
      ephemeral: true 
    })

    const embed = createWelcomeEmbed(client)
    const row = createLanguageSelection()

    await ticketChannel.send({ embeds: [embed], components: [row] })

    scheduleTicketDeletion(ticketChannel, ticketStages[ticketChannel.id])
  } catch (error) {
    console.error('Ticket creation error:', error)
  }
}

async function handleLanguageSelection(interaction, ticketStage) {
  if (ticketStage.stage !== 'languagePreference') return

  if (interaction.user.id !== ticketStage.userId) {
    return
  }

  ticketStages[interaction.channel.id].language = interaction.customId === 'english' ? 'en' : 'es'
  ticketStages[interaction.channel.id].stage = 'orderVerification'
  saveTicketStages()

  const orderEmbed = createOrderVerificationEmbed(ticketStages[interaction.channel.id].language, client)

  await interaction.reply({ embeds: [orderEmbed], ephemeral: true })
}

async function handleOrderVerification(serverName, message, ticketStage) {
  const orderId = message.content.trim().replace("#", '')

  try {
    const order = await orders.findOne({ id: orderId })

    if (!order || order?.status === "cancelled") {
      const embed = createOrderNotFoundEmbed(orderId, ticketStage.language, client)
      return message.channel.send({ embeds: [embed] })
    }

    const existingTicket = Object.entries(ticketStages).find(([channelId, stage]) => 
      stage.orderId === orderId && 
      channelId !== message.channel.id &&
      serverName === ticketStage.serverName
    )

    if (existingTicket) {
      const [existingChannelId] = existingTicket
      const embed = createTicketExistsEmbed(orderId, existingChannelId, ticketStage.language, client)
      await message.channel.send({ embeds: [embed] })

      delete ticketStages[message.channel.id]
      saveTicketStages()
      
      setTimeout(async () => {
          try {
            await message.channel.delete()
          } catch (error) {
            console.error('Error deleting duplicate ticket:', error)
          }
      }, 30000)
      return
    }

    if (order.game && order.game !== serverName && !(order.game === "blox-fruits" && serverName === "bloxy-market")) {
      const embed = createDifferentGameEmbed(orderId, order.game, ticketStage.language, client)
      setTimeout(() => {
        if(ticketStages[message.channel.id].orderId == null) {
          delete ticketStages[message.channel.id]
          saveTicketStages()
        }
        try {
          message.channel.delete()
        } catch (error) {
          console.error('Error deleting different game ticket:', error)
        }
      }, 60_000)
      return message.channel.send({ embeds: [embed] })
    }

    if (order.status === "completed") {
      setTimeout(() => {
        if (ticketStages[message?.channel?.id].orderId !== orderId) return
        
        delete ticketStages[message.channel.id]
        saveTicketStages()
        
        try {
          message.channel.delete()
        } catch (error) {
          console.error('Error deleting completed ticket:', error)
        }
      }, 60_000)

      const embed = createOrderClaimedEmbed(orderId, ticketStage.language, client)
      return message.channel.send({ embeds: [embed] })
    }

    const onlyAccountItems = order.items.every(item => item.deliveryType === "account")
    if (onlyAccountItems) {
      const accountItemsEmbed = createAccountItemsEmbed(orderId, ticketStage.language, client)
      setTimeout(() => {
        if (ticketStages[message.channel.id].orderId !== orderId) return
        
        delete ticketStages[message.channel.id]
        saveTicketStages()
        
        try {
          message.channel.delete()
        } catch (error) {
          console.error('Error deleting account items ticket:', error)
        }
      }, 60_000)

      return message.channel.send({ embeds: [accountItemsEmbed] })
    }

    const onlyPhysicalFruit = order.items.every(item => item.category === "Physical Fruit")
    if (onlyPhysicalFruit && serverName !== "bloxy-market") {
      const physicalFruitEmbed = createPhysicalFruitOnlyEmbed(ticketStage.language, client)

      delete ticketStages[message.channel.id]
      saveTicketStages()

      setTimeout(() => {
        if (ticketStages[message.channel.id].orderId !== orderId) return
        
        try {
          message.channel.delete()
        } catch (error) {
          console.error('Error deleting ticket:', error)
        }
      }, 60_000)
      await message.channel.send({ embeds: [physicalFruitEmbed] })
      return
    }

    const noPhysicalFruit = order.items.every(item => item.category !== "Physical Fruit")
    if (noPhysicalFruit && serverName == "bloxy-market") {
      const noPhysicalFruitEmbed = createNoPhysicalFruitEmbed(ticketStage.language, client)
      await message.channel.send({ embeds: [noPhysicalFruitEmbed] })
      return
    }

    clearDeletionTimeout(message.channel.id)

    ticketStages[message.channel.id].orderId = orderId
    ticketStages[message.channel.id].orderDetails = order

    const orderFoundEmbed = createOrderFoundEmbed(orderId, ticketStage.language, client)
    const usernameButton = createProvideUsernameButton(ticketStage.language, client)
    await message.channel.send({ embeds: [orderFoundEmbed], components: [usernameButton] })

    ticketStages[message.channel.id].stage = 'robloxUsername'
    saveTicketStages()

  } catch (error) {
    console.error('Error fetching order:', error)
    message.channel.send('There was an error processing your order. Please try again.')
  }
}

async function handleUsernameButton(interaction, ticketStage) {
  try {
    if (ticketStage.stage !== 'robloxUsername') return
    if (interaction.user.id !== ticketStage.userId) return
    
    const embed = createProvideRobloxUsernameEmbed(ticketStage.language, client)
    await interaction.reply({ embeds: [embed], ephemeral: true })
  } catch (error) {
    console.error('Username button error:', error)
  }
}

async function handleUsernameSubmission(message, ticketStage) {
  clearDeletionTimeout(message.channel.id)

  const robloxUsername = message.content.trim()
  ticketStages[message.channel.id].robloxUsername = robloxUsername
  
  ticketStages[message.channel.id].stage = 'timezone'
  saveTicketStages()

  const usernameEmbed = createProvidedUsernameEmbed(robloxUsername, ticketStage.language, client)
  const timezoneEmbed = createTimezoneEmbed(ticketStage.language, client)

  const row = createTimezoneButtons()

  await message.channel.send({ embeds: [usernameEmbed] })
  await message.channel.send({ embeds: [timezoneEmbed], components: [row] })
}

async function handleTimezoneSelection(interaction, ticketStage) {
  if (!ticketStage || ticketStage.stage !== 'timezone') return
    if (interaction.user.id !== ticketStage.userId) {
    return
  }

  const timezone = interaction.customId.replace('timezone_', '')
  const serverConfig = servers[ticketStage.serverName]
  if (!serverConfig) return

  try {
    ticketStages[interaction.channel.id].timezone = timezone
    ticketStages[interaction.channel.id].stage = 'finished'
    saveTicketStages()

    const orderDetails = ticketStage.orderDetails
    
    const resumeEmbed = createSummaryEmbed(orderDetails, ticketStage, timezone, ticketStage.language, client)

    const hasPhysicalFruit = orderDetails.items.some(item => item.category === "Physical Fruit")
    if (hasPhysicalFruit && ticketStage.serverName !== "bloxy-market") {
      const physicalFruitEmbed = createPhysicalFruitEmbed(ticketStage.language, client)
      await interaction.channel.send({ embeds: [physicalFruitEmbed] })
      return
    }

    clearDeletionTimeout(interaction.channel.id)

    await interaction.channel.sendTyping()
    await interaction.channel.send({ embeds: [resumeEmbed] })
  } catch (error) {
    console.error('Failed to move ticket:', error)
    await interaction.reply({ 
      content: 'There was an error moving your ticket. Please contact an administrator.', 
      ephemeral: true 
    })
  }
}

async function handleSlashCommands(interaction, ticketStage) {
  const serverId = interaction.guild.id

  const serverConfig = Object.values(servers).find(server => server.guild === serverId)
  if (!serverConfig) return

  const member = await interaction.guild.members.fetch(interaction.user.id)
  const hasAdminRole = member.roles.cache.has(serverConfig['admin-role'])

  if (!hasAdminRole) {
    await interaction.reply({ 
      content: 'You do not have permission to use this command.', 
      ephemeral: true 
    })
    return
  }

  if (interaction.commandName === 'delete-ticket') {
    try {
      const channel = interaction.channel
      if (!channel.name.startsWith('ticket-')) {
        await interaction.reply({ 
          content: 'This command can only be used in ticket channels!', 
          ephemeral: true 
        })
        return
      }

      delete ticketStages[channel.id]
      
      await channel.delete()

      await interaction.reply({ 
        content: 'Ticket has been deleted!', 
        ephemeral: true 
      })
    } catch (error) {
      console.error('Error deleting ticket:', error)
      await interaction.reply({ 
        content: 'There was an error deleting the ticket.', 
        ephemeral: true 
      })
    }
    return
  }

  if (interaction.commandName === 'cancel-order') {
    try {
      const channel = interaction.channel
      if (!channel.name.startsWith('ticket-')) {
        await interaction.reply({ 
          content: 'This command can only be used in ticket channels!', 
          ephemeral: true 
        })
        return
      }

      await orders.findOneAndUpdate(
        { id: ticketStage.orderId }, 
        { $set: { status: 'cancelled' } }
      ).exec()

      await channel.setName(`cancelled-${channel.name.slice(7)}`)

      await interaction.reply({
        content: 'Order has been cancelled!',
        ephemeral: true
      })
    } catch (error) {
      console.error('Error cancelling order:', error)
      await interaction.reply({ 
        content: 'There was an error cancelling the order.', 
        ephemeral: true 
      })
    }
    return
  }

  if (interaction.commandName === 'fulfill-order') {
    try {
      const channel = interaction.channel
      if (!channel.name.startsWith('ticket-')) {
        await interaction.reply({ 
          content: 'This command can only be used in ticket channels!', 
          ephemeral: true 
        })
        return
      }

      const fulfillmentOrderId = await getFullfilmentOrderId(ticketStage.orderId)
      const fullfilledOrder = await fullFillmentOrder(fulfillmentOrderId[0])

      await channel.setName(`completed-${channel.name.slice(7)}`)

      await orders.findOneAndUpdate({ id: ticketStage.orderId }, { $set: { status: 'completed' } }).exec()

      const user = await client.users.fetch(ticketStage.userId)

      if(ticketStage.language === 'en') {
        await user.send({ 
          embeds: [createCompletionMessageEmbed('en', serverConfig['reviews-channel'], client)] 
        })
      } else if (ticketStage.language === 'es') {
        await user.send({ 
          embeds: [createCompletionMessageEmbed('es', serverConfig['reviews-channel'], client)] 
        })
      }

      const guildMember = await interaction.guild.members.fetch(ticketStage.userId)
      
      await guildMember.roles.add(serverConfig['customer-role'])

      await interaction.reply({
        content: 'Ticket marked as completed!',
        ephemeral: true
      })
    } catch (error) {
      console.error('Error completing ticket:', error)
      await interaction.reply({ 
        content: 'There was an error completing the ticket.', 
        ephemeral: true 
      })
    }
  }

  if (interaction.commandName === 'delete-completed') {
    try {
      const guild = interaction.guild
      const completedChannels = guild.channels.cache.filter(channel => 
        channel.name.startsWith('completed-') && 
        channel.type === ChannelType.GuildText
      )

      let deletedCount = 0
      for (const [, channel] of completedChannels) {
        try {
          await channel.delete()
          deletedCount++
        } catch (error) {
          console.error('Error deleting completed ticket:', error)
        }
      }

      await interaction.reply({ 
        content: `Successfully deleted ${deletedCount} completed ticket${deletedCount !== 1 ? 's' : ''}!`, 
        ephemeral: true 
      })
    } catch (error) {
      console.error('Error deleting completed tickets:', error)
      await interaction.reply({ 
        content: 'There was an error deleting completed tickets.', 
        ephemeral: true 
      })
    }
  }
}

function clearDeletionTimeout(channelId) {
  console.log("CLEARING DELETION TIMEOUT", channelId)
  if (ticketStages[channelId]?.deletionTimeout) {
    clearTimeout(ticketStages[channelId].deletionTimeout)
    delete ticketStages[channelId].deletionTimeout
  }
}

client.login(TOKEN)