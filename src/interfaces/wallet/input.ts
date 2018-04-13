export enum InputType {
  NIL = 0,
  SINGLE_SIGNATURE = 1,
  ATOMIC_SWAP = 2,
  TIMELOCKED = 3,
  SORTED_SET = 4
}

export interface NilFulFillment {
  data: null;
  type: InputType.NIL;
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

export interface TimeLockedFulfillment {
  type: InputType.TIMELOCKED;
}

export type SortedSetFulfillmentTypes =
  NilFulFillment
  | SingleSignatureFulfillment
  | AtomicSwapFulfillment
  | TimeLockedFulfillment;

export interface SortedSetFulfillment {
  data: {
    fulfillments: SortedSetFulfillmentTypes[];
  };
  type: InputType.SORTED_SET;
}

export type FulFillment = SortedSetFulfillmentTypes | SortedSetFulfillment;

export interface CoinInput1 {
  fulfillment: FulFillment;
  parentid: string;
}
