import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { createElement } from 'react';
import type { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';
import { container } from 'tsyringe';

import type { ConfigBase } from '../../models/config.models';
import { ClientCommonConfigContext } from '../../context/ClientCommonConfigContext';
import type { ClientCommonConfig } from '../../context/ClientCommonConfigContext';

import { useUpdateDocumentTitle } from './useUpdateDocumentTitle';

type TestConfig = {
  applicationName: string;
} & ConfigBase;

const createContextValue = (applicationName: string): ClientCommonConfig<TestConfig> => ({
  config: { applicationName } as TestConfig,
  container,
  coreComponentsConfig: {
    spinner: {
      defaultCircularProgressSize: 24,
      defaultTakingLongerTimeoutMs: 1000,
    },
  },
});

const originalDocumentTitle = document.title;

describe('useUpdateDocumentTitle', () => {
  afterEach(() => {
    document.title = originalDocumentTitle;
  });

  it('sets the application and page title and responds to changes', () => {
    let contextValue = createContextValue('Gen-EpiX');
    const wrapper = ({ children }: PropsWithChildren) => createElement(
      ClientCommonConfigContext.Provider,
      { value: contextValue },
      children,
    );
    const { rerender, unmount } = renderHook(
      ({ title }: { title: string }) => useUpdateDocumentTitle(title),
      {
        initialProps: { title: 'Home' },
        wrapper,
      },
    );

    expect(document.title).toBe('Gen-EpiX - Home');

    rerender({ title: 'Users' });
    expect(document.title).toBe('Gen-EpiX - Users');

    contextValue = createContextValue('Case DB');
    rerender({ title: '' });
    expect(document.title).toBe('Case DB -');

    unmount();
    expect(document.title).toBe('Case DB -');
  });
});
