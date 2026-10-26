import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { renderHook } from '@testing-library/react';

import type { ConfigBase } from '../../models/config.models';
import { createDemoTheme } from '../../theme/demoTheme';
import { StandardConfigUtil } from '../../utils/StandardConfigUtil';
import { DependencyContainerUtil } from '../../utils/DependencyContainerUtil';

import { useConfig } from './useConfig';

type TestConfig = {
  customValue: string;
} & ConfigBase;

const INITIAL_CONFIG: ConfigBase = {
  ...StandardConfigUtil.createConfig(),
  theme: createDemoTheme('light'),
};

describe('useConfig', () => {
  afterEach(() => {
    DependencyContainerUtil.registerConfig(INITIAL_CONFIG);
  });

  it('returns the configuration registered in the shared container', () => {
    const config: TestConfig = {
      ...INITIAL_CONFIG,
      customValue: 'custom',
    };
    DependencyContainerUtil.registerConfig(config);

    const { result } = renderHook(() => useConfig<TestConfig>());

    expect(result.current).toBe(config);
    expect(result.current.customValue).toBe('custom');
  });
});
