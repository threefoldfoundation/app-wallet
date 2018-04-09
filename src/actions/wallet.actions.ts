import { Action } from '@ngrx/store';
import { CryptoTransaction, SupportedAlgorithms } from 'rogerthat-plugin';
import {
  ApiRequestStatus,
  CreateSignatureData,
  ParsedTransaction,
  RivineBlock,
  RivineBlockInternal,
  RivineCreateTransactionResult,
} from '../interfaces';

interface IWalletActionTypes {
  GET_TRANSACTIONS: 'Get transactions';
  GET_TRANSACTIONS_COMPLETE: 'Get transactions complete';
  GET_TRANSACTIONS_FAILED: 'Get transactions failed';
  CREATE_SIGNATURE_DATA: 'Create signature data';
  CREATE_SIGNATURE_DATA_COMPLETE: 'Create signature data complete';
  CREATE_SIGNATURE_DATA_FAILED: 'Create signature data failed';
  CREATE_TRANSACTION: 'Create transaction';
  CREATE_TRANSACTION_COMPLETE: 'Create transaction complete';
  CREATE_TRANSACTION_FAILED: 'Create transaction failed';
  GET_LATEST_BLOCK: 'Get latest block';
  GET_LATEST_BLOCK_COMPLETE: 'Get latest block complete';
  GET_LATEST_BLOCK_FAILED: 'Get latest block failed';
  GET_BLOCK: 'Get block';
  GET_BLOCK_COMPLETE: 'Get block complete';
  GET_BLOCK_FAILED: 'Get block failed';
}

export const WalletActionTypes: IWalletActionTypes = {
  GET_TRANSACTIONS: 'Get transactions',
  GET_TRANSACTIONS_COMPLETE: 'Get transactions complete',
  GET_TRANSACTIONS_FAILED: 'Get transactions failed',
  CREATE_SIGNATURE_DATA: 'Create signature data',
  CREATE_SIGNATURE_DATA_COMPLETE: 'Create signature data complete',
  CREATE_SIGNATURE_DATA_FAILED: 'Create signature data failed',
  CREATE_TRANSACTION: 'Create transaction',
  CREATE_TRANSACTION_COMPLETE: 'Create transaction complete',
  CREATE_TRANSACTION_FAILED: 'Create transaction failed',
  GET_LATEST_BLOCK: 'Get latest block',
  GET_LATEST_BLOCK_COMPLETE: 'Get latest block complete',
  GET_LATEST_BLOCK_FAILED: 'Get latest block failed',
  GET_BLOCK: 'Get block',
  GET_BLOCK_COMPLETE: 'Get block complete',
  GET_BLOCK_FAILED: 'Get block failed',
};

export class GetTransactionsAction implements Action {
  type = WalletActionTypes.GET_TRANSACTIONS;

  constructor(public address: string) {
  }
}

export class GetTransactionsCompleteAction implements Action {
  type = WalletActionTypes.GET_TRANSACTIONS_COMPLETE;

  constructor(public payload: ParsedTransaction[]) {
  }
}

export class GetTransactionsFailedAction implements Action {
  type = WalletActionTypes.GET_TRANSACTIONS_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class CreateSignatureDataAction implements Action {
  type = WalletActionTypes.CREATE_SIGNATURE_DATA;

  constructor(public payload: CreateSignatureData) {
  }
}

export class CreateSignatureDataCompleteAction implements Action {
  type = WalletActionTypes.CREATE_SIGNATURE_DATA_COMPLETE;

  constructor(public payload: CryptoTransaction) {
  }
}

export class CreateSignatureDataFailedAction implements Action {
  type = WalletActionTypes.CREATE_SIGNATURE_DATA_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class CreateTransactionAction implements Action {
  type = WalletActionTypes.CREATE_TRANSACTION;

  constructor(public payload: CryptoTransaction, public keyName: string, public algorithm: SupportedAlgorithms, public index: number,
              public message: string) {
  }
}

export class CreateTransactionCompleteAction implements Action {
  type = WalletActionTypes.CREATE_TRANSACTION_COMPLETE;

  constructor(public payload: RivineCreateTransactionResult) {
  }
}

export class CreateTransactionFailedAction implements Action {
  type = WalletActionTypes.CREATE_TRANSACTION_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class GetLatestBlockAction implements Action {
  type = WalletActionTypes.GET_LATEST_BLOCK;
}

export class GetLatestBlockCompleteAction implements Action {
  type = WalletActionTypes.GET_LATEST_BLOCK_COMPLETE;

  constructor(public payload: RivineBlockInternal) {
  }
}

export class GetLatestBlockFailedAction implements Action {
  type = WalletActionTypes.GET_LATEST_BLOCK_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class GetBlockAction implements Action {
  type = WalletActionTypes.GET_BLOCK;

  constructor(public height: number) {
  }
}

export class GetBlockCompleteAction implements Action {
  type = WalletActionTypes.GET_BLOCK_COMPLETE;

  constructor(public payload: RivineBlock) {
  }
}

export class GetBlockFailedAction implements Action {
  type = WalletActionTypes.GET_BLOCK_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export type WalletActions
  = GetTransactionsAction
  | GetTransactionsCompleteAction
  | GetTransactionsFailedAction
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
  | GetBlockFailedAction;
