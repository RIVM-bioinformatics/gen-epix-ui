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

import { useUpdateDocumentTitle } from './useUpdateDocumentTitle';

const INITIAL_CONFIG: ConfigBase = {
  ...StandardConfigUtil.createConfig(),
  theme: createDemoTheme('light'),
};
const registerConfig = (applicationName: string) => {
  DependencyContainerUtil.registerConfig({
    ...INITIAL_CONFIG,
    applicationName,
  });
};

const originalDocumentTitle = document.title;

describe('useUpdateDocumentTitle', () => {
  afterEach(() => {
    document.title = originalDocumentTitle;
    DependencyContainerUtil.registerConfig(INITIAL_CONFIG);
  });

  it('sets the application and page title and responds to changes', () => {
    registerConfig('Gen-EpiX');
    const { rerender, unmount } = renderHook(
      ({ title }: { title: string }) => useUpdateDocumentTitle(title),
      {
        initialProps: { title: 'Home' },
      },
    );

    expect(document.title).toBe('Gen-EpiX - Home');

    rerender({ title: 'Users' });
    expect(document.title).toBe('Gen-EpiX - Users');

    registerConfig('Case DB');
    rerender({ title: '' });
    expect(document.title).toBe('Case DB -');

    unmount();
    expect(document.title).toBe('Case DB -');
  });
});
