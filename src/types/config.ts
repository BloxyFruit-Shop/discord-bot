export type ServerKey =
  | 'rivals'
  | 'anime-vanguards'
  | 'grow-a-garden'
  | 'blox-fruits'
  | 'bloxy-market'
  | 'pets-go'
  | 'king-legacy'
  | 'blue-lock'
  | 'steal-brainrot'
  | 'murder-mystery-2';

export interface ServerConfig {
  readonly name: ServerKey;
  readonly guild: string;
  readonly claim: string;
  readonly 'admin-role': string;
  readonly 'customer-role': string;
  readonly 'reviews-channel': string;
  readonly transcript: string;
}