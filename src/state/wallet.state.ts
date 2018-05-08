import { createSelector } from '@ngrx/store';
import { CryptoTransaction } from 'rogerthat-plugin';
import {
  apiRequestInitial,
  ApiRequestStatus,
  CreateTransactionResult,
  ExplorerBlock,
  ExplorerBlockGET,
  ParsedTransaction,
  PendingTransaction,
} from '../interfaces';
import { getLocked } from '../util';
import { IAppState } from './app.state';

export interface IWalletState {
  transactions: ParsedTransaction[];
  pendingTransactions: PendingTransaction[];
  pendingTransactionsStatus: ApiRequestStatus;
  createdTransaction: CreateTransactionResult | null;
  transactionsStatus: ApiRequestStatus;
  pendingTransaction: CryptoTransaction | null;
  pendingTransactionStatus: ApiRequestStatus;
  createTransactionStatus: ApiRequestStatus;
  latestBlock: ExplorerBlock | null;
  latestBlockStatus: ApiRequestStatus;
  block: ExplorerBlockGET | null;
  blockStatus: ApiRequestStatus;
}

export const getWalletState = (state: IAppState) => state.wallet;

export const initialWalletState: IWalletState = {
  transactions: [],
  pendingTransactions: [],
  pendingTransactionsStatus: apiRequestInitial,
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
export const getPendingTransactions = createSelector(getWalletState, s => s.pendingTransactions);

export const getLatestBlock = createSelector(getWalletState, s => s.latestBlock);
export const getLatestBlockStatus = createSelector(getWalletState, s => s.latestBlockStatus);

export const getTotalAmount = createSelector(getTransactions, getLatestBlock, (transactions, latestBlock) => {
  let locked = 0;
  let unlocked = 0;
  if (latestBlock) {
    for (const transaction of transactions) {
      const transactionLocked = getLocked(transaction.rawtransaction, latestBlock).reduce((rawTotal, locked) => rawTotal + locked.value, 0);
      locked += transactionLocked;
      unlocked += transaction.amount - transactionLocked;
    }
  }
  return { locked, unlocked };
});

export const getTotalLockedAmount = createSelector(getTotalAmount, total => total.locked);
export const getTotalUnlockedAmount = createSelector(getTotalAmount, total => total.unlocked);
export const getTransactionsStatus = createSelector(getWalletState, s => s.transactionsStatus);
export const getPendingTransaction = createSelector(getWalletState, s => s.pendingTransaction);
export const getCreatedTransaction = createSelector(getWalletState, s => s.createdTransaction);
export const getPendingTransactionStatus = createSelector(getWalletState, s => s.pendingTransactionStatus);
export const createTransactionStatus = createSelector(getWalletState, s => s.createTransactionStatus);
export const getBlock = createSelector(getWalletState, s => s.block);
export const getBlockStatus = createSelector(getWalletState, s => s.blockStatus);

