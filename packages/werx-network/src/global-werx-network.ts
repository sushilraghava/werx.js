
import {BlockExplorerV2Api, blockExplorerApi} from './api/v2/block-explorer-api';
import {WerxNetwork} from './werx-network';

export class GlobalWerxNetwork extends WerxNetwork {

  blockExplorerApi = blockExplorerApi;

  blockExplorer (host: string) {
    return new BlockExplorerV2Api(host);
  }
}

export const globalWerxNetwork = new GlobalWerxNetwork();


