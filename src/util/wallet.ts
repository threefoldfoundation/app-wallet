import {
  CoinInput,
  CoinInput0,
  CoinOutput,
  CoinOutput0,
  CoinOutput1,
  ExplorerBlock,
  ExplorerTransaction,
  ExplorerTransaction0,
  LOCKTIME_BLOCK_LIMIT,
  OutputCondition,
  OutputMapping,
  OutputType,
  ParsedTransaction,
  PendingTransaction,
  Transaction,
  Transaction0,
} from '../interfaces';

export function outputReducer(total: number, output: CoinOutput) {
  return total + parseInt(output.value);
}

export function getv0TransactionAmount(address: string, inputs: CoinOutput0[], outputs: CoinOutput0[]): number {
  const isReceiving = !inputs.some(input => input.unlockhash === address);
  const outputTotal = outputs.filter(output => output.unlockhash === address).reduce(outputReducer, 0);
  if (isReceiving) {
    return outputTotal;
  }
  return outputTotal - inputs.reduce(outputReducer, 0);
}

export function getMinerFee(minerfees: string[] | null): number {
  return (minerfees || []).reduce((total: number, fee: string) => total + parseInt(fee), 0);
}

export function isUnrecognizedHashError(err: string | null | undefined) {
  return err && err.indexOf('unrecognized hash') !== -1;
}

export function convertTransaction(transaction: ExplorerTransaction, address: string, latestBlock: ExplorerBlock, coinInputs: OutputMapping[]): ParsedTransaction {
  console.log('convertTransaction', transaction);
  const { locked, unlocked } = getTransactionAmount(transaction, latestBlock, address, coinInputs);
  console.log('convertTransaction2');
  return {
    ...transaction,
    receiving: (unlocked + locked) > 0,
    amount: unlocked + locked,
    lockedAmount: locked,
    minerfee: getMinerFee(transaction.rawtransaction.data.minerfees),
  };
}

export function convertPendingTransaction(transaction: Transaction, address: string, outputIds: string[]): PendingTransaction {
  transaction.data.coininputs = transaction.data.coininputs || [];
  let amount = 0;
  const receiving = !(<CoinInput[]>transaction.data.coininputs).some((input: CoinInput) => outputIds.indexOf(input.parentid) !== -1);
  if (isv0RawTransaction(transaction)) {
    if (transaction.data.coinoutputs) {
      if (receiving) {
        amount = transaction.data.coinoutputs.filter(o => o.unlockhash === address).reduce(outputReducer, 0);
      } else {
        amount = -transaction.data.coinoutputs.filter(o => o.unlockhash !== address).reduce(outputReducer, 0);
      }
    }
  } else if (transaction.data.coinoutputs) {
    if (receiving) {
      amount = transaction.data.coinoutputs.filter(o => filterReceivingOutputCondition(address, o.condition)).reduce(outputReducer, 0);
    } else {
      amount = -transaction.data.coinoutputs.filter(o => filterSendOutputCondition(address, o.condition)).reduce(outputReducer, 0);
    }
  }
  return {
    ...transaction,
    amount,
    minerfee: getMinerFee(transaction.data.minerfees),
    receiving,
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

export function isv0Output(output: CoinOutput): output is CoinOutput0 {
  return (<CoinOutput0>output).unlockhash !== undefined;
}

export function isv0Input(input: CoinInput): input is CoinInput0 {
  return (<CoinInput0>input).unlocker !== undefined;
}

export function filterTransactionsByAddress(address: string, transactions: Transaction[]) {
  return transactions.filter(t => {
    if (t.version === 0) {
      return (t.data.coinoutputs || []).some(o => o.unlockhash === address);
    }
    return (t.data.coinoutputs || []).some(output => filterOutputCondition(address, output.condition));
  });
}


export function getTransactionAmount(transaction: ExplorerTransaction, latestBlock: ExplorerBlock, address: string,
                                     allInputIds: OutputMapping[]) {
  let locked = 0;
  let unlocked = 0;
  const coinOutputs = <CoinOutput1[]> transaction.rawtransaction.data.coinoutputs || [];
  for (const input of (transaction.rawtransaction.data.coininputs || [])) {
    const spentInput = allInputIds.find(i => i.id === input.parentid);
    if (spentInput) {
      unlocked -= parseInt(spentInput.amount);
    }
  }
  if (isv0RawTransaction(transaction.rawtransaction)) {
    const outputs = <CoinOutput0[]>transaction.rawtransaction.data.coinoutputs || [];
    const amount = getv0TransactionAmount(address, <CoinOutput0[]>transaction.coininputoutputs || [], outputs);
    return {
      locked,
      unlocked: amount
    };
  }
  for (let i = 0; i < coinOutputs.length; i++) {
    const output = coinOutputs[i];
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
        if (output.condition.data.locktime < LOCKTIME_BLOCK_LIMIT && latestBlock.height >= output.condition.data.locktime || output.condition.data.locktime <= latestBlock.rawblock.timestamp) {
          unlocked += value;
        } else {
          locked += value;
        }
        break;
    }
  }
  return { locked, unlocked };
}

export function filterOutputCondition(address: string, condition: OutputCondition): boolean {
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

export function filterSendOutputCondition(address: string, condition: OutputCondition): boolean {
  switch (condition.type) {
    case OutputType.UNLOCKHASH:
      return condition.data.unlockhash !== address;
    case OutputType.ATOMIC_SWAP:
      return condition.data.sender === address;
    case OutputType.TIMELOCKED:
      return condition.data.condition.data.unlockhash === address;
    default:
      return false;
  }
}
