import { WalletActions, WalletActionTypes } from '../actions';
import { apiRequestLoading, apiRequestSuccess } from '../interfaces';
import { initialWalletState, IWalletState } from '../state';

export function walletReducer(state: IWalletState = initialWalletState, action: WalletActions): IWalletState {
  switch (action.type) {
    case WalletActionTypes.GET_HASH_INFO:
      return {
        ...state,
        hashInfo: initialWalletState.hashInfo,
        hashInfoStatus: apiRequestLoading,
      };
    case WalletActionTypes.GET_HASH_INFO_COMPLETE:
      return {
        ...state,
        hashInfo: action.payload,
        hashInfoStatus: apiRequestSuccess,
      };
    case WalletActionTypes.GET_HASH_INFO_FAILED:
      return {
        ...state,
        hashInfoStatus: action.payload,
      };
    case WalletActionTypes.GET_TRANSACTION:
      return {
        ...state,
        getTransactionStatus: apiRequestLoading,
      };
    case WalletActionTypes.GET_TRANSACTION_COMPLETE:
      return {
        ...state,
        transaction: action.payload,
        getTransactionStatus: apiRequestSuccess,
      };
    case WalletActionTypes.GET_TRANSACTION_FAILED:
      return {
        ...state,
        getTransactionStatus: action.payload,
      };
    case WalletActionTypes.GET_TRANSACTIONS:
      return {
        ...state,
        transactionsStatus: apiRequestLoading,
      };
    case WalletActionTypes.GET_TRANSACTIONS_COMPLETE:
      return {
        ...state,
        transactions: action.payload,
        transactionsStatus: apiRequestSuccess,
      };
    case WalletActionTypes.GET_TRANSACTIONS_FAILED:
      return {
        ...state,
        transactionsStatus: action.payload,
      };
    case WalletActionTypes.GET_PENDING_TRANSACTIONS:
      return {
        ...state,
        pendingTransactionsStatus: apiRequestLoading,
      };
    case WalletActionTypes.GET_PENDING_TRANSACTIONS_COMPLETE:
      return {
        ...state,
        pendingTransactions: action.payload,
        pendingTransactionsStatus: apiRequestSuccess,
      };
    case WalletActionTypes.GET_PENDING_TRANSACTIONS_FAILED:
      return {
        ...state,
        pendingTransactionsStatus: action.payload,
      };
    case WalletActionTypes.CREATE_SIGNATURE_DATA:
      return {
        ...state,
        pendingTransaction: initialWalletState.pendingTransaction,
        createTransactionStatus: initialWalletState.createTransactionStatus,
        pendingTransactionStatus: apiRequestLoading,
      };
    case WalletActionTypes.CREATE_SIGNATURE_DATA_COMPLETE:
      return {
        ...state,
        pendingTransaction: action.payload,
        pendingTransactionStatus: apiRequestSuccess,
      };
    case WalletActionTypes.CREATE_SIGNATURE_DATA_FAILED:
      return {
        ...state,
        pendingTransactionStatus: action.payload,
      };
    case WalletActionTypes.CREATE_TRANSACTION:
      return {
        ...state,
        createTransactionStatus: apiRequestLoading,
      };
    case WalletActionTypes.CREATE_TRANSACTION_COMPLETE:
      return {
        ...state,
        createdTransaction: action.payload,
        createTransactionStatus: apiRequestSuccess,
      };
    case WalletActionTypes.CREATE_TRANSACTION_FAILED:
      return {
        ...state,
        createTransactionStatus: action.payload,
      };
    case WalletActionTypes.GET_LATEST_BLOCK:
      return {
        ...state,
        latestBlock: initialWalletState.latestBlock,
        latestBlockStatus: apiRequestLoading,
      };
    case WalletActionTypes.GET_LATEST_BLOCK_COMPLETE:
      return {
        ...state,
        latestBlock: action.payload,
        latestBlockStatus: apiRequestSuccess,
      };
    case WalletActionTypes.GET_LATEST_BLOCK_FAILED:
      return {
        ...state,
        latestBlockStatus: action.payload,
      };
    case WalletActionTypes.GET_BLOCK:
      return {
        ...state,
        blockStatus: apiRequestLoading,
      };
    case WalletActionTypes.GET_BLOCK_COMPLETE:
      return {
        ...state,
        block: action.payload,
        blockStatus: apiRequestSuccess,
      };
    case WalletActionTypes.GET_BLOCK_FAILED:
      return {
        ...state,
        blockStatus: action.payload,
      };
    case WalletActionTypes.SET_SELECTED_KEY_PAIR:
      return {
        ...state,
        selectedKeyPair: action.payload,
      };
  }
  return state;
}
