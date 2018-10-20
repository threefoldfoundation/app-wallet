import {
  CoinInput0,
  CoinInput1,
  CoinOutput0,
  CoinOutput1,
  ExplorerBlock,
  ExplorerTransaction,
  ExplorerTransaction0,
  ExplorerTransaction1,
  InputType,
  LOCKTIME_BLOCK_LIMIT,
  OutputCondition,
  OutputMapping,
  OutputType,
  ParsedTransaction,
  PendingTransaction,
  Transaction,
  Transaction0,
  Transaction1,
} from '../interfaces';

export function getMinerFee(minerfees: string[] | null): number {
  return (minerfees || []).reduce((total: number, fee: string) => total + parseInt(fee), 0);
}

export function isUnrecognizedHashError(err: string | null | undefined): boolean {
  return (!!err) && err.indexOf('unrecognized hash') !== -1;
}

export function convertTransaction(transaction: ExplorerTransaction1, address: string, latestBlock: ExplorerBlock,
                                   coinInputs: OutputMapping[]): ParsedTransaction {
  const { locked, unlocked } = getTransactionAmount(transaction.rawtransaction, latestBlock, address, coinInputs);
  return {
    ...transaction,
    receiving: (unlocked + locked) > 0,
    amount: unlocked + locked,
    lockedAmount: locked,
    minerfee: getMinerFee(transaction.rawtransaction.data.minerfees),
  };
}

export function convertToV1RawTransaction(transaction: Transaction): Transaction1 {
  if (isv0RawTransaction(transaction)) {
    return {
      version: 1,
      data: {
        coininputs: (transaction.data.coininputs || []).map(input => convertToV1Input(input)),
        coinoutputs: (transaction.data.coinoutputs || []).map(output => convertToV1Output(output)),
        arbitrarydata: transaction.data.arbitrarydata,
        blockstakeinputs: (transaction.data.blockstakeinputs || []).map(input => convertToV1Input(input)),
        blockstakeoutputs: (transaction.data.blockstakeoutputs || []).map(output => convertToV1Output(output)),
        minerfees: transaction.data.minerfees,
      }
    };
  }
  return transaction;
}

export function convertToV1Transaction(transaction: ExplorerTransaction): ExplorerTransaction1 {
  if (isv0Transaction(transaction)) {
    return {
      id: transaction.id,
      height: transaction.height,
      parent: transaction.parent,
      coinoutputids: transaction.coinoutputids,
      coininputoutputs: (transaction.coininputoutputs || []).map(i => (convertToV1Output(i))),
      blockstakeinputoutputs: (transaction.blockstakeinputoutputs || []).map(i => convertToV1Output(i)),
      blockstakeoutputids: transaction.blockstakeoutputids,
      rawtransaction: convertToV1RawTransaction(transaction.rawtransaction),
    };
  }
  return transaction;
}

export function convertToV1Output(output: CoinOutput0): CoinOutput1 {
  return {
    value: output.value,
    condition: {
      type: OutputType.UNLOCKHASH,
      data: {
        unlockhash: output.unlockhash
      }
    }
  };
}

export function convertToV1Input(input: CoinInput0): CoinInput1 {
  return {
    parentid: input.parentid,
    fulfillment: {
      type: InputType.SINGLE_SIGNATURE,
      data: {
        publickey: input.unlocker.condition.publickey,
        signature: input.unlocker.fulfillment.signature,
      }
    }
  };
}

export function convertPendingTransaction(transaction: Transaction1, address: string, latestBlock: ExplorerBlock,
                                          coinInputs: OutputMapping[]): PendingTransaction {
  const { locked, unlocked } = getTransactionAmount(transaction, latestBlock, address, coinInputs);
  return {
    ...transaction,
    receiving: (unlocked + locked) > 0,
    amount: unlocked + locked,
    lockedAmount: locked,
    minerfee: getMinerFee(transaction.data.minerfees),
  };
}

export function getInputIds(transactions: ExplorerTransaction[], unlockhash: string, latestBlock: ExplorerBlock) {
  const allCoinOutputs: OutputMapping[] = [];
  let spentOutputs: OutputMapping[] = [];
  for (const t of transactions) {
    const coinOutputIds: string[] = t.coinoutputids || [];
    const coinOutputs = t.rawtransaction.data.coinoutputs || [];
    const isv0 = isv0RawTransaction(t.rawtransaction);
    for (let i = 0; i < coinOutputIds.length; i++) {
      const outputId = coinOutputIds[i];
      let coinOutput;
      if (isv0) {
        coinOutput = <CoinOutput0>coinOutputs[i];
        if (coinOutput.unlockhash === unlockhash) {
          allCoinOutputs.push({ id: outputId, amount: coinOutput.value });
        }
      } else {
        coinOutput = <CoinOutput1>coinOutputs[i];
        if (filterReceivingOutputCondition(unlockhash, coinOutput.condition, latestBlock)) {
          allCoinOutputs.push({ id: outputId, amount: coinOutput.value });
        }
      }
      spentOutputs = [...spentOutputs, ...getSpentOutputs(outputId, coinOutput.value, transactions)];
    }
  }
  return {
    all: allCoinOutputs,
    available: allCoinOutputs.filter(output => !spentOutputs.some(o => o.id === output.id)),
  };
}

export function getSpentOutputs(outputId: string, outputValue: string, transactions: ExplorerTransaction[]): OutputMapping[] {
  const spentOutputs = [];
  for (const transaction of transactions) {
    for (const input of transaction.rawtransaction.data.coininputs || []) {
      if (input.parentid === outputId) {
        spentOutputs.push({ id: outputId, amount: outputValue });
      }
    }
  }
  return spentOutputs;
}

export function isPendingTransaction(trans: PendingTransaction | ParsedTransaction): trans is PendingTransaction {
  return (<ParsedTransaction>trans).id === undefined;
}

export function isv0Transaction(transaction: ExplorerTransaction): transaction is ExplorerTransaction0 {
  return isv0RawTransaction(transaction.rawtransaction);
}

export function isv0RawTransaction(transaction: Transaction): transaction is Transaction0 {
  return transaction.version === 0;
}

export function filterTransactionsByAddress(address: string, transaction: Transaction) {
  if (transaction.version === 0) {
    return (transaction.data.coinoutputs || []).some(o => o.unlockhash === address);
    }
  return (transaction.data.coinoutputs || []).some(output => filterSendOutputCondition(address, output.condition));
}


export function getTransactionAmount(transaction: Transaction1, latestBlock: ExplorerBlock, address: string,
                                     allInputIds: OutputMapping[]) {
  let locked = 0;
  let unlocked = 0;
  for (const input of (transaction.data.coininputs || [])) {
    const spentInput = allInputIds.find(i => i.id === input.parentid);
    if (spentInput) {
      unlocked -= parseInt(spentInput.amount);
    }
  }
  const coinOutputs = <CoinOutput1[]> transaction.data.coinoutputs || [];
  for (const output of coinOutputs) {
    const value = parseInt(output.value);
    switch (output.condition.type) {
      case OutputType.UNLOCKHASH:
        if (output.condition.data.unlockhash === address) {
          unlocked += value;
        }
        break;
      case OutputType.TIMELOCKED:
        if (output.condition.data.condition.data.unlockhash !== address) {
          continue;
        }
        if (output.condition.data.locktime < LOCKTIME_BLOCK_LIMIT) {
          if (latestBlock.height >= output.condition.data.locktime) {
            unlocked += value;
          } else {
            locked += value;
          }
        } else {
          if (output.condition.data.locktime <= latestBlock.rawblock.timestamp) {
            unlocked += value;
          } else {
            locked += value;
          }
        }
        break;
    }
  }
  return { locked, unlocked };
}

export function filterSendOutputCondition(address: string, condition: OutputCondition): boolean {
  switch (condition.type) {
    case OutputType.UNLOCKHASH:
      return condition.data.unlockhash === address;
    case OutputType.ATOMIC_SWAP:
      return condition.data.sender === address || condition.data.receiver === address;
    case OutputType.TIMELOCKED:
      return condition.data.condition.data.unlockhash === address;
    default:
      return false;
  }
}

export function filterReceivingOutputCondition(address: string, condition: OutputCondition, latestBlock?: ExplorerBlock): boolean {
  switch (condition.type) {
    case OutputType.UNLOCKHASH:
      return condition.data.unlockhash === address;
    case OutputType.ATOMIC_SWAP:
      return false;
    case OutputType.TIMELOCKED:
      if (condition.data.condition.data.unlockhash !== address) {
        return false;
      }
      if (latestBlock) {
        if (condition.data.locktime < LOCKTIME_BLOCK_LIMIT) {
          // Lock time is a block height here, compare with that.
          return latestBlock.height >= condition.data.locktime;
        }
        return latestBlock.rawblock.timestamp >= condition.data.locktime;
      }
      return true;
    default:
      return false;
  }
}

export function getNewTransactionOtherOutputs(transaction: Transaction1, ownAddress: string): CoinOutput1[] {
  return (transaction.data.coinoutputs || []).filter(output => {
    switch (output.condition.type) {
      case OutputType.UNLOCKHASH:
        return output.condition.data.unlockhash !== ownAddress;
      case OutputType.ATOMIC_SWAP:
        return output.condition.data.receiver !== ownAddress;
      case OutputType.TIMELOCKED:
        return output.condition.data.condition.data.unlockhash !== ownAddress;
    }
    return false;
  });
}

export function calculateNewTransactionAmount(transaction: Transaction1, ownAddress: string) {
  return getNewTransactionOtherOutputs(transaction, ownAddress).reduce((acc, output) => acc + parseInt(output.value), 0);
}
