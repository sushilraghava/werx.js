
import {AssetLibrary, AssetMap} from './asset-library';

const DEFAULTS: AssetMap = {
  // WREX: {
  //   id: 'WREX',
  //   label: 'WREX',
  //   symbol: 'WREX',
  //   network: '*',
  //   decimals: 8,
  //   native: true
  // }
}

class WrexAssetLibrary extends AssetLibrary {
  protected defaultAssetsMap = DEFAULTS;
  protected defaultAssets = [];
}

export const wrexAssetLibrary = new WrexAssetLibrary();
