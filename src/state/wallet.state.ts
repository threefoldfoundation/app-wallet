import { createSelector } from '@ngrx/store';
import { CryptoTransaction } from 'rogerthat-plugin';
import {
  apiRequestInitial,
  ApiRequestStatus,
  ParsedTransaction,
  RivineBlock,
  RivineBlockInternal,
  RivineCreateTransactionResult,
} from '../interfaces';
import { IAppState } from './app.state';

export interface IWalletState {
  transactions: ParsedTransaction[];
  createdTransaction: RivineCreateTransactionResult | null;
  transactionsStatus: ApiRequestStatus;
  pendingTransaction: CryptoTransaction | null;
  pendingTransactionStatus: ApiRequestStatus;
  createTransactionStatus: ApiRequestStatus;
  latestBlock: RivineBlockInternal | null;
  latestBlockStatus: ApiRequestStatus;
  block: RivineBlock | null;
  blockStatus: ApiRequestStatus;
}

export const getWalletState = (state: IAppState) => state.wallet;

export const initialWalletState: IWalletState = {
  transactions: [],
  createdTransaction: null,
  transactionsStatus: apiRequestInitial,
  pendingTransaction: null,
  pendingTransactionStatus: apiRequestInitial,
  createTransactionStatus: apiRequestInitial,
  latestBlock: null,
  latestBlockStatus: apiRequestInitial,
  block: null,
  blockStatus: apiRequestInitial,
};

export const getTransactions = createSelector(getWalletState, s => s.transactions);
export const getTotalAmount = createSelector(getTransactions, transactions => {
  return transactions.reduce((total: number, transaction: ParsedTransaction) => total + transaction.amount, 0);
});
export const getTransactionsStatus = createSelector(getWalletState, s => s.transactionsStatus);
export const getPendingTransaction = createSelector(getWalletState, s => s.pendingTransaction);
export const getCreatedTransaction = createSelector(getWalletState, s => s.createdTransaction);
export const getPendingTransactionStatus = createSelector(getWalletState, s => s.pendingTransactionStatus);
export const createTransactionStatus = createSelector(getWalletState, s => s.createTransactionStatus);
export const getLatestBlock = createSelector(getWalletState, s => s.latestBlock);
export const getLatestBlockStatus = createSelector(getWalletState, s => s.latestBlockStatus);
export const getBlock = createSelector(getWalletState, s => s.block);
export const getBlockStatus = createSelector(getWalletState, s => s.blockStatus);

