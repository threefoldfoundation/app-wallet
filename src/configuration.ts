import { PaymentProviderId } from 'rogerthat-plugin';

export interface WalletConfiguration {
  explorer_urls: string[];
  currency_symbol: string;
  key_name: string;
  provider_id: PaymentProviderId;
}

export const configuration: WalletConfiguration = require('./configuration.json');

