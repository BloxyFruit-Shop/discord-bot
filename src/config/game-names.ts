import type { ServerKey } from '~/types/config.js';

export const gameNames: Record<ServerKey, string> = {
  rivals: 'Rivals',
  'blox-fruits': 'Blox Fruits',
  'bloxy-market': 'Blox Fruits Physicals',
  'grow-a-garden': 'Grow a Garden',
  'pets-go': 'Pets Go',
  'anime-vanguards': 'Anime Vanguards',
  'king-legacy': 'King Legacy',
  'blue-lock': 'Blue Lock: Rivals',
  'anime-adventures': 'Anime Adventures',
  'murder-mystery-2': 'Murder Mystery 2',
} as const;
