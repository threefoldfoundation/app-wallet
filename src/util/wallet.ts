import { RivineOutput } from '../interfaces';

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

export function isUnrecognizedHashError(err: string | null | undefined) {
  return err && err.indexOf('unrecognized hash') !== -1;
}
