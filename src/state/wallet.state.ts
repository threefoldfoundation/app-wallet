import { createSelector } from '@ngrx/store';
import { KeyPair } from 'rogerthat-plugin';
import { getProviderFromKeyPair } from '../configuration';
import {
  apiRequestInitial,
  ApiRequestStatus,
  CreateTransactionResult,
  ExplorerBlock,
  ExplorerBlockGET,
  ExplorerHashGET,
  ParsedTransaction,
  PendingTransaction,
  Transaction1,
} from '../interfaces';
import { getInputIds, getTransactionAmount } from '../util';
import { IAppState } from './app.state';
import { getAddress } from './rogerthat.state';

export interface IWalletState {
  hashInfo: ExplorerHashGET | null;
  hashInfoStatus: ApiRequestStatus;
  transactions: ParsedTransaction[];
  pendingTransactions: PendingTransaction[];
  pendingTransactionsStatus: ApiRequestStatus;
  createdTransaction: CreateTransactionResult | null;
  transactionsStatus: ApiRequestStatus;
  pendingTransaction: Transaction1 | null;
  pendingTransactionStatus: ApiRequestStatus;
  createTransactionStatus: ApiRequestStatus;
  latestBlock: ExplorerBlock | null;
  latestBlockStatus: ApiRequestStatus;
  transaction: ParsedTransaction | null;
  getTransactionStatus: ApiRequestStatus;
  block: ExplorerBlockGET | null;
  blockStatus: ApiRequestStatus;
  selectedKeyPair: KeyPair | null;
}

export const getWalletState = (state: IAppState) => state.wallet;

export const initialWalletState: IWalletState = {
  hashInfo: null,
  hashInfoStatus: apiRequestInitial,
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
  transaction: null,
  getTransactionStatus: apiRequestInitial,
  block: null,
  blockStatus: apiRequestInitial,
  selectedKeyPair: null,
};

export const getHashInfo = createSelector(getWalletState, s => s.hashInfo);
export const getHashInfoStatus = createSelector(getWalletState, s => s.hashInfoStatus);

export const getTransactions = createSelector(getWalletState, s => s.transactions);
export const getPendingTransactions = createSelector(getWalletState, s => s.pendingTransactions);

export const getLatestBlock = createSelector(getWalletState, s => s.latestBlock);
export const getLatestBlockStatus = createSelector(getWalletState, s => s.latestBlockStatus);

export const getTotalAmount = createSelector(getTransactions, getLatestBlock, getAddress, (transactions, latestBlock, address) => {
  let locked = 0;
  let unlocked = 0;

  if (latestBlock && address) {
    const allCoinInputs = getInputIds(transactions, address.address, latestBlock).all;
    for (const transaction of transactions) {
      const result = getTransactionAmount(transaction.rawtransaction, latestBlock, address.address, allCoinInputs);
      locked += result.locked;
      unlocked += result.unlocked;
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
export const getConfirmSendTransactionStatus = createSelector(getHashInfoStatus, getPendingTransactionStatus, (s1, s2) => ({
  success: s1.success && s2.success,
  loading: s1.loading || s2.loading,
  error: s1.error || s2.error
}));
export const createTransactionStatus = createSelector(getWalletState, s => s.createTransactionStatus);
export const getTransaction = createSelector(getWalletState, s => s.transaction);
export const getTransactionStatus = createSelector(getWalletState, s => s.getTransactionStatus);
export const getBlock = createSelector(getWalletState, s => s.block);
export const getBlockStatus = createSelector(getWalletState, s => s.blockStatus);

export const getSelectedKeyPair = createSelector(getWalletState, s => s.selectedKeyPair);
export const getKeyPairProvider = createSelector(getSelectedKeyPair, p => p ? getProviderFromKeyPair(p) : null);
