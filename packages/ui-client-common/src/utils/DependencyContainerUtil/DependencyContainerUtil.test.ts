import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';

import type { ConfigBase } from '../../models/config.models';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../StandardConfigUtil';

import { DependencyContainerUtil } from './DependencyContainerUtil';

const INITIAL_CONFIG: ConfigBase = {
  ...StandardConfigUtil.createConfig(),
  theme: createDemoTheme('light'),
};

DependencyContainerUtil.registerConfig(INITIAL_CONFIG);
afterEach(() => {
  DependencyContainerUtil.registerConfig(INITIAL_CONFIG);
});

describe('DependencyContainerUtil', () => {
  it('registers and resolves the configuration', () => {
    const config: ConfigBase = {
      ...INITIAL_CONFIG,
      applicationName: 'test application',
    };

    DependencyContainerUtil.registerConfig(config);

    expect(DependencyContainerUtil.resolveConfig()).toBe(config);
  });
});
