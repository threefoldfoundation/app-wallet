import { Action } from '@ngrx/store';
import {
  CameraType,
  CreateKeyPairResult,
  CryptoAddress,
  KeyPair,
  PublicKey,
  QrCodeScannedContent,
  RogerthatError,
  SupportedAlgorithms,
} from 'rogerthat-plugin';
import { ApiRequestStatus, CreateKeyPair, CreateTransactionType, GetAddressPayload, ServiceData, UserData } from '../interfaces';

export const enum RogerthatActionTypes {
  SET_USER_DATA = '[rogerthat] Set user data',
  SET_SERVICE_DATA = '[rogerthat] Set service data',
  SCAN_QR_CODE = '[rogerthat] Scan QR code',
  SCAN_QR_CODE_STARTED = '[rogerthat] Scan QR code started',
  SCAN_QR_CODE_UPDATE = '[rogerthat] Scan QR code update',
  SCAN_QR_CODE_FAILED = '[rogerthat] Scan QR code failed',
  GET_ADDRESS = '[rogerthat]Get address',
  GET_ADDRESS_COMPLETE = '[rogerthat]Get address complete',
  GET_ADDRESS_FAILED = '[rogerthat]Get address failed',
  GET_PUBLIC_KEY = '[rogerthat]Get public key',
  GET_PUBLIC_KEY_COMPLETE = '[rogerthat]Get public key complete',
  GET_PUBLIC_KEY_FAILED = '[rogerthat]Get public key failed',
  CREATE_TRANSACTION_DATA = '[rogerthat] Create transaction data',
  CREATE_TRANSACTION_DATA_COMPLETE = '[rogerthat] Create transaction data complete',
  CREATE_TRANSACTION_DATA_FAILED = '[rogerthat] Create transaction data failed',
  LIST_KEY_PAIRS = '[rogerthat] List all keys',
  LIST_KEY_PAIRS_COMPLETE = '[rogerthat] List all keys complete',
  LIST_KEY_PAIRS_FAILED = '[rogerthat] List all keys failed',
  CREATE_KEYPAIR = '[rogerthat] Create keypair',
  CREATE_KEYPAIR_COMPLETE = '[rogerthat] Create keypair complete',
  CREATE_KEYPAIR_FAILED = '[rogerthat] Create keypair failed',
}

export class SetUserDataAction implements Action {
  readonly type = RogerthatActionTypes.SET_USER_DATA;

  constructor(public payload: UserData) {
  }
}

export class SetServiceDataAction implements Action {
  readonly type = RogerthatActionTypes.SET_SERVICE_DATA;

  constructor(public payload: ServiceData) {
  }
}

export class ScanQrCodeAction implements Action {
  readonly type = RogerthatActionTypes.SCAN_QR_CODE;

  constructor(public payload: CameraType) {
  }
}

export class ScanQrCodeStartedAction implements Action {
  readonly type = RogerthatActionTypes.SCAN_QR_CODE_STARTED;
}

export class ScanQrCodeUpdateAction implements Action {
  readonly type = RogerthatActionTypes.SCAN_QR_CODE_UPDATE;

  constructor(public payload: QrCodeScannedContent) {
  }
}

export class ScanQrCodeFailedAction implements Action {
  readonly type = RogerthatActionTypes.SCAN_QR_CODE_FAILED;

  constructor(public payload: RogerthatError) {
  }
}

export class GetAddresssAction implements Action {
  readonly type = RogerthatActionTypes.GET_ADDRESS;

  constructor(public payload: GetAddressPayload) {
  }
}

export class GetAddressCompleteAction implements Action {
  readonly type = RogerthatActionTypes.GET_ADDRESS_COMPLETE;

  constructor(public payload: CryptoAddress) {
  }
}

export class GetAddresssFailedAction implements Action {
  readonly type = RogerthatActionTypes.GET_ADDRESS_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class GetPublicKeyAction implements Action {
  readonly type = RogerthatActionTypes.GET_PUBLIC_KEY;

  constructor(public algorithm: SupportedAlgorithms, public keyName: string) {
  }
}

export class GetPublicKeyCompleteAction implements Action {
  readonly type = RogerthatActionTypes.GET_PUBLIC_KEY_COMPLETE;

  constructor(public payload: PublicKey) {
  }
}

export class GetPublicKeyFailedAction implements Action {
  readonly type = RogerthatActionTypes.GET_PUBLIC_KEY_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class CreateTransactionDataAction implements Action {
  readonly type = RogerthatActionTypes.CREATE_TRANSACTION_DATA;

  constructor(public payload: CreateTransactionType, public keyName: string, public algorithm: SupportedAlgorithms, public index: number,
              public message: string) {
  }
}

export class CreateTransactionDataCompleteAction implements Action {
  readonly type = RogerthatActionTypes.CREATE_TRANSACTION_DATA_COMPLETE;

  constructor(public payload: CreateTransactionType) {
  }
}

export class CreateTransactionDataFailedAction implements Action {
  readonly type = RogerthatActionTypes.CREATE_TRANSACTION_DATA_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class ListKeyPairsAction implements Action {
  readonly type = RogerthatActionTypes.LIST_KEY_PAIRS;
}

export class ListKeyPairsCompleteAction implements Action {
  readonly type = RogerthatActionTypes.LIST_KEY_PAIRS_COMPLETE;

  constructor(public payload: KeyPair[]) {
  }
}

export class ListKeyPairsFailedAction implements Action {
  readonly type = RogerthatActionTypes.LIST_KEY_PAIRS_FAILED;

  constructor(public payload: ApiRequestStatus) {
  }
}

export class CreateKeyPairAction implements Action {
  readonly type = RogerthatActionTypes.CREATE_KEYPAIR;

  constructor(public payload: CreateKeyPair) {
  }
}

export class CreateKeyPairCompleteAction implements Action {
  readonly type = RogerthatActionTypes.CREATE_KEYPAIR_COMPLETE;

  constructor(public payload: CreateKeyPairResult) {
  }
}

export class CreateKeyPairFailedAction implements Action {
  readonly type = RogerthatActionTypes.CREATE_KEYPAIR_FAILED;

  constructor(public payload: RogerthatError) {
  }
}

export type RogerthatActions
  = SetUserDataAction
  | SetServiceDataAction
  | ScanQrCodeAction
  | ScanQrCodeStartedAction
  | ScanQrCodeUpdateAction
  | ScanQrCodeFailedAction
  | GetAddresssAction
  | GetAddressCompleteAction
  | GetAddresssFailedAction
  | GetPublicKeyAction
  | GetPublicKeyCompleteAction
  | GetPublicKeyFailedAction
  | CreateTransactionDataAction
  | CreateTransactionDataCompleteAction
  | CreateTransactionDataFailedAction
  | ListKeyPairsAction
  | ListKeyPairsCompleteAction
  | ListKeyPairsFailedAction
  | CreateKeyPairAction
  | CreateKeyPairCompleteAction
  | CreateKeyPairFailedAction;

