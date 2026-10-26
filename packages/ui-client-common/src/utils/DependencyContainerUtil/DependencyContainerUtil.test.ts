import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { QueryClientService } from '../../classes/services/QueryClientService';
import { CONFIG_TOKEN } from '../../constants/config.constants';
import { WINDOW_SERVICE_TOKEN } from '../../constants/api.constants';
import type { ConfigBase } from '../../models/config.models';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../StandardConfigUtil';

import { DependencyContainerUtil } from './DependencyContainerUtil';

const INITIAL_CONFIG: ConfigBase = {
  ...StandardConfigUtil.createConfig(),
  theme: createDemoTheme('light'),
};

DependencyContainerUtil.initializeContainer();
DependencyContainerUtil.registerConfig(INITIAL_CONFIG);
afterEach(() => {
  DependencyContainerUtil.registerConfig(INITIAL_CONFIG);
});

describe('DependencyContainerUtil', () => {
  it('registers the configuration, window service, and query client service', () => {
    const config: ConfigBase = {
      ...INITIAL_CONFIG,
      applicationName: 'test application',
    };

    DependencyContainerUtil.registerConfig(config);
    const dependencyContainer = DependencyContainerUtil.initializeContainer();

    expect(dependencyContainer).toBe(container);
    expect(dependencyContainer.resolve(CONFIG_TOKEN)).toBe(config);
    expect(dependencyContainer.resolve(WINDOW_SERVICE_TOKEN)).toBe(WindowService.getInstance());
    expect(dependencyContainer.resolve(QueryClientService)).toBeInstanceOf(QueryClientService);
    expect(DependencyContainerUtil.resolveConfig()).toBe(config);
  });
});
