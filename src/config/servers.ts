import type { ServerKey, ServerConfig } from '~/types/config.js';
import 'dotenv/config';

const prodServers: Record<ServerKey, ServerConfig> = {
  rivals: {
    name: 'rivals',
    guild: '1307806087029719150',
    claim: '1307810129772675183',
    'admin-role': '1307807245647614052',
    'customer-role': '1307825472817594419',
    'reviews-channel': '1307810413609746503',
    transcript: '1353454160955179069',
  },
  'anime-vanguards': {
    name: 'anime-vanguards',
    guild: '1307849927606534278',
    claim: '1307851786413146244',
    'admin-role': '1307869392708702289',
    'customer-role': '1307869068925337610',
    'reviews-channel': '1307851882714107976',
    transcript: '1353435146799288320',
  },
  'grow-a-garden': {
    name: 'grow-a-garden',
    guild: '1308118667644506254',
    claim: '1308118668030251051',
    'admin-role': '1308118667644506263',
    'customer-role': '1308118667644506257',
    'reviews-channel': '1308118668030251052',
    transcript: '1371972742592725013',
  },
  'blox-fruits': {
    name: 'blox-fruits',
    guild: '1227899053858099211',
    claim: '1308870249529217044',
    'admin-role': '1228459695094890518',
    'customer-role': '1227908406078210100',
    'reviews-channel': '1249618905257873479',
    transcript: '1353587263963005071',
  },
  'bloxy-market': {
    name: 'bloxy-market',
    guild: '1244326151673872455',
    claim: '1308872951763963995',
    'admin-role': '1244337505566724246',
    'customer-role': '1244339233574096916',
    'reviews-channel': '1244336701652865055',
    transcript: '1353454547972128838',
  },
  'pets-go': {
    name: 'pets-go',
    guild: '1307808175587725322',
    claim: '1307818267716620348',
    'admin-role': '1307820453183623239',
    'customer-role': '1308895158586179595',
    'reviews-channel': '1307818339938336768',
    transcript: '1353435279473639515',
  },
  'king-legacy': {
    name: 'king-legacy',
    guild: '1310312947452477592',
    claim: '1310312947851071582',
    'admin-role': '1310312947452477601',
    'customer-role': '1310312947452477595',
    'reviews-channel': '1310312947851071583',
    transcript: '1353434566894813304',
  },
  'blue-lock': {
    name: 'blue-lock',
    guild: '1352842425143398450',
    claim: '1352847241949220984',
    'admin-role': '1354271822266372126',
    'customer-role': '1352856151154491432',
    'reviews-channel': '1352847268725919827',
    transcript: '1353434501669326949',
  },
  'anime-adventures': {
    name: 'anime-adventures',
    guild: '1352842797685932032',
    claim: '1352848080675930203',
    'admin-role': '1354272322877657341',
    'customer-role': '1352854037745111142',
    'reviews-channel': '1352848172640108545',
    transcript: '1353433987686600724',
  },
  'murder-mystery-2': {
    name: 'murder-mystery-2',
    guild: '1352855572600459304',
    claim: '1353083592678309908',
    'admin-role': '1354272089112055990',
    'customer-role': '1353085882890059816',
    'reviews-channel': '1353083614124048526',
    transcript: '1353434087406305290',
  },
} as const;


const devServers = {
  rivals: {
    name: 'rivals',
    guild: '1350533330327830588',
    claim: '1350533485512753307',
    'admin-role': '1350533529028661371',
    'customer-role': '1350533583130988574',
    'reviews-channel': '1350533807035514941',
    transcript: '1350576550084349962'
  },
  'anime-vanguards': {
    name: 'anime-vanguards',
    guild: '1350533330327830588',
    claim: '1350533485512753307',
    'admin-role': '1350533529028661371',
    'customer-role': '1350533583130988574',
    'reviews-channel': '1350533807035514941',
    transcript: '1350576550084349962'
  },
  'blox-fruits': {
    name: 'blox-fruits',
    guild: '1350533330327830588',
    claim: '1350533485512753307',
    'admin-role': '1350533529028661371',
    'customer-role': '1350533583130988574',
    'reviews-channel': '1350533807035514941',
    transcript: '1350576550084349962'
  },
  'bloxy-market': {
    name: 'bloxy-market',
    guild: '1350533330327830588',
    claim: '1350533485512753307',
    'admin-role': '1350533529028661371',
    'customer-role': '1350533583130988574',
    'reviews-channel': '1350533807035514941',
    transcript: '1350576550084349962'
  },
  'pets-go': {
    name: 'pets-go',
    guild: '1350533330327830588',
    claim: '1350533485512753307',
    'admin-role': '1350533529028661371',
    'customer-role': '1350533583130988574',
    'reviews-channel': '1350533807035514941',
    transcript: '1350576550084349962'
  },
  'king-legacy': {
    name: 'king-legacy',
    guild: '1350533330327830588',
    claim: '1350533485512753307',
    'admin-role': '1350533529028661371',
    'customer-role': '1350533583130988574',
    'reviews-channel': '1350533807035514941',
    transcript: '1350576550084349962'
  },
  'blue-lock': {
    name: 'blue-lock',
    guild: '1350533330327830588',
    claim: '1350533485512753307',
    'admin-role': '1350533529028661371',
    'customer-role': '1350533583130988574',
    'reviews-channel': '1350533807035514941',
    transcript: '1350576550084349962'
  },
  'anime-adventures': {
    name: 'anime-adventures',
    guild: '1350533330327830588',
    claim: '1350533485512753307',
    'admin-role': '1350533529028661371',
    'customer-role': '1350533583130988574',
    'reviews-channel': '1350533807035514941',
    transcript: '1350576550084349962'
  },
  'murder-mystery-2': {
    name: 'murder-mystery-2',
    guild: '1350533330327830588',
    claim: '1350533485512753307',
    'admin-role': '1350533529028661371',
    'customer-role': '1350533583130988574',
    'reviews-channel': '1350533807035514941',
    transcript: '1350576550084349962'
  },
  'grow-a-garden': {
    name: 'grow-a-garden',
    guild: '1350533330327830588',
    claim: '1350533485512753307',
    'admin-role': '1350533529028661371',
    'customer-role': '1350533583130988574',
    'reviews-channel': '1350533807035514941',
    transcript: '1350576550084349962'
  }
} as const;

const isDevelopment = process.env.NODE_ENV === 'development';
console.log(`[Config] Running in ${isDevelopment ? 'development' : 'production'} mode.`);

export const servers = isDevelopment ? devServers : prodServers;