const translations = {
  en: {
    ORDER_VERIFICATION_CONTENT: 'Hello! If you placed an order on our website and paid, please type your **Order ID** below. Only send the Order ID, nothing else.',
    ORDER_FOUND_TITLE: 'Order Found',
    ORDER_FOUND_CONTENT: 'Your order ID **{orderId}** has been found successfully! Please provide your Roblox username.',
    ROBLOX_USERNAME_PROMPT_TITLE: 'Provide Roblox Username',
    ROBLOX_USERNAME_PROMPT_CONTENT: 'Please provide your Roblox username:',
    ROBLOX_USERNAME_RECORDED_TITLE: 'Roblox Username Recorded',
    ROBLOX_USERNAME_RECORDED_CONTENT: 'Thank you, your Roblox username has been recorded as: **{robloxUsername}**',
    LANGUAGE_PROMPT: 'What language do you prefer to be helped in?',
    TIMEZONE_PROMPT_TITLE: 'Select Your Timezone',
    TIMEZONE_PROMPT_CONTENT: 'Please select your timezone region:',
    TIMEZONE_RECORDED_TITLE: 'Timezone Recorded',
    TIMEZONE_RECORDED_CONTENT: 'Thank you, your timezone has been set to: **{timezone}**\n\nA staff member will be with you shortly.',
    WELCOME_TITLE: '👋 Welcome to BloxyFruit Support',
    WELCOME_DESCRIPTION: 'Thank you for contacting us! We\'ll help you with your order.',
    FIRST_STEP: '📝 First Step',
    FIRST_STEP_TEXT: 'Please provide your order ID to begin.',
    WHERE_FIND_ID: '❓ Where to find order ID?',
    WHERE_FIND_ID_TEXT: 'You can find your order ID in the confirmation email we sent you.',
    ORDER_VERIFICATION_TITLE: '🔍 Order Verification',
    ORDER_VERIFICATION_DESCRIPTION: 'Please provide your **Order ID** below.',
    ORDER_NOT_FOUND_TITLE: '❌ Order Not Found',
    ORDER_NOT_FOUND_DESCRIPTION: 'We couldn\'t find an order with ID: **{orderId}**\n\nPlease check your order ID and try again. If you still need help, please create a ticket: https://discord.gg/kAyKCggsKB',
    ORDER_FOUND_TITLE: '✅ Order Found',
    ORDER_FOUND_DESCRIPTION: 'Great! We\'ve found your order **#{orderId}**.',
    TIMEZONE_TITLE: '🌍 Select Your Region',
    TIMEZONE_DESCRIPTION: 'To provide you with the best support, please select your region:',
    SUMMARY_TITLE: '📋 Ticket Summary',
    ORDER_DETAILS: '📦 Order Details',
    ROBLOX_USERNAME: '👤 Roblox Username',
    TIMEZONE_LABEL: '🌍 Region',
    ORDERED_ITEMS: '🛍️ Ordered Items',
    DIFFERENT_GAME_TITLE: '🚫 Different Game',
    DIFFERENT_GAME_CONTENT: 'Your order contains items from the game **{gameName}**. Please join this discord server to claim your order: https://discord.gg/bloxyfruit',
    WRONG_GAME_TITLE: '❌ Wrong Game Support',
    WRONG_GAME_DESCRIPTION: 'Your order **#{orderId}** is for **{game}**.',
    WHAT_TO_DO: '🎮 What to do?',
    WRONG_GAME_INSTRUCTIONS: 'Please join the following discord server to claim your order: {serverInvite}',
    ORDER_CLAIMED_TITLE: '⚠️ Order Already Claimed',
    ORDER_CLAIMED_DESCRIPTION: 'Order **#{orderId}** has already been completed.',
    NEED_HELP: '❓ Need Help?',
    CLAIMED_HELP_TEXT: 'If you haven\'t received your items or need assistance, please explain your issue below.',
    PHYSICAL_FRUIT_TITLE: '🍎 Physical Fruit Detected',
    PHYSICAL_FRUIT_DESCRIPTION: 'Your order contains Physical Fruits that need to be claimed in our delivery server.',
    JOIN_SERVER: '🔗 Join Server',
    PHYSICAL_FRUIT_INSTRUCTIONS: '1. Join the delivery server\n2. Create a ticket there\n3. Provide your order ID\n4. Our team will deliver your fruits',
    IMPORTANT: '⚠️ Important',
    NEXT_STEPS: '📝 Next Steps',
    OTHER_ITEMS: 'Your other items will still be delivered through this ticket.',
    CLAIMED_IMPORTANT_TEXT: 'Please provide any relevant screenshots or information about your order.',
    ACCOUNT_ITEMS_TITLE: '💳 Account Items',
    ACCOUNT_ITEMS_DESCRIPTION: 'Your order contains only accounts. To claim your order, please check out your account on the website https://bloxyfruit.com/account.',
    TICKET_EXISTS_TITLE: '❌ Ticket Already Exists',
    TICKET_EXISTS_DESCRIPTION: 'A support ticket for order **#{orderId}** is already open.',
    EXISTING_TICKET_CHANNEL: '📝 Existing Ticket',
    EXISTING_TICKET_LINK: 'Please continue your conversation in <#{channelId}>',
    COMPLETION_MESSAGE_TITLE: '🎉 Ticket Completed!',
    COMPLETION_MESSAGE_DESCRIPTION: 'Thank you for using our service! We hope you are satisfied with your order.',
    LEAVE_REVIEW: '⭐ Leave Us a Review',
    LEAVE_REVIEW_CHANNEL: 'Make sure to leave us a review at <#{reviewsChannel}>',
    TRUSTPILOT: '🌟 Trustpilot',
    TRUSTPILOT_LINK: 'You can also review us on Trustpilot: [Trustpilot Review](https://www.trustpilot.com/review/bloxyfruit.com)',
    NO_PHYSICAL_FRUIT_TITLE: '🚫 No Physical Fruit',
    NO_PHYSICAL_FRUIT_DESCRIPTION: 'Your order does not contain any physical fruits. Please join the main server to claim your order: https://discord.gg/bloxyfruit',
    MISSING_ROBLOX_ACCOUNT_TITLE: '❌ Missing Receiver Account',
    MISSING_ROBLOX_ACCOUNT_DESCRIPTION: 'Your order doesn\'t have a reciever roblox account linked.\n\nPlease go to our [dashboard](https://bloxyfruit.com/account) and update your order details before trying again.'
  },
  es: {
    ORDER_VERIFICATION_CONTENT: '¡Hola! Si realizaste un pedido en nuestro sitio web y pagaste, por favor ingresa tu **ID de Pedido** a continuación. Solo envía el ID del pedido, nada más.',
    ORDER_NOT_FOUND_TITLE: 'Pedido No Encontrado',
    ORDER_NOT_FOUND_CONTENT: "Lo siento, no pudimos encontrar un pedido con el ID **{orderId}**. Por favor, verifica el ID e intenta nuevamente.",
    ORDER_FOUND_TITLE: 'Pedido Encontrado',
    ORDER_FOUND_CONTENT: '¡Tu ID de pedido **{orderId}** ha sido encontrado exitosamente!',
    ROBLOX_USERNAME_PROMPT_TITLE: 'Proporcionar Nombre de Usuario de Roblox',
    ROBLOX_USERNAME_PROMPT_CONTENT: 'Por favor, proporciona tu nombre de usuario de Roblox:',
    ROBLOX_USERNAME_RECORDED_TITLE: 'Nombre de Usuario de Roblox Registrado',
    ROBLOX_USERNAME_RECORDED_CONTENT: 'Gracias, tu nombre de usuario de Roblox ha sido registrado como: **{robloxUsername}**',
    LANGUAGE_PROMPT: '¿En qué idioma prefieres recibir ayuda?',
    TIMEZONE_PROMPT_TITLE: 'Selecciona Tu Zona Horaria',
    TIMEZONE_PROMPT_CONTENT: 'Por favor, selecciona tu región horaria:',
    TIMEZONE_RECORDED_TITLE: 'Zona Horaria Registrada',
    TIMEZONE_RECORDED_CONTENT: 'Gracias, tu zona horaria ha sido establecida como: **{timezone}**\n\nUn miembro del personal se pondrá en contacto contigo en breve.',
    WELCOME_TITLE: '👋 Bienvenido a Soporte de BloxyFruit',
    WELCOME_DESCRIPTION: 'Gracias por contactarnos! Te ayudaremos con tu pedido.',
    FIRST_STEP: '📝 Primer Paso',
    FIRST_STEP_TEXT: 'Por favor, proporciona tu ID de pedido para comenzar.',
    WHERE_FIND_ID: '❓ Dónde encontrar el ID del pedido?',
    WHERE_FIND_ID_TEXT: 'Puedes encontrar tu ID de pedido en el correo electrónico de confirmación que te enviamos.',
    ORDER_VERIFICATION_TITLE: '🔍 Verificación de Pedido',
    ORDER_VERIFICATION_DESCRIPTION: 'Por favor, proporciona tu **ID de Pedido** a continuación.',
    ORDER_NOT_FOUND_TITLE: '❌ Pedido No Encontrado',
    ORDER_NOT_FOUND_DESCRIPTION: 'No pudimos encontrar un pedido con ID: **{orderId}**\n\nPor favor, verifica tu ID de pedido y vuelve a intentarlo. Si todavía necesitas ayuda, por favor crea un ticket: https://discord.gg/kAyKCggsKB',
    ORDER_FOUND_TITLE: '✅ Pedido Encontrado',
    ORDER_FOUND_DESCRIPTION: '¡Genial! Hemos encontrado tu pedido **#{orderId}**\nAhora, por favor proporciona tu nombre de usuario de Roblox.',
    TIMEZONE_TITLE: '🌍 Selecciona Tu Región',
    TIMEZONE_DESCRIPTION: 'Para brindarte el mejor soporte, por favor selecciona tu región:',
    SUMMARY_TITLE: '📋 Resumen del Ticket',
    ORDER_DETAILS: '📦 Detalles del Pedido',
    ROBLOX_USERNAME: '👤 Nombre de Usuario de Roblox',
    TIMEZONE_LABEL: '🌍 Región',
    ORDERED_ITEMS: '🛍️ Artículos Pedidos',
    DIFFERENT_GAME_TITLE: '🚫 Juego Diferente',
    DIFFERENT_GAME_CONTENT: 'Tu pedido contiene artículos de **{gameName}**. Por favor, cambia al juego en el que realizaste el pedido y vuelve a intentarlo.',
    WRONG_GAME_TITLE: '❌ Soporte de Juego Incorrecto',
    WRONG_GAME_DESCRIPTION: 'Tu pedido **#{orderId}** es para **{game}**.\nEste canal de soporte es solo para Blox Fruits.',
    WHAT_TO_DO: '🎮 ¿Qué hacer?',
    WRONG_GAME_INSTRUCTIONS: 'Por favor, crea un ticket en el canal de soporte apropiado para tu juego.',
    ORDER_CLAIMED_TITLE: '⚠️ Pedido Ya Reclamado',
    ORDER_CLAIMED_DESCRIPTION: 'El pedido **#{orderId}** ya ha sido completado.',
    NEED_HELP: '❓ ¿Necesitas Ayuda?',
    CLAIMED_HELP_TEXT: 'Si no has recibido tus artículos o necesitas ayuda, por favor explica tu problema abajo.',
    PHYSICAL_FRUIT_TITLE: '🍎 Fruta Física Detectada',
    PHYSICAL_FRUIT_DESCRIPTION: 'Tu pedido contiene Frutas Físicas que deben ser reclamadas en nuestro servidor de entrega.',
    JOIN_SERVER: '🔗 Únete Servidor',
    PHYSICAL_FRUIT_INSTRUCTIONS: '1. Únete al servidor de entrega\n2. Crea un ticket allí\n3. Proporciona tu ID de pedido\n4. Nuestro equipo entregará tus frutas',
    IMPORTANT: '⚠️ Importante',
    NEXT_STEPS: '📝 Pasos Siguientes',
    OTHER_ITEMS: 'Tus otros artículos todavía serán entregados a través de este ticket.',
    CLAIMED_IMPORTANT_TEXT: 'Por favor, proporciona cualquier información relevante o capturas de pantalla sobre tu pedido.',
    ACCOUNT_ITEMS_TITLE: '💳 Artículos de Cuenta',
    ACCOUNT_ITEMS_DESCRIPTION: 'Tu pedido contiene solo cuentas. Para reclamar tu pedido, por favor revisa tu cuenta en el sitio web https://bloxyfruit.com/account.',
    TICKET_EXISTS_TITLE: '❌ Ticket Ya Existe',
    TICKET_EXISTS_DESCRIPTION: 'Ya existe un ticket de soporte para el pedido **#{orderId}**.',
    EXISTING_TICKET_CHANNEL: '📝 Ticket Existente',
    EXISTING_TICKET_LINK: 'Por favor, continúa tu conversación en <#{channelId}>',
    COMPLETION_MESSAGE_TITLE: '🎉 ¡Ticket Completado!',
    COMPLETION_MESSAGE_DESCRIPTION: '¡Gracias por usar nuestro servicio! Esperamos que estés satisfecho con tu pedido.',
    LEAVE_REVIEW: '⭐ Déjanos una Reseña',
    LEAVE_REVIEW_CHANNEL: 'Asegúrate de dejarnos una reseña en <#{reviewsChannel}>',
    TRUSTPILOT: '🌟 Trustpilot',
    TRUSTPILOT_LINK: 'También puedes reseñarnos en Trustpilot: [Reseña en Trustpilot](https://www.trustpilot.com/review/bloxyfruit.com)',
    NO_PHYSICAL_FRUIT_TITLE: '🚫 No Fruta Física',
    NO_PHYSICAL_FRUIT_DESCRIPTION: 'Tu pedido no contiene ninguna fruta física. Por favor, únete al servidor principal para reclamar tu pedido: https://discord.gg/bloxyfruit',
    MISSING_ROBLOX_ACCOUNT_TITLE: '❌ Cuenta de Roblox No Configurada',
    MISSING_ROBLOX_ACCOUNT_DESCRIPTION: 'Tu pedido no tiene una cuenta de Roblox receptora vinculada.\n\nVe a nuestro [panel de control](https://bloxyfruit.com/account) y actualiza los detalles de tu pedido antes de volver a crear otro ticket.'
  }
}

module.exports = {
  translations
}