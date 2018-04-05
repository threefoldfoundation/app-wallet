import { CryptoTransactionData } from '../interfaces/wallet';
/**
 * See http://www.rogerthat.net/developers/javascript-api/ for more info
 */
import { RogerthatError, RogerthatMessageOpenError, StartScanningQrCodeError, StopScanningQrCodeError } from './rogerthat-errors';

export * from './rogerthat-errors';

export type RequiredActionType = 'follow_url' | 'enter_code';

export interface RequiredAction {
  /**
   * Optional url to where the user should be redirected.
   */
  action: RequiredActionType;
  /**
   * Description of what the user is now supposed to do.
   */
  description: string | null;
  /**
   * JSON encoded optional data to be used dependent on the action
   */
  data: string | null;
}

export type AssetType = 'account' | 'bank' | 'creditcard' | 'cryptocurrency_wallet';

export interface CreatePaymentProviderAsset {
  type: AssetType;
  currency: string;
  /**
   * Only to be used when type == 'bank'
   */
  iban: string | null;
  /**
   * Only to be used when type == 'cryptocurrency_wallet'
   */
  address: string | null;
  /**
   * Currently only to used when type == 'cryptocurrency_wallet'
   */
  id: string | null;
}

export type ColorSchemes = 'light' | 'primary' | 'secondary' | 'danger' | 'dark';

export type PaymentProviderId = 'paycash' | 'threefold' | 'payconiq';

export class PaymentProvider {
  id: string;
  name: string;
  logo_url: string;
  version: number;
  oauth_authorize_url: string;
  /**
   * Whether or not the user has already authorized this provider.
   */
  enabled: boolean;
  /**
   * List of asset types that this provider supports.
   */
  asset_types: AssetType[];
  /**
   * List of currencies that this provider supports.
   */
  currencies: string[];
  background_color: string;
  text_color: string;
  button_color: ColorSchemes;
  black_white_logo: string;
  authorize: (successCallback: (result: string) => void, errorCallback: (error: RogerthatError) => void) => void;
  profile: (successCallback: (result: PaymentProviderProfile) => void,
            errorCallback: (error: RogerthatError) => void) => void;
  assets: (successCallback: (result: PaymentProviderAsset) => void,
           errorCallback: (error: RogerthatError) => void) => void;
  createAsset: (successCallback: (result: PaymentProviderAsset) => void,
                errorCallback: (error: RogerthatError) => void,
                asset: CreatePaymentProviderAsset) => void;
}

export interface PaymentProviderProfile {
  first_name: string;
  last_name: string;
}

export class PaymentTransaction {
  asset_id: string;
  provider_id: string;
  id: string;
  type: string;
  name: string;
  amount: number;
  currency: string;
  memo: string;
  timestamp: number;
  from_asset_id: string;
  to_asset_id: string;
}

export interface TransactionsList {
  cursor: string;
  transactions: PaymentTransaction[];
}

export enum PendingPaymentStatus {
  CREATED = 'created',
  SCANNED = 'scanned',
  CANCELLED_BY_RECEIVER = 'cancelled_by_receiver',
  CANCELLED_BY_PAYER = 'cancelled_by_payer',
  FAILED = 'failed',
  PENDING = 'pending',
  SIGNATURE = 'signature',
  CONFIRMED = 'confirmed',
}

export interface PendingPaymentUpdate {
  status: string;
  transaction_id: string;
}

export interface CreateTransactionBaseResult extends PendingPaymentUpdate {
  provider_id: PaymentProviderId;
  success: boolean;
}

export type GetTransactionsTypes = 'confirmed' | 'pending';

export interface PaymentAssetBalance {
  amount: number;
  description: string | null;
}

export interface PaymentProviderAsset {
  available_balance: PaymentAssetBalance;
  total_balance: PaymentAssetBalance | null;
  currency: string;
  provider_id: string;
  name: string;
  verified: boolean;
  required_action: RequiredAction | null;
  enabled: boolean;
  id: string;
  type: AssetType;
  has_balance: boolean;
  has_transactions: boolean;
  transactions: (successCallback: (result: TransactionsList) => void,
                 errorCallback: (error: RogerthatError) => void,
                 cursor: string | null,
                 transactionType: GetTransactionsTypes) => void;
  verify: (successCallback: () => void, errorCallback: (error: RogerthatError) => void, cursor: string | null) => void;
  /**
   * statusCallback is called every time the status of the transaction updates.
   */
  receive: (statusCallback: (result: PendingPaymentUpdate) => void,
            errorCallback: (error: RogerthatError) => void,
            amount: number,
            memo: string | null) => void;
}

export interface PendingPayment {
  id: string;
  amount: number;
  currency: string;
  memo: string;
  timestamp: number;
  provider: PaymentProvider;
  assets: PaymentProviderAsset[];
  receiver: UserDetails;
  receiver_asset: PaymentProviderAsset;
  getSignatureData: (successCallback: (signature?: CryptoTransaction) => void,
                     errorCallback: (error: RogerthatError) => void,
                     assetId: string) => void;
  getTransactionData: (successCallback: (payload: CryptoTransaction) => void,
                       errorCallback: (error: RogerthatError) => void,
                       algorithm: SupportedAlgorithms,
                       name: string,
                       index: number,
                       signature_data: string) => void;
  /**
   * Executes a payment
   * @param successCallback called in case the transaction was completed
   * @param errorCallback called when the transaction could not be committed
   * @param signature Signature of the transaction, if any
   */
  confirm: (successCallback: (status: PendingPaymentUpdate) => void,
            errorCallback: (error: RogerthatError) => void,
            signature?: string | null) => void;
  cancel: (successCallback: () => void, errorCallback: (error: RogerthatError) => void) => void;
}

export interface ProviderRemovedCallbackResult {
  provider_id: string;
}

export interface AssetsUpdatedCallbackResult {
  provider_id: string;
  assets: PaymentProviderAsset[];
}

export interface PaymentsCallbacks {
  onProviderUpdated: (callback: (result: PaymentProvider) => void) => void;
  onProviderRemoved: (callback: (result: ProviderRemovedCallbackResult) => void) => void;
  onAssetsUpdated: (callback: (result: AssetsUpdatedCallbackResult) => void) => void;
  onAssetUpdated: (callback: (result: PaymentProviderAsset) => void) => void;
}

export interface SignatureData {
  data: string;
}

export interface RogerthatPayments {
  /**
   * Lists payment providers. If the `all` parameter is true, all available payment providers are returned.
   * Otherwise, only the payment providers that the user is connected with are returned.
   * The successCallback function is also called every time the payment provider has changed.
   */
  providers: (successCallback: (paymentProviders: PaymentProvider[]) => void,
              errorCallback: (error: RogerthatError) => void,
              all?: boolean) => void;
  assets: (successCallback: (assets: PaymentProviderAsset[]) => void,
           errorCallback: (error: RogerthatError) => void) => void;
  getPendingPaymentDetails: (successCallback: (result: PendingPayment) => void,
                             errorCallback: (error: RogerthatError) => void,
                             updateCallback: (result: PendingPaymentUpdate) => void,
                             transactionId: string) => void;
  cancelPayment: (successCallback: () => void,
                  errorCallback: (error: RogerthatError) => void,
                  transactionId: string) => void;
  callbacks: PaymentsCallbacks;
  getTransactionData: (successCallback: (payload: SignatureData) => void,
                       errorCallback: (error: RogerthatError) => void,
                       algorithm: SupportedAlgorithms,
                       name: string,
                       index: number,
                       signature_data: string) => void;
}

export interface AnyKeyValue {
  [key: string]: any;
}

export interface RogerthatUserInfo {
  name: string;
  account: string;
  avatarUrl: string;
  language: string;
  data: AnyKeyValue;
  put: () => void;
}

export interface RogerthatSystem {
  os: 'ios' | 'android';
  version: string; // '10.1' (iOS) | '25' => android api 25 (Nougat)
  appVersion: string; // '2.0.2000.I'
  appName: string; // 'Rogerthat'
  appId: string; // 'rogerthat'
  onBackendConnectivityChanged: (successCallback: (connectionStatus: InternetConnectionStatus) => void,
                                 errorCallback: () => void) => void;
}

export enum BeaconProximity {
  UNKNOWN = 0,
  IMMEDIATE = 1,
  NEAR = 2,
  FAR = 3
}

export interface Beacon {
  uuid: string;
  major: string;
  minor: string;
  tag: string;
  proximity: BeaconProximity;
}

export interface RogerthatService {
  name: string;
  account: string;
  data: AnyKeyValue;
  getBeaconInReach: (successCallback: (result: Beacon[]) => void, errorCallback: (result: any) => void) => void;
}

export interface RogerthatMessage {
  open: (messageKey: string, successCallback: () => void,
         errorCallback: (error: RogerthatMessageOpenError) => void) => void;
}

export type CameraType = 'front' | 'back';

export interface RogerthatCamera {
  startScanningQrCode: (cameraType: CameraType,
                        successCallback: () => void,
                        errorCallback: (error: StartScanningQrCodeError) => void) => void;
  stopScanningQrCode: (cameraType: CameraType,
                       successCallback: () => void,
                       errorCallback: (error: StopScanningQrCodeError) => void) => void;
}

export interface PublicKey {
  algorithm: string;
  name: string;
  index: string;
  public_key: string;
}

export interface HasKeyPairResult {
  exists: boolean;
}

export interface CryptoSeed {
  seed: string;
}

export interface CryptoAddress {
  address: string;
}

export interface CryptoSignature {
  /**
   * Base64 payload
   */
  payload: string;
  /**
   * Base64 signature
   */
  payload_signature: string;
}

export interface CryptoTransactionInput {
  parent_id: string;
  timelock: number;
}

export interface CryptoTransactionOutput {
  value: string;
  unlockhash: string;
}

export interface CryptoTransactionData {
  input: CryptoTransactionInput;
  outputs: CryptoTransactionOutput[];
  algorithm: SupportedAlgorithms;
  public_key: string;
  public_key_index: number;
  /**
   * base64
   */
  signature_hash: string;
  /**
   * base64 signature, this should be set by using rogerthat.security.sign by the client
   */
  signature: string;
  timelock: number;
}

export interface CryptoTransaction {
  data: CryptoTransactionData[];
  from_address: string;
  minerfees: string;
  to_address: string;
}

export interface VerifyResult {
  valid: boolean;
}

export type SupportedAlgorithms = 'ed25519';

export interface RogerthatSecurity {
  createKeyPair: (successCallback: (result: PublicKey) => void,
                  errorCallback: (error: RogerthatError) => void,
                  algorithm: SupportedAlgorithms,
                  keyName: string,
                  message: string | null,
                  force: boolean,
                  seed: string) => void;
  hasKeyPair: (successCallback: (result: HasKeyPairResult) => void,
               errorCallback: (error: RogerthatError) => void,
               algorithm: SupportedAlgorithms,
               keyName: string,
               index: number | null) => void;
  getPublicKey: (successCallback: (result: PublicKey) => void,
                 errorCallback: (error: RogerthatError) => void,
                 algorithm: SupportedAlgorithms,
                 keyName: string) => void;
  getSeed: (successCallback: (result: CryptoSeed) => void,
            errorCallback: (error: RogerthatError) => void,
            algorithm: SupportedAlgorithms,
            keyName: string,
            message: string | null) => void;
  getAddress: (successCallback: (result: CryptoAddress) => void,
               errorCallback: (error: RogerthatError) => void,
               algorithm: SupportedAlgorithms,
               keyName: string,
               index: number,
               message: string | null) => void;
  sign: (successCallback: (result: CryptoSignature) => void,
         errorCallback: (error: RogerthatError) => void,
         algorithm: SupportedAlgorithms,
         keyName: string,
         index: number,
         message: string,
         payload: string,
         forcePin: boolean,
         hashPayload: boolean) =>
    void;
  verify: (successCallback: (result: VerifyResult) => void,
           errorCallback: (error: RogerthatError) => void,
           algorithm: SupportedAlgorithms,
           keyName: string,
           index: number,
           payload: string,
           payload_signature: string) => void;
}

export enum FeatureSupported {
  CHECKING = 0,
  SUPPORTED = 1,
  NON_SUPPORTED = 2,
}

export interface RogerthatFeatures {
  base64URI: FeatureSupported;
  backgroundSize: FeatureSupported;
  beacons: FeatureSupported;
  callback: (feature: 'base64URI' | 'backgroundSize' | 'beacons') => void;
}

export interface RogerthatUI {
  hideKeyboard: () => void; // Android only
}

export interface InternetConnectionStatus {
  connected: boolean;
  connectedToWifi?: boolean;
}

interface Translations {
  /**
   * Example: { 'name': {'nl': 'Naam', 'en': 'Name'} }
   */
  [key: string]: { [key: string]: string };
}

export interface RogerthatUtil {
  _translateHTML: () => void;
  _translations: { defaultLanguage: string; values: Translations };
  /**
   * Generate a random UUID
   */
  uuid: () => string;
  /**
   * Play a sound file which is located in the branding zip
   */
  playAudio: (path: string, callback: () => void) => void;
  isConnectedToInternet: (callback: (connectionStatus: InternetConnectionStatus) => void) => void;
  open: (params: AnyKeyValue, successCallback: () => void, errorCallback: () => void) => void;
  translate: (key: string, parameters: AnyKeyValue) => string;
  embeddedAppTranslations: (successCallback: (translations: { translations: AnyKeyValue }) => void,
                            errorCallback: (error: RogerthatError) => void) => void;
}

export interface UserDetails {
  app_id: string; // 'rogerthat'
  avatar_url: string;
  email: string; // 'test@example.com
  language: string; // 'en_US'
  name: string; // 'test user'
  public_key: string | null;
  public_keys: PublicKey[];
}

export interface QrCodeScannedContent {
  status: 'resolving' | 'resolved' | 'error';
  /**
   * Content of the QR code, or an error message in case status == 'error'
   */
  content: string;
  userDetails?: UserDetails;
}

export interface RogerthatCallbacks {
  /**
   * Rogerthat user and service data has been set
   */
  ready: (callback: () => void) => void;
  /**
   * User pressed back button
   */
  backPressed: (callback: () => void) => void;
  /**
   * The HTML5 wallet is not visible anymore
   */
  onPause: (callback: () => void) => void;
  /**
   * The HTML5 wallet is visible again
   */
  onResume: (callback: () => void) => void;
  /**
   * The wallet received an update and rogerthat.user.data is updated.
   */
  userDataUpdated: (callback: () => void) => void;
  /**
   *  The wallet received an update and rogerthat.service.data is updated.
   */
  serviceDataUpdated: (callback: () => void) => void;
  /**
   * The device its Internet connectivity has changed.
   */
  onBackendConnectivityChanged: (callback: (connectionStatus: InternetConnectionStatus) => void) => void;
  /**
   * The wallet detected a beacon.
   */
  onBeaconInReach: (callback: (beacon: Beacon) => void) => void;
  /**
   * The user went out of reach of a beacon.
   */
  onBeaconOutOfReach: (callback: (beacon: Beacon) => void) => void;
  /**
   * A QR code has been scanned as result of rogerthat.camera.startScanningQrCode
   * This method is called twice. If the smartphone is connected to the Internet,
   * the wallet will request the details of the scanned QR code.
   * The 'userDetails' property will only be available in the second callback.
   */
  qrCodeScanned: (callback: (result: QrCodeScannedContent) => void) => void;
}

export interface RogerthatApiCallbacks {
  resultReceived: (callback: (method: string, result: any, error: string | null, tag: string) => void) => void;
}

export interface RogerthatApi {
  call: (method: string, data: string | null, tag: string) => void;
  callbacks: RogerthatApiCallbacks;
}

export interface RogerthatMenuItem {
  label: string;
  hashedTag: string;
  action: number;
  coords: number[];
}

export interface PaymentMethod {
  provider_id: PaymentProviderId;
  currency: string;
  amount: number;
  precision: number;
}

export interface PayWidgetData {
  t: 2;
  result_type: string;
  methods: PaymentMethod[];
  memo: string;
  target: string;
  message_key: string;
}

export interface Rogerthat {
  api: RogerthatApi;
  app: RogerthatApp;
  callbacks: RogerthatCallbacks;
  camera: RogerthatCamera;
  context: (successCallback: (result: any) => void,
            errorCallback: (error: RogerthatError) => void) => void;
  features: RogerthatFeatures;
  /**
   * The menu item that was pressed to open the html wallet.
   */
  menuItem: RogerthatMenuItem;
  message: RogerthatMessage;
  service: RogerthatService;
  security: RogerthatSecurity;
  system: RogerthatSystem;
  ui: RogerthatUI;
  user: RogerthatUserInfo;
  util: RogerthatUtil;
  payments: RogerthatPayments;
}

declare global {
  const rogerthat: Rogerthat;
  /**
   * See {@link https://github.com/emn178/js-sha256/}
   */
  const sha256: any;
}
