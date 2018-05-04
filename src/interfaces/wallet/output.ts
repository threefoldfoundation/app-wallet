export enum OutputType {
  NIL = 0,
  UNLOCKHASH = 1,
  ATOMIC_SWAP = 2,
  TIMELOCKED = 3,
}

export interface NilCondition {
  data: null;
  type: OutputType.NIL;
}

export interface UnlockHashCondition {
  data: {
    unlockhash: string;
  };
  type: OutputType.UNLOCKHASH;
}

export interface AtomicSwapCondition {
  data: {
    sender: string;
    receiver: string;
    hashedsecret: string;
    timelock: number;
  };
  type: OutputType.ATOMIC_SWAP;
}

export interface TimeLockedCondition {
  data: {
    /**
     * Unix timestamp if higher than 500 000 000, else block number
     */
    locktime: number;
    condition: UnlockHashCondition;
  };
  type: OutputType.TIMELOCKED;
}

export type OutputCondition =  NilCondition | UnlockHashCondition | AtomicSwapCondition | TimeLockedCondition;

export interface CoinOutput1 {
  condition: OutputCondition;
  value: string;
}
