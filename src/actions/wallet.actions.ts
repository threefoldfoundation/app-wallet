import { Action } from '@ngrx/store';
import { CryptoTransaction, KeyPair, SupportedAlgorithms } from 'rogerthat-plugin';
import {
  ApiRequestStatus,
  CreateSignatureData,
  CreateTransactionResult,
  ExplorerBlock,
  ExplorerBlockGET,
  ExplorerHashGET,
  ParsedTransaction,
  PendingTransaction,
} from '../interfaces';

export const enum WalletActionTypes {
  GET_TRANSACTIONS = 'Get transactions',
  GET_TRANSACTIONS_COMPLETE = 'Get transactions complete',
  GET_TRANSACTIONS_FAILED = 'Get transactions failed',
  GET_HASH_INFO = 'Get hash info',
  GET_HASH_INFO_COMPLETE = 'Get hash info complete',
  GET_HASH_INFO_FAILED = 'Get hash info failed',
  GET_PENDING_TRANSACTIONS = 'Get pending transactions',
  GET_PENDING_TRANSACTIONS_COMPLETE = 'Get pending transactions complete',
  GET_PENDING_TRANSACTIONS_FAILED = 'Get pending transactions failed',
  CREATE_SIGNATURE_DATA = 'Create signature data',
  CREATE_SIGNATURE_DATA_COMPLETE = 'Create signature data complete',
  CREATE_SIGNATURE_DATA_FAILED = 'Create signature data failed',
  CREATE_TRANSACTION = 'Create transaction',
  CREATE_TRANSACTION_COMPLETE = 'Create transaction complete',
  CREATE_TRANSACTION_FAILED = 'Create transaction failed',
  GET_LATEST_BLOCK = 'Get latest block',
  GET_LATEST_BLOCK_COMPLETE = 'Get latest block complete',
  GET_LATEST_BLOCK_FAILED = 'Get latest block failed',
  GET_BLOCK = 'Get block',
  GET_BLOCK_COMPLETE = 'Get block complete',
  GET_BLOCK_FAILED = 'Get block failed',
  SET_SELECTED_KEY_PAIR = 'Set selected key pair'
}

export class GetTransactionsAction implements Action {
  readonly type = WalletActionTypes.GET_TRANSACTIONS;

  constructor(public address: string) {
  }
}

export class GetTransactionsCompleteAction implements Action {
  readonly type = WalletActionTypes.GET_TRANSACTIONS_COMPLETE;

  constructor(public payload: ParsedTransaction[]) {
  }
}

export class GetTransactionsFailedAction implements Action {
  readonly type = WalletActionTypes.GET_TRANSACTIONS_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class GetHashInfoAction implements Action {
  readonly type = WalletActionTypes.GET_HASH_INFO;

  constructor(public address: string) {
  }
}

export class GetHashInfoCompleteAction implements Action {
  readonly type = WalletActionTypes.GET_HASH_INFO_COMPLETE;

  constructor(public payload: ExplorerHashGET) {
  }
}

export class GetHashInfoFailedAction implements Action {
  readonly type = WalletActionTypes.GET_HASH_INFO_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class GetPendingTransactionsAction implements Action {
  readonly type = WalletActionTypes.GET_PENDING_TRANSACTIONS;

  constructor(public address: string) {
  }
}

export class GetPendingTransactionsCompleteAction implements Action {
  readonly type = WalletActionTypes.GET_PENDING_TRANSACTIONS_COMPLETE;

  constructor(public payload: PendingTransaction[]) {
  }
}

export class GetPendingTransactionsFailedAction implements Action {
  readonly type = WalletActionTypes.GET_PENDING_TRANSACTIONS_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class CreateSignatureDataAction implements Action {
  readonly type = WalletActionTypes.CREATE_SIGNATURE_DATA;

  constructor(public payload: CreateSignatureData, public pendingTransactions: PendingTransaction[]) {
  }
}

export class CreateSignatureDataCompleteAction implements Action {
  readonly type = WalletActionTypes.CREATE_SIGNATURE_DATA_COMPLETE;

  constructor(public payload: CryptoTransaction) {
  }
}

export class CreateSignatureDataFailedAction implements Action {
  readonly type = WalletActionTypes.CREATE_SIGNATURE_DATA_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class CreateTransactionAction implements Action {
  readonly type = WalletActionTypes.CREATE_TRANSACTION;

  constructor(public payload: CryptoTransaction, public keyName: string, public algorithm: SupportedAlgorithms, public index: number,
              public message: string) {
  }
}

export class CreateTransactionCompleteAction implements Action {
  readonly type = WalletActionTypes.CREATE_TRANSACTION_COMPLETE;

  constructor(public payload: CreateTransactionResult) {
  }
}

export class CreateTransactionFailedAction implements Action {
  readonly type = WalletActionTypes.CREATE_TRANSACTION_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class GetLatestBlockAction implements Action {
  readonly type = WalletActionTypes.GET_LATEST_BLOCK;
}

export class GetLatestBlockCompleteAction implements Action {
  readonly type = WalletActionTypes.GET_LATEST_BLOCK_COMPLETE;

  constructor(public payload: ExplorerBlock) {
  }
}

export class GetLatestBlockFailedAction implements Action {
  readonly type = WalletActionTypes.GET_LATEST_BLOCK_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class GetBlockAction implements Action {
  readonly type = WalletActionTypes.GET_BLOCK;

  constructor(public height: number) {
  }
}

export class GetBlockCompleteAction implements Action {
  readonly type = WalletActionTypes.GET_BLOCK_COMPLETE;

  constructor(public payload: ExplorerBlockGET) {
  }
}

export class GetBlockFailedAction implements Action {
  readonly type = WalletActionTypes.GET_BLOCK_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class SetSelectedKeyPairAction implements Action {
  readonly type = WalletActionTypes.SET_SELECTED_KEY_PAIR;

  constructor(public payload: KeyPair) {
  }
}

export type WalletActions
  = GetTransactionsAction
  | GetTransactionsCompleteAction
  | GetTransactionsFailedAction
  | GetHashInfoAction
  | GetHashInfoCompleteAction
  | GetHashInfoFailedAction
  | GetPendingTransactionsAction
  | GetPendingTransactionsCompleteAction
  | GetPendingTransactionsFailedAction
  | CreateSignatureDataAction
  | CreateSignatureDataCompleteAction
  | CreateSignatureDataFailedAction
  | CreateTransactionAction
  | CreateTransactionCompleteAction
  | CreateTransactionFailedAction
  | GetLatestBlockAction
  | GetLatestBlockCompleteAction
  | GetLatestBlockFailedAction
  | GetBlockAction
  | GetBlockCompleteAction
  | GetBlockFailedAction
  | SetSelectedKeyPairAction;
