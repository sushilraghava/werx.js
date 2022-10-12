
import {AssetLibrary, AssetMap} from './asset-library';

const DEFAULTS: AssetMap = {
  // werx: {
  //   id: 'werx',
  //   label: 'werx',
  //   symbol: 'WERX',
  //   network: '*',
  //   decimals: 8,
  //   native: true
  // }
}

class WerxAssetLibrary extends AssetLibrary {
  protected defaultAssetsMap = DEFAULTS;
  protected defaultAssets = [];
}

export const werxAssetLibrary = new WerxAssetLibrary();
