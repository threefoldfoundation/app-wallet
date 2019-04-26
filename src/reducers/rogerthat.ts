import { RogerthatActions, RogerthatActionTypes } from '../actions';
import { ServiceData, UserData } from '../interfaces';
import { initialRogerthatState, IRogerthatState } from '../state';

export function rogerthatReducer(state = initialRogerthatState, action: RogerthatActions): IRogerthatState<UserData, ServiceData> {
  switch (action.type) {
    case RogerthatActionTypes.SET_USER_DATA:
      return {
        ...state,
        userData: action.payload,
      };
    case RogerthatActionTypes.SET_SERVICE_DATA:
      return {
        ...state,
        serviceData: action.payload,
      };

    case RogerthatActionTypes.SCAN_QR_CODE:
      return {
        ...state,
        qrCodeContent: initialRogerthatState.qrCodeContent,
        qrCodeError: initialRogerthatState.qrCodeError,
      };
    case RogerthatActionTypes.SCAN_QR_CODE_UPDATE:
      return {
        ...state,
        qrCodeContent: action.payload,
        qrCodeError: initialRogerthatState.qrCodeError,
      };
    case RogerthatActionTypes.SCAN_QR_CODE_FAILED:
      return {
        ...state,
        qrCodeError: action.payload,
      };
    case RogerthatActionTypes.GET_ADDRESS:
      return {
        ...state,
        addressStatus: initialRogerthatState.addressStatus,
      };
    case RogerthatActionTypes.GET_ADDRESS_COMPLETE:
      return {
        ...state,
        address: action.payload,
      };
    case RogerthatActionTypes.GET_ADDRESS_FAILED:
      return {
        ...state,
        addressStatus: action.payload,
      };
    case RogerthatActionTypes.GET_PUBLIC_KEY:
      return {
        ...state,
        publicKey: null,
        getPublicKeyStatus: initialRogerthatState.getPublicKeyStatus,
      };
    case RogerthatActionTypes.GET_PUBLIC_KEY_COMPLETE:
      return {
        ...state,
        publicKey: action.payload,
      };
    case RogerthatActionTypes.GET_PUBLIC_KEY_FAILED:
      return {
        ...state,
        getPublicKeyStatus: action.payload,
      };
    case RogerthatActionTypes.LIST_KEY_PAIRS:
      return {
        ...state,
        securityKeys: [],
      };
    case RogerthatActionTypes.LIST_KEY_PAIRS_COMPLETE:
      return {
        ...state,
        securityKeys: action.payload,
      };
    case RogerthatActionTypes.CREATE_KEYPAIR:
      return {
        ...state,
        keyPair: null,
        createKeyPairStatus: initialRogerthatState.createKeyPairStatus,
      };
    case RogerthatActionTypes.CREATE_KEYPAIR_COMPLETE:
      return {
        ...state,
        keyPair: action.payload,
      };
    case RogerthatActionTypes.CREATE_KEYPAIR_FAILED:
      return {
        ...state,
        createKeyPairStatus: action.payload,
      };
  }
  return state;
}
