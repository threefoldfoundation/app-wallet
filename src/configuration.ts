import { KeyPair, PaymentProviderId, SupportedAlgorithms } from 'rogerthat-plugin';
import { KeyPairArbitraryData } from './interfaces';

export interface Provider {
  algorithm: SupportedAlgorithms;
  explorerUrls: string[];
  symbol: string;
  name: string;
  providerId: PaymentProviderId;
  addressLength: number;
  logoPath: string;
}

export interface WalletConfiguration {
  providers: Provider[];
  defaultProviderId: PaymentProviderId;
  production: boolean;
}

export const configuration: WalletConfiguration = require('./configuration.json');

const providers: { [ key: string ]: Provider } = {};
export const providerMapping = configuration.providers.reduce((acc, provider) => {
  acc[ provider.providerId ] = provider;
  return acc;
}, providers);

export const defaultProvider = providerMapping[ configuration.defaultProviderId ];

export function getProviderFromKeyPair(keyPair: KeyPair): Provider {
  if (keyPair.arbitrary_data) {
    const data: KeyPairArbitraryData = JSON.parse(keyPair.arbitrary_data);
    return getProviderById(data.provider_id);
  }
  return getProviderById(configuration.defaultProviderId);
}

export function getProviderById(providerId: PaymentProviderId | null): Provider {
  return providerId ? providerMapping[ providerId ] : defaultProvider;
}
