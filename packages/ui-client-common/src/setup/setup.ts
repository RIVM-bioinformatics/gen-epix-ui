import { setupUiCoreForm } from '@gen-epix/ui-core-form/setup/setup';
import { setupUiCore } from '@gen-epix/ui-core/setup/setup';
import { container } from 'tsyringe';

import { QueryClientService } from '../classes/services/QueryClientService';
import { CONFIG_TOKEN } from '../constants/config.constants';


export const setupClientCommon = () => {
  setupUiCore();
  setupUiCoreForm();

  container.register(QueryClientService, {
    // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
    useFactory: () => new QueryClientService({
      config: container.resolve(CONFIG_TOKEN),
      queryKeyDependencies: [],
    }),
  });
};
