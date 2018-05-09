export interface CoinInput0 {
  parentid: string;
  unlocker: {
    type: number;
    condition: {
      publickey: string;
    },
    fulfillment: {
      signature: string;
    }
  };
}

export interface CoinOutput0 {
  value: string;
  unlockhash: string;
}

export interface Transaction0 {
  data: {
    coininputs: null | CoinInput0[];
    coinoutputs: null | CoinOutput0[];
    blockstakeinputs?: null | CoinInput0[];
    blockstakeoutputs?: null | CoinOutput0[];
    minerfees: string[] | null;
    arbitrarydata?: string;
  };
  version: 0;
}
