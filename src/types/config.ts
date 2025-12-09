export type ServerKey =
  | 'rivals'
  | 'anime-vanguards'
  | 'grow-a-garden'
  | 'blox-fruits'
  | 'bloxy-market'
  | 'the-forge'
  | 'king-legacy'
  | 'blue-lock'
  | 'steal-brainrot'
  | 'plants-vs-brainrot';

export interface ServerConfig {
  readonly name: ServerKey;
  readonly guild: string;
  readonly claim: string;
  readonly 'admin-role': string;
  readonly 'customer-role': string;
  readonly 'reviews-channel': string;
  readonly transcript: string;
}