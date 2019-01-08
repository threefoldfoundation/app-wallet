import {
  CoinInput0,
  CoinInput1,
  CoinOutput0,
  CoinOutput1,
  CreateTransactionType,
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
  TransactionVersion,
} from '../interfaces';

export function getFee(transaction: Transaction): number {
  switch (transaction.version) {
    case TransactionVersion.ZERO:
    case TransactionVersion.ONE:
      return (transaction.data.minerfees || []).reduce((total: number, fee: string) => total + parseInt(fee), 0);
    case TransactionVersion.ERC20Conversion:
    case TransactionVersion.ERC20CoinCreation:
      return parseInt(transaction.data.txfee);
    case TransactionVersion.ERC20AddressRegistration:
      return parseInt(transaction.data.txfee) + parseInt(transaction.data.regfee);
  }
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
    fee: getFee(transaction.rawtransaction),
  };
}

export function convertToV1RawTransaction(transaction: Transaction0 | Transaction1): Transaction1 {
  if (isv0RawTransaction(transaction)) {
    return {
      version: TransactionVersion.ONE,
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
      rawtransaction: convertToV1RawTransaction(transaction.rawtransaction) as Transaction1,
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

export function convertPendingTransaction(transaction: CreateTransactionType, address: string, latestBlock: ExplorerBlock,
                                          coinInputs: OutputMapping[]): PendingTransaction {
  const { locked, unlocked } = getTransactionAmount(transaction, latestBlock, address, coinInputs);
  return {
    receiving: (unlocked + locked) > 0,
    amount: unlocked + locked,
    lockedAmount: locked,
    transaction: transaction,
    fee: getFee(transaction),
  };
}

export function getInputIds(transactions: ExplorerTransaction[], unlockhash: string, latestBlock: ExplorerBlock) {
  const allCoinOutputs: OutputMapping[] = [];
  let spentOutputs: OutputMapping[] = [];
  for (const t of transactions) {
    const coinOutputIds: string[] = t.coinoutputids || [];
    if (t.rawtransaction.version === TransactionVersion.ZERO || t.rawtransaction.version === TransactionVersion.ONE) {
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
    } else if (t.rawtransaction.version === TransactionVersion.ERC20Conversion || t.rawtransaction.version === TransactionVersion.ERC20AddressRegistration) {
      console.assert(t.coinoutputids!.length === 1, 'Expected t.coinoutputids to only contain one element');
      if (t.rawtransaction.data.refundcoinoutput && t.coinoutputids) {
        allCoinOutputs.push({ id: t.coinoutputids[0], amount: t.rawtransaction.data.refundcoinoutput.value });
      }
    } else if (t.rawtransaction.version === TransactionVersion.ERC20CoinCreation) {
      if (t.coinoutputids) {
        allCoinOutputs.push({ id: t.coinoutputids[0], amount: t.rawtransaction.data.value });
      } else {
        throw Error(`No coinoutputids for ERC20CoinCreation transaction ${JSON.stringify(t)}`);
      }
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
    // Filter out only transaction type that cannot have coininputs
    if (transaction.rawtransaction.version !== TransactionVersion.ERC20CoinCreation) {
      for (const input of transaction.rawtransaction.data.coininputs || []) {
        if (input.parentid === outputId) {
          spentOutputs.push({ id: outputId, amount: outputValue });
        }
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
  return transaction.version === TransactionVersion.ZERO;
}

export function filterTransactionsByAddress(address: string, transaction: Transaction) {
  switch (transaction.version) {
    case TransactionVersion.ZERO:
      return (transaction.data.coinoutputs || []).some(o => o.unlockhash === address);
    case TransactionVersion.ONE:
      return (transaction.data.coinoutputs || []).some(output => filterSendOutputCondition(address, output.condition));
    case TransactionVersion.ERC20Conversion:
    case TransactionVersion.ERC20AddressRegistration:
      return transaction.data.refundcoinoutput && filterSendOutputCondition(address, transaction.data.refundcoinoutput.condition);
    case TransactionVersion.ERC20CoinCreation:
      return transaction.data.address === address;
  }
  return false;
}


export function getTransactionAmount(transaction: Transaction, latestBlock: ExplorerBlock, address: string,
                                     allInputIds: OutputMapping[]) {
  let locked = 0;
  let unlocked = 0;
  if (transaction.version === TransactionVersion.ONE || transaction.version === TransactionVersion.ERC20Conversion) {
    for (const input of (transaction.data.coininputs || [])) {
      const spentInput = allInputIds.find(i => i.id === input.parentid);
      if (spentInput) {
        unlocked -= parseInt(spentInput.amount);
      }
    }
  }
  if (transaction.version === TransactionVersion.ONE) {
    const coinOutputs = <CoinOutput1[]>transaction.data.coinoutputs || [];
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
  }
  if (transaction.version === TransactionVersion.ERC20CoinCreation) {
    unlocked = parseInt(transaction.data.value);
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

export function getNewTransactionOtherOutputs(transaction: CreateTransactionType, ownAddress: string): CoinOutput1[] {
  let outputs: CoinOutput1[] = [];
  if (transaction.version === TransactionVersion.ONE && transaction.data.coinoutputs) {
    outputs = transaction.data.coinoutputs;
  } else if (transaction.version === TransactionVersion.ERC20AddressRegistration && transaction.data.refundcoinoutput) {
    outputs = [transaction.data.refundcoinoutput];
  }
  return outputs.filter(output => {
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

export function calculateNewTransactionAmount(transaction: CreateTransactionType, ownAddress: string): number {
  switch (transaction.version) {
    case TransactionVersion.ONE:
      return getNewTransactionOtherOutputs(transaction, ownAddress).reduce((acc, output) => acc + parseInt(output.value), 0);
    case TransactionVersion.ERC20AddressRegistration:
      return 0;
    case TransactionVersion.ERC20Conversion:
      return parseInt(transaction.data.value);
  }
}
