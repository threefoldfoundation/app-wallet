import { SupportedAlgorithms } from 'rogerthat-plugin';
import { configuration } from '../../configuration';
import { CoinInput1 } from './input';
import { CoinOutput1 } from './output';
import { CoinInput0, CoinOutput0, Transaction0 } from './transactions-v1';

export interface CreateSignatureData {
  amount: number;
  precision: number;
  from_address: string;
  to_address: string;
}

export interface GetAddressPayload {
  algorithm: SupportedAlgorithms;
  keyName: string;
  index: number;
  message: string;
}

export interface CreateTransactionResult {
  transactionid: string;
}

export type CoinInput = CoinInput0 | CoinInput1;
export type CoinOutput = CoinOutput0 | CoinOutput1;

export interface Block {
  minerpayouts: null | CoinOutput[];
  parentid: string;
  timestamp: number;
  pobsindexes: {
    BlockHeight: number;
    OutputIndex: number;
    TransactionIndex: number;
  };
  transactions: null | Transaction[];
}

export interface BlockFacts {
  arbitrarydatacount: number;
  arbitrarydatatotalsize: number;
  blockid: string;
  blockstakeinputcount: number;
  blockstakeoutputcount: number;
  coininputcount: number;
  coinoutputcount: number;
  difficulty: string;
  estimatedactivebs: string;
  height: number;
  /**
   * Timestamp of the block which matured due to the creation of this block. Usually current block height - 720
   */
  maturitytimestamp: number;
  minerfeecount: number;
  minerpayoutcount: number;
  target: number[];
  totalcoins: string;
  transactioncount: number;
}

export interface ExplorerBlock extends BlockFacts {
  minerpayoutids: null | string[];
  rawblock: Block;
  transactions: null | ExplorerTransaction[];
}

export interface CreateTransaction {
  data: {
    coininputs: CoinInput0[];
    coinoutputs: CoinOutput0[];
    blockstakeinputs: null | CoinInput0[];
    blockstakeoutputs: null | CoinOutput0[];
    minerfees: string[];
    arbitrarydata: null | string[];
  };
  version: 0;
}

export interface ExplorerBlockGET {
  block: ExplorerBlock;
}

export interface Transaction1 {
  data: {
    arbitrarydata?: string;
    blockstakeinputs?: CoinInput1[] | null;
    blockstakeoutputs?: CoinOutput1[] | null;
    coininputs: CoinInput1[] | null;
    coinoutputs: CoinOutput1[] | null;
    minerfees: string[] | null;
  };
  version: 1;
}

export type Transaction = Transaction0 | Transaction1 ;

export interface ExplorerTransaction0 {
  id: string;
  height: number;
  parent: string;
  rawtransaction: Transaction0;
  coininputoutputs: null | CoinOutput0[];
  coinoutputids: null | string[];
  blockstakeinputoutputs: null | CoinOutput0[];
  blockstakeoutputids: null | string[];
}

export interface ExplorerTransaction1 {
  id: string;
  height: number;
  parent: string;
  rawtransaction: Transaction1;
  coininputoutputs: null | CoinOutput1[];
  coinoutputids: null | string[];
  blockstakeinputoutputs: null | CoinOutput1[];
  blockstakeoutputids: null | string[];
}

export type ExplorerTransaction = ExplorerTransaction0 | ExplorerTransaction1;

export interface ExplorerHashGET {
  block: ExplorerBlock;
  blocks: null | ExplorerBlock[];
  hashtype: 'unlockhash' | 'transactionid' | 'coinoutputid' | 'blockstakeoutputid';
  transaction: ExplorerTransaction;
  transactions: ExplorerTransaction[];
}

export interface TransactionPool {
  transactions: null | Transaction[];
}

export interface OutputMapping {
  id: string;
  amount: string;
}

// Only used by UI

export interface ParsedTransactionInfo {
  amount: number;
  lockedAmount: number;
  minerfee: number;
  receiving: boolean;
}

export interface ParsedTransaction extends ExplorerTransaction1, ParsedTransactionInfo {
}

export interface PendingTransaction extends Transaction1, ParsedTransactionInfo {
}

export const ADDRESS_LENGTH = 78;
export const COIN_TO_HASTINGS_PRECISION = 9;
export const COIN_TO_HASTINGS = Math.pow(10, COIN_TO_HASTINGS_PRECISION);
export const CURRENCY_SYMBOL = configuration.currency_symbol;
export const CURRENCY_DETAIL_DIGITS = `1.0-${COIN_TO_HASTINGS_PRECISION}`;
export const KEY_NAME = configuration.key_name;
export const PROVIDER_ID = configuration.provider_id;
export const RIVINE_ALGORITHM = 'ed25519';
/**
 * Starting from this number, the 'locktime' indicates a unix timestamp. Else it is a block number
 */
export const LOCKTIME_BLOCK_LIMIT = 500_000_000;
