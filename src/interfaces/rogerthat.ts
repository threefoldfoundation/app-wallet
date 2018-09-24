import { KeyPair, PaymentProviderId } from 'rogerthat-plugin';

export type UserData = Readonly<Partial<any>>;
export type ServiceData = Readonly<Partial<any>>;

export interface ChatPayResult {
  transaction_id: string;
}

export interface CreateKeyPair extends KeyPair {
  seed: string | null;
}

export interface KeyPairArbitraryData {
  provider_id: PaymentProviderId;
}
