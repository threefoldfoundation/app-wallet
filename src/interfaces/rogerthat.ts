import { KeyPair, PaymentProviderId } from 'rogerthat-plugin';

export type UserData = Readonly<Partial<any>>;
export type ServiceData = Readonly<Partial<any>>;

export const enum PaymentQRCodeType {
  TRANSACTION = 1,
  PAY = 2
}

export interface CreateKeyPair extends KeyPair {
  seed: string | null;
}

export interface KeyPairArbitraryData {
  provider_id: PaymentProviderId;
}
