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
  InputMapping,
  InputType,
  LOCKTIME_BLOCK_LIMIT,
  OutputCondition,
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
                                   coinInputs: InputMapping[]): ParsedTransaction {
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
      coinoutputunlockhashes: transaction.coinoutputunlockhashes,
      blockstakeinputoutputs: (transaction.blockstakeinputoutputs || []).map(i => convertToV1Output(i)),
      blockstakeoutputids: transaction.blockstakeoutputids,
      blockstackeunlockhashes: transaction.blockstackeunlockhashes,
      rawtransaction: convertToV1RawTransaction(transaction.rawtransaction) as Transaction1,
      unconfirmed: transaction.unconfirmed,
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
                                          coinInputs: InputMapping[]): PendingTransaction {
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
  const allCoinInputs: InputMapping[] = [];
  const outputIds: string[] = [];
  for (const t of transactions) {
    if (t.coinoutputids) {
      switch (t.rawtransaction.version) {
        case TransactionVersion.ZERO:
          if (t.rawtransaction.data.coinoutputs) {
            for (let i = 0; i < t.coinoutputids.length; i++) {
              const outputId = t.coinoutputids[i];
              const coinOutput = t.rawtransaction.data.coinoutputs[i];
              if (coinOutput.unlockhash === unlockhash) {
                allCoinInputs.push({ id: outputId, amount: coinOutput.value });
              }
              outputIds.push(outputId);
            }
          }
          break;
        case TransactionVersion.ONE:
          if (t.rawtransaction.data.coinoutputs) {
            for (let i = 0; i < t.coinoutputids.length; i++) {
              const outputId = t.coinoutputids[i];
              const coinOutput = t.rawtransaction.data.coinoutputs[i];
              if (filterReceivingOutputCondition(unlockhash, coinOutput.condition, latestBlock)) {
                allCoinInputs.push({ id: outputId, amount: coinOutput.value });
              }
              outputIds.push(outputId);
            }
          }
          break;
        case TransactionVersion.ERC20Conversion:
          // Should always only be one output id for the refund address, if null it will have been filtered out above
          const outputId = t.coinoutputids[0];
          const coinOutput = <CoinOutput1>t.rawtransaction.data.refundcoinoutput;
          if (filterReceivingOutputCondition(unlockhash, coinOutput.condition, latestBlock)) {
            allCoinInputs.push({ id: outputId, amount: coinOutput.value });
          }
          outputIds.push(outputId);
          break;
        case TransactionVersion.ERC20CoinCreation:
          if (t.rawtransaction.data.address === unlockhash) {
            for (const outputId of t.coinoutputids) {
              const value = t.rawtransaction.data.value;
              allCoinInputs.push({ id: outputId, amount: value });
              outputIds.push(outputId);
            }
          }
          break;
        case TransactionVersion.ERC20AddressRegistration:
          const output = t.rawtransaction.data.refundcoinoutput;
          if (output && filterReceivingOutputCondition(unlockhash, output.condition, latestBlock)) {
            const outputId = t.coinoutputids[0]; // will always have one element since there can only be one refund address
            allCoinInputs.push({ id: outputId, amount: output.value });
            outputIds.push(outputId);
          }
          break;
      }
    }
  }
  const spentInputIds = getSpentInputs(outputIds, transactions);
  return {
    all: allCoinInputs,
    available: allCoinInputs.filter(output => !spentInputIds.includes(output.id)),
  };
}

export function getSpentInputs(outputIds: string[], transactions: ExplorerTransaction[]): string[] {
  const spentIds: string[] = [];
  for (const transaction of transactions) {
    // Filter out only transaction type that cannot have coininputs
    if (transaction.rawtransaction.version !== TransactionVersion.ERC20CoinCreation && transaction.rawtransaction.data.coininputs) {
      for (const input of transaction.rawtransaction.data.coininputs) {
        if (outputIds.includes(input.parentid)) {
          spentIds.push(input.parentid);
        }
      }
    }
  }
  return spentIds;
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

export function getTransactionAmount(transaction: Transaction, latestBlock: ExplorerBlock, address: string,
                                     allInputIds: InputMapping[]) {
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
  if (transaction.version === TransactionVersion.ERC20Conversion && transaction.data.refundcoinoutput) {
    unlocked += parseInt(transaction.data.refundcoinoutput.value);
  }
  return { locked, unlocked };
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
