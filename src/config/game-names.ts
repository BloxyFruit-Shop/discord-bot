import type { ServerKey } from '~/types/config.js';

export const gameNames: Record<ServerKey, string> = {
  rivals: 'Rivals',
  'blox-fruits': 'Blox Fruits',
  'bloxy-market': 'Blox Fruits Physicals',
  'grow-a-garden': 'Grow a Garden',
  'the-forge': 'The Forge',
  'anime-vanguards': 'Anime Vanguards',
  'king-legacy': 'King Legacy',
  'blue-lock': 'Blue Lock: Rivals',
  'steal-brainrot': 'Steal a Brainrot',
  'plants-vs-brainrot': 'Plants vs Brainrot',
} as const;
