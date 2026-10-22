import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { QueryClientService } from '../../classes/services/QueryClientService';
import {
  CONFIG_TOKEN,
  WINDOW_SERVICE_TOKEN,
} from '../../constants/config.constants';
import type { ConfigBase } from '../../models/config.models';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../StandardConfigUtil';

import { DependencyContainerUtil } from './DependencyContainerUtil';

const INITIAL_CONFIG: ConfigBase = {
  ...StandardConfigUtil.createConfig(),
  theme: createDemoTheme('light'),
};
DependencyContainerUtil.createContainer(INITIAL_CONFIG);

afterEach(() => {
  DependencyContainerUtil.createContainer(INITIAL_CONFIG);
});

describe('DependencyContainerUtil', () => {
  it('registers the configuration, window service, and query client service', () => {
    const config: ConfigBase = {
      ...INITIAL_CONFIG,
      applicationName: 'test application',
    };

    const dependencyContainer = DependencyContainerUtil.createContainer(config);

    expect(dependencyContainer).toBe(container);
    expect(dependencyContainer.resolve(CONFIG_TOKEN)).toBe(config);
    expect(dependencyContainer.resolve(WINDOW_SERVICE_TOKEN)).toBe(WindowService.getInstance());
    expect(dependencyContainer.resolve(QueryClientService)).toBeInstanceOf(QueryClientService);
    expect(DependencyContainerUtil.resolveConfig()).toBe(config);
  });

  it('resolves configuration from an explicitly supplied child container', () => {
    const config: ConfigBase = {
      ...INITIAL_CONFIG,
      applicationName: 'child application',
    };
    const childContainer = container.createChildContainer();
    childContainer.register(CONFIG_TOKEN, { useValue: config });

    expect(DependencyContainerUtil.resolveConfig(childContainer)).toBe(config);
  });
});
