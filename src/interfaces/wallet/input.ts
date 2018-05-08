export enum InputType {
  SINGLE_SIGNATURE = 1,
  ATOMIC_SWAP = 2,
}

export interface SingleSignatureFulfillment {
  data: {
    publickey: string;
    signature: string;
  };
  type: InputType.SINGLE_SIGNATURE;
}

export interface AtomicSwapFulfillment {
  data: {
    publickey: string;
    signature: string;
    secret: string;
  };
  type: InputType.ATOMIC_SWAP;
}

export type Fulfillment = SingleSignatureFulfillment | AtomicSwapFulfillment;

export interface CoinInput1 {
  fulfillment: Fulfillment;
  parentid: string;
}
