import { ServiceData, UserData } from '../interfaces';
import { rogerthatReducer, walletReducer } from '../reducers';
import { IRogerthatState } from './rogerthat.state';
import { IWalletState } from './wallet.state';

export interface IAppState {
  wallet: IWalletState;
  rogerthat: IRogerthatState<UserData, ServiceData>;
}

export const reducers: any = {
  wallet: walletReducer,
  rogerthat: rogerthatReducer,
};
