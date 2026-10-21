import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createElement } from 'react';
import type { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';
import { container } from 'tsyringe';
import type { CoreComponentsConfig } from '@gen-epix/ui-core-components/context/CoreComponentsConfigContext';

import type { ConfigBase } from '../../models/config.models';
import { ClientCommonConfigContext } from '../../context/ClientCommonConfigContext';
import type { ClientCommonConfig } from '../../context/ClientCommonConfigContext';

import { useConfig } from './useConfig';

type TestConfig = {
  customLabel: string;
} & ConfigBase;

const config = {
  applicationName: 'Test application',
  customLabel: 'Custom setting',
} as TestConfig;

const clientCommonConfig: ClientCommonConfig<TestConfig> = {
  config,
  container,
  coreComponentsConfig: {
    spinner: {
      defaultCircularProgressSize: 24,
      defaultTakingLongerTimeoutMs: 1000,
    },
  } satisfies CoreComponentsConfig,
};

const wrapper = ({ children }: PropsWithChildren) => createElement(
  ClientCommonConfigContext.Provider,
  { value: clientCommonConfig },
  children,
);

describe('useConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the context configuration using the default type', () => {
    const { result } = renderHook(() => useConfig(), { wrapper });

    expect(result.current).toBe(config);
  });

  it('preserves a caller-provided extended config type', () => {
    const { result } = renderHook(() => useConfig<TestConfig>(), { wrapper });

    expect(result.current).toBe(config);
    expect(result.current.customLabel).toBe('Custom setting');
  });

  it('throws when the client configuration context is unavailable', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useConfig())).toThrowError(
      new Error('ClientCommonConfigContext is not available'),
    );
  });
});
