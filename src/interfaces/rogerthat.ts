import { KeyPair, PaymentProviderId } from 'rogerthat-plugin';

export type UserData = Readonly<Partial<any>>;
export type ServiceData = Readonly<Partial<any>>;

export const enum ContextDataType {
  PAYMENT_REQUEST = 'payment-request',
}

export interface MessageContextData {
  type: ContextDataType.PAYMENT_REQUEST;
  data: PaymentRequestData;
}

export interface PaymentRequestData {
  to: string;
  amount: number;
  precision: number;
  currency: string;
  test_mode: boolean;
  memo: string;
}

export interface ChatPayResult {
  transaction_id: string;
}

export interface CreateKeyPair extends KeyPair {
  seed: string | null;
}

export interface KeyPairArbitraryData {
  provider_id: PaymentProviderId;
}
