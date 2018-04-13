export enum OutputType {
  NIL = 0,
  UNLOCKHASH = 1,
  ATOMIC_SWAP = 2,
  TIMELOCKED = 3,
  SORTED_SET = 4
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
  data?: {
    timelock: number;
  };
  type: OutputType.TIMELOCKED;
}

export type SortedSetConditionTypes = NilCondition | UnlockHashCondition | AtomicSwapCondition | TimeLockedCondition;

export interface SortedSetCondition {
  data: {
    conditions: SortedSetConditionTypes[];
  };
  type: OutputType.SORTED_SET;
}

export type OutputCondition = SortedSetConditionTypes | SortedSetCondition;

export interface CoinOutput1 {
  condition: OutputCondition;
  value: string;
}
