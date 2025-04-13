/**
 * Defines the structure for all translation keys used in the application.
 * Each language file must implement this interface.
 */
export interface TranslationSet {
  // Order Verification & General
  ORDER_VERIFICATION_CONTENT: string;
  ORDER_NOT_FOUND_TITLE: string;
  ORDER_NOT_FOUND_DESCRIPTION: string; // Note: Keep placeholders like {orderId}
  ORDER_FOUND_TITLE: string;
  ORDER_FOUND_CONTENT: string; // Note: Keep placeholders like {orderId}
  LANGUAGE_PROMPT: string;
  WELCOME_TITLE: string;
  WELCOME_DESCRIPTION: string;
  FIRST_STEP: string;
  FIRST_STEP_TEXT: string;
  WHERE_FIND_ID: string;
  WHERE_FIND_ID_TEXT: string;
  ORDER_VERIFICATION_TITLE: string;
  ORDER_VERIFICATION_DESCRIPTION: string;
  NEED_HELP: string;
  IMPORTANT: string;
  NEXT_STEPS: string;
  WHAT_TO_DO: string;
  JOIN_SERVER: string;
  
  // Timezone
  TIMEZONE_PROMPT_TITLE: string;
  TIMEZONE_PROMPT_CONTENT: string;
  TIMEZONE_RECORDED_TITLE: string;
  TIMEZONE_RECORDED_CONTENT: string; // Note: Keep placeholders like {timezone}
  TIMEZONE_TITLE: string;
  TIMEZONE_DESCRIPTION: string;
  TIMEZONE_LABEL: string;
  TIMEZONE_SELECTED_CONFIRMATION: string;

  // Ticket Summary
  SUMMARY_TITLE: string;
  ORDER_DETAILS: string;
  ROBLOX_USERNAME: string;
  ORDERED_ITEMS: string;

  // Specific Order Scenarios
  DIFFERENT_GAME_TITLE: string;
  DIFFERENT_GAME_CONTENT: string; // Note: Keep placeholders like {gameName}
  WRONG_GAME_TITLE: string;
  WRONG_GAME_DESCRIPTION: string; // Note: Keep placeholders like {orderId}, {game}
  WRONG_GAME_INSTRUCTIONS: string; // Note: Keep placeholders like {serverInvite}
  ORDER_CLAIMED_TITLE: string;
  ORDER_CLAIMED_DESCRIPTION: string; // Note: Keep placeholders like {orderId}
  CLAIMED_HELP_TEXT: string;
  CLAIMED_IMPORTANT_TEXT: string;
  PHYSICAL_FRUIT_TITLE: string;
  PHYSICAL_FRUIT_DESCRIPTION: string;
  PHYSICAL_FRUIT_INSTRUCTIONS: string;
  OTHER_ITEMS: string;
  ACCOUNT_ITEMS_TITLE: string;
  ACCOUNT_ITEMS_DESCRIPTION: string;
  NO_PHYSICAL_FRUIT_TITLE: string;
  NO_PHYSICAL_FRUIT_DESCRIPTION: string;
  MISSING_ROBLOX_ACCOUNT_TITLE: string;
  MISSING_ROBLOX_ACCOUNT_DESCRIPTION: string;

  // Ticket Management
  TICKET_NOT_OWNER: string;
  TICKET_WRONG_STAGE: string;
  TICKET_EXISTS_TITLE: string;
  TICKET_EXISTS_DESCRIPTION: string; // Note: Keep placeholders like {orderId}
  EXISTING_TICKET_CHANNEL: string;
  EXISTING_TICKET_LINK: string; // Note: Keep placeholders like {channelId}
  COMPLETION_MESSAGE_TITLE: string;
  COMPLETION_MESSAGE_DESCRIPTION: string;
  LEAVE_REVIEW: string;
  LEAVE_REVIEW_CHANNEL: string; // Note: Keep placeholders like {reviewsChannel}
  TRUSTPILOT: string;
  TRUSTPILOT_LINK: string;

  // Generic
  GENERIC_ERROR: string;
  TICKET_NOT_FOUND_GENERIC: string;
}
