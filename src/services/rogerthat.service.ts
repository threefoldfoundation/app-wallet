import { Injectable, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  CameraType,
  CryptoAddress,
  CryptoSignature,
  CryptoTransaction,
  RogerthatCallbacks,
  RogerthatError,
  SignatureData,
  SupportedAlgorithms,
} from 'rogerthat-plugin';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ScanQrCodeUpdateAction, SetServiceDataAction, SetUserDataAction } from '../actions';
import { GetAddressPayload } from '../interfaces';
import { IAppState } from '../state';
import { I18nService } from './i18n.service';

export interface AppVersion {
  major: number;
  minor: number;
  patch: number;
}

@Injectable()
export class RogerthatService {
  private _version: AppVersion;

  constructor(private i18nService: I18nService,
              private ngZone: NgZone,
              private store: Store<IAppState>) {
  }

  initialize() {
    this.store.dispatch(new SetUserDataAction(rogerthat.user.data));
    this.store.dispatch(new SetServiceDataAction(rogerthat.service.data));
    this.i18nService.use(rogerthat.user.language);
    const cb = <RogerthatCallbacks>rogerthat.callbacks;
    cb.qrCodeScanned(result => this.ngZone.run(() => this.store.dispatch(new ScanQrCodeUpdateAction(result))));
    cb.userDataUpdated(() => this.ngZone.run(() => this.store.dispatch(new SetUserDataAction(rogerthat.user.data))));
    cb.serviceDataUpdated(() => this.ngZone.run(() => this.store.dispatch(new SetServiceDataAction(rogerthat.service.data))));
    const [major, minor, patch] = rogerthat.system.appVersion.split('.').slice(0, 3).map(s => parseInt(s));
    this._version = {major, minor, patch};
  }

  getVersion() {
    return this._version;
  }

  getContext(): Observable<any> {
    const zone = this.ngZone;
    return Observable.create((emitter: Subject<any>) => {
      rogerthat.context(success, error);

      function success(context: any) {
        zone.run(() => {
          emitter.next(context);
          emitter.complete();
        });
      }

      function error(err: RogerthatError) {
        zone.run(() => {
          emitter.error(err);
        });
      }
    });
  }

  startScanningQrCode(cameraType: CameraType): Observable<null> {
    const zone = this.ngZone;
    return Observable.create((emitter: Subject<null>) => {
      rogerthat.camera.startScanningQrCode(cameraType, success, error);

      function success() {
        zone.run(() => {
          emitter.next(null);
          emitter.complete();
        });
      }

      function error(err: RogerthatError) {
        zone.run(() => {
          emitter.error(err);
        });
      }
    });
  }

  /**
   * Returns the address, if it exists. else an error with code key_not_found will be emitted
   */
  getAddress(payload: GetAddressPayload): Observable<CryptoAddress> {
    return Observable.create((emitter: Subject<CryptoAddress>) => {
      const success = (result: CryptoAddress) => {
        this.ngZone.run(() => {
          emitter.next(result);
          emitter.complete();
        });
      };

      const error = (err: RogerthatError) => {
        this.ngZone.run(() => {
          emitter.error(err);
        });
      };
      rogerthat.security.getAddress(success, error, payload.algorithm, payload.keyName, payload.index, payload.message);
    });
  }

  createTransactionData(transaction: CryptoTransaction, algorithm: SupportedAlgorithms, keyName: string, index: number,
                        unlockMessage: string): Observable<CryptoTransaction> {
    const zone = this.ngZone;
    return Observable.create((emitter: Subject<CryptoTransaction>) => {
      rogerthat.payments.getTransactionData(success, error, algorithm, keyName, index, JSON.stringify(transaction));

      function success(signatureData: SignatureData) {
        const updatedTransaction: CryptoTransaction = JSON.parse(signatureData.data);
        let signedCounter = updatedTransaction.data.length;
        for (let i = 0; i < updatedTransaction.data.length; i++) {
          rogerthat.security.sign(signature => processSignature(signature, i), signError, algorithm, keyName, index, unlockMessage,
            updatedTransaction.data[i].signature_hash, false, false);
        }

        function processSignature(signature: CryptoSignature, dataIndex: number) {
          updatedTransaction.data[dataIndex].signature = signature.payload_signature;
          signedCounter--;
          if (signedCounter === 0) {
            // Everything signed, return updated transaction with signatures
            zone.run(() => {
              emitter.next(updatedTransaction);
              emitter.complete();
            });
          }
        }

        function signError(exception: RogerthatError) {
          error({message: exception.message, code: 'failed_to_sign_transaction'});
        }
      }

      function error(err: RogerthatError) {
        zone.run(() => {
          emitter.error(err);
        });
      }
    });
  }
}
