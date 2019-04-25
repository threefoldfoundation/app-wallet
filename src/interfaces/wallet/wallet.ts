import { SupportedAlgorithms } from 'rogerthat-plugin';
import { CoinInput1, Fulfillment } from './input';
import { CoinOutput1, OutputType } from './output';

// Only used in this wallet internally - not in explorer or the android/ios apps
export interface CreateSignatureData {
  version: TransactionVersion;
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


export enum TransactionVersion {
  ZERO = 0,
  ONE = 1,
  CoinCreation = 129,
  ERC20Conversion = 208,
  ERC20CoinCreation = 209,
  ERC20AddressRegistration = 210,
}

export const ADDRESS_REGISTRATION_FEE = 10000000000;  // 10 tokens

export const SUPPORTED_TRANSACTION_TYPES = [
  TransactionVersion.ZERO,
  TransactionVersion.ONE,
  TransactionVersion.CoinCreation,
  TransactionVersion.ERC20Conversion,
  TransactionVersion.ERC20CoinCreation,
  TransactionVersion.ERC20AddressRegistration
];

export const ERC20_ADDRESS_LENGTH = 42;
export const MIN_TFT_CONVERSION = 1000;  // required minimum of 1000 tft to convert tft to erc20 tokens

export const SUPPORTED_CURRENCIES = [{
  name: 'ThreeFold Token',
  version: TransactionVersion.ONE
}, {
  name: 'ERC20 Token',
  version: TransactionVersion.ERC20Conversion
}];

export interface Transaction0 {
  data: {
    coininputs: null | CoinInput0[];
    coinoutputs: null | CoinOutput0[];
    blockstakeinputs?: null | CoinInput0[];
    blockstakeoutputs?: null | CoinOutput0[];
    minerfees: string[] | null;
    arbitrarydata?: string;
  };
  version: TransactionVersion.ZERO;
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
  version: TransactionVersion.ONE;
}

export interface CoinCreationTransaction {
  data: {
    /**
     * Crypto-random 8-byte array (base64-encoded to a string) to ensure the uniqueness of this transaction's ID
     */
    nonce: string;
    /**
     * Fulfillment which fulfills the MintCondition, can be any type of fulfillment as long as it is valid AND fulfills the MintCondition
     */
    mintfulfillment: Fulfillment;
    /**
     * Defines the recipients (as conditions) who are to receive the paired (newly created) coin values
     */
    coinoutputs: CoinOutput1[];
    /**
     * The transaction fees to be paid, also paid in newly created) coins, rather than inputs
     */
    minerfees: string[];
    /**
     * Arbitrary data, can contain anything as long as it fits within 83 bytes, but is in practice used to link the capacity added/created
     * with as a consequence the creation of these transaction and its coin outputs
     */
    arbitrarydata?: string;
  };
  version: TransactionVersion.CoinCreation;
}

export interface ERC20ConvertTransaction {
  data: {
    /**
     * The address to send the TFT-converted tfchain ERC20 funds into.
     * This is an ERC20-valid address, fixed length of 20 bytes
     */
    address: string;
    /**
     * Amount of TFT to be paid towards buying ERC20 funds, note that the bridge will take part of this amount towards
     * paying for the transaction costs, prior to sending the ERC20 funds to the defined target address.
     */
    value: string;
    /** Required Transaction Fee */
    txfee: string;
    /** Coin Inputs that fund the burned value as well as the required Transaction Fee. */
    coininputs: CoinInput1[];
    /** Optional Coin Output, to be used in case the sum of the coin inputs is higher than the burned value and transaction fee combined. */
    refundcoinoutput: CoinOutput1 | null;
  };
  version: TransactionVersion.ERC20Conversion;
}

export interface ERC20CoinCreationTransaction {
  data: {
    /** TFT Address to be paid into */
    address: string;
    /** Value, funded by burning ERC20-funds, to be paid into the TFT Wallet identified by the attached TFT address */
    value: string;
    /** Regular Transaction Fee */
    txfee: string;
    /** ERC20 BlockID of the parent block of the paired ERC20 Transaction. */
    blockid: string;
    /** ERC20 TransactionID in which the matching ERC20-funds got burned,
     * each transactionID can only be used once to fund a TFT coin exchange. */
    txid: string;
  };
  version: TransactionVersion.ERC20CoinCreation;
}

export interface ERC20AddressRegistrationTransaction {
  data: {
    /** public key from which the TFT address is generated, and as a consequence also the ERC20 Address*/
    pubkey: string;
    /** the TFT address (optionally attached in the JSON format only) generated from the attached public key */
    tftaddress: string;
    /** the ERC20 address (optionally attached in the JSON format only) generated from the attached public key */
    erc20address: string;
    /** signature to proof the ownership of the attached public key */
    signature: string;
    /** Registration Fee (hardcoded and required at 10 TFT) */
    regfee: '10000000000';
    /** Regular Transaction Fee */
    txfee: string;
    /** Coin Inputs to fund the fees */
    coininputs: CoinInput1[];
    /** Optional Refund CoinOutput */
    refundcoinoutput: CoinOutput1 | null;
  };
  version: TransactionVersion.ERC20AddressRegistration;
}

export type Transaction =
  Transaction0
  | Transaction1
  | CoinCreationTransaction
  | ERC20ConvertTransaction
  | ERC20CoinCreationTransaction
  | ERC20AddressRegistrationTransaction;

export type CreateTransactionType =
  Transaction1
  | ERC20ConvertTransaction
  | ERC20AddressRegistrationTransaction;

export type ExplorerTransactionTypes = Transaction1
  | CoinCreationTransaction
  | ERC20ConvertTransaction
  | ERC20CoinCreationTransaction
  | ERC20AddressRegistrationTransaction;

export interface ExplorerTransaction0 {
  blockstakeinputoutputs: null | CoinOutput0[];
  blockstakeoutputids: null | string[];
  blockstackeunlockhashes: null | string[];
  coininputoutputs: null | CoinOutput0[];
  coinoutputids: null | string[];
  coinoutputunlockhashes: null | string[];
  height: number;
  id: string;
  parent: string;
  rawtransaction: Transaction0;
  unconfirmed: boolean;
}

export interface ExplorerTransaction1 {
  blockstakeinputoutputs: null | CoinOutput1[];
  blockstakeoutputids: null | string[];
  blockstackeunlockhashes: null | string[];
  coininputoutputs: null | CoinOutput1[];
  coinoutputids: null | string[];
  coinoutputunlockhashes: null | string[];
  height: number;
  id: string;
  parent: string;
  rawtransaction: ExplorerTransactionTypes;
  unconfirmed: boolean;
}

export type ExplorerTransaction = ExplorerTransaction0 | ExplorerTransaction1;

export interface UnlockHash {
  type: OutputType;
  hash: string;
}

export interface ExplorerHashERC20Info {
  tftaddress: string;
  erc20address: string;
  confirmations: number;
}

export interface ExplorerHashGET {
  block: ExplorerBlock;
  blocks: null | ExplorerBlock[];
  erc20info?: ExplorerHashERC20Info;
  hashtype: 'unlockhash' | 'transactionid' | 'coinoutputid' | 'blockstakeoutputid';
  multisigaddresses: UnlockHash[] | null;
  transaction: ExplorerTransaction;
  transactions: ExplorerTransaction[];
  /**
   * true in case hashtype == 'transactionid' and the transaction isn't confirmed yet (meaning it's currently in the transaction pool)
   */
  unconfirmed: boolean;
}

export interface TransactionPool {
  transactions: null | Transaction[];
}

export interface InputMapping {
  id: string;
  amount: string;
}

// Only used by UI

export interface ParsedTransactionInfo {
  amount: number;
  lockedAmount: number;
  fee: number;
  receiving: boolean;
}

export interface ParsedTransaction extends ExplorerTransaction1, ParsedTransactionInfo {
}

export interface PendingTransaction extends ParsedTransactionInfo {
  transaction: CreateTransactionType;
}

export const COIN_TO_HASTINGS_PRECISION = 9;
export const COIN_TO_HASTINGS = Math.pow(10, COIN_TO_HASTINGS_PRECISION);
export const CURRENCY_DETAIL_DIGITS = `1.0-${COIN_TO_HASTINGS_PRECISION}`;
/**
 * Starting from this number, the 'locktime' indicates a unix timestamp. Else it is a block number
 */
export const LOCKTIME_BLOCK_LIMIT = 500_000_000;
