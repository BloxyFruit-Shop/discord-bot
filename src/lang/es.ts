import type { TranslationSet } from '../types/translations'; // Adjust path if needed

export const es: TranslationSet = {
    ORDER_VERIFICATION_CONTENT: '¡Hola! Si realizaste un pedido en nuestro sitio web y pagaste, por favor ingresa tu **ID de Pedido** a continuación. Solo envía el ID del pedido, nada más.',
    ORDER_FOUND_CONTENT: '¡Tu ID de pedido **{orderId}** ha sido encontrado exitosamente!',
    LANGUAGE_PROMPT: '¿En qué idioma prefieres recibir ayuda?',
    TIMEZONE_PROMPT_TITLE: 'Selecciona Tu Zona Horaria',
    TIMEZONE_PROMPT_CONTENT: 'Por favor, selecciona tu región horaria:',
    TIMEZONE_RECORDED_TITLE: 'Zona Horaria Registrada',
    TIMEZONE_RECORDED_CONTENT: 'Gracias, tu zona horaria ha sido establecida como: **{timezone}**.',
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
    MISSING_ROBLOX_ACCOUNT_DESCRIPTION: 'Tu pedido no tiene una cuenta de Roblox receptora vinculada.\n\nVe a nuestro [panel de control](https://bloxyfruit.com/account) y actualiza los detalles de tu pedido antes de volver a crear otro ticket.',
    GENERIC_ERROR: 'Ocurrió un error. Por favor, inténtalo de nuevo más tarde.',
    TICKET_NOT_OWNER: '❌ No eres el propietario de este ticket.',
    TICKET_WRONG_STAGE: '❌ Este ticket no está en la etapa correcta para esta acción.',
    TICKET_NOT_FOUND_GENERIC: '❌ No pudimos encontrar este ticket.',
    TIMEZONE_SELECTED_CONFIRMATION: '✅ Tu zona horaria ha sido registrada.',
    ORDER_CANCELLED: '❌ Se ha detectado que el pedido ha sido cancelado o reembolsado.',
};
