import {
  ParsedTransaction,
  PendingTransaction,
  RivineOutput,
  RivineRawTransaction,
  RivineTransaction,
} from '../interfaces';

export function outputReducer(total: number, output: RivineOutput) {
  return total + parseInt(output.value);
}

export function getTransactionAmount(address: string, inputs: RivineOutput[ ], outputs: RivineOutput[]): number {
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

export function convertTransaction(transaction: RivineTransaction, address: string): ParsedTransaction {
  transaction.coininputoutputs = transaction.coininputoutputs || [];
  transaction.rawtransaction.data.coinoutputs = transaction.rawtransaction.data.coinoutputs || [];
  // todo amount will be incorrect for incoming transactions
  const amount = getTransactionAmount(address, transaction.coininputoutputs, transaction.rawtransaction.data.coinoutputs);
  return {
    id: transaction.id,
    inputs: transaction.coininputoutputs,
    outputs: transaction.rawtransaction.data.coinoutputs,
    height: transaction.height,
    receiving: amount > 0,
    amount,
    minerfee: getMinerFee(transaction.rawtransaction.data.minerfees),
  };
}

export function convertPendingTransaction(transaction: RivineRawTransaction, address: string): PendingTransaction {
  transaction.data.coinoutputs = transaction.data.coinoutputs || [];
  transaction.data.coininputs = transaction.data.coininputs || [];
  const amount = getTransactionAmount(address, transaction.data.coinoutputs, transaction.data.coinoutputs);
  return {
    amount,
    minerfee: getMinerFee(transaction.data.minerfees),
    inputs: transaction.data.coininputs,
    outputs: transaction.data.coinoutputs,
    receiving: amount > 0,
  }
}

export function getOutputIds(transactions: RivineTransaction[], unlockhash: string): { id: string, amount: string }[] {
  const allCoinOutputs: { id: string, amount: string }[] = [];
  const spentOutputs: { output_id: string, amount: string }[] = [];
  for (const t of transactions) {
    const coinOutputIds: string[] = t.coinoutputids || [];
    const coinOutputs = t.rawtransaction.data.coinoutputs || [];
    for (let i = 0; i < coinOutputIds.length; i++) {
      const outputId = coinOutputIds[i];
      const coinOutput = coinOutputs[i];
      if (coinOutput.unlockhash === unlockhash) {
        allCoinOutputs.push({id: outputId, amount: coinOutput.value});
        for (const transaction of transactions) {
          for (const input of transaction.rawtransaction.data.coininputs || []) {
            if (input.parentid === outputId) {
              spentOutputs.push({output_id: outputId, amount: coinOutput.value});
            }
          }
        }
      }
    }
  }
  return allCoinOutputs.filter(output => !spentOutputs.some(o => o.output_id === output.id));
}

export function isPendingTransaction(trans: PendingTransaction | ParsedTransaction): trans is PendingTransaction {
  return (<ParsedTransaction>trans).id === undefined;
}
