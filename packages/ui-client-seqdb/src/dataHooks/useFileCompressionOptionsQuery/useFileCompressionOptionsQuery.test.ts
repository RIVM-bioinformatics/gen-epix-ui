import { createElement } from 'react';
import type { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';
import { createInstance } from 'i18next';
import {
  I18nextProvider,
  initReactI18next,
} from 'react-i18next';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { SeqDbFileCompression } from '@gen-epix/api-seqdb';

import { useFileCompressionOptionsQuery } from './useFileCompressionOptionsQuery';

const createWrapper = async (translation: Record<string, string>) => {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({
    interpolation: { escapeValue: false },
    lng: 'en',
    resources: { en: { translation } },
  });
  return ({ children }: PropsWithChildren) => createElement(I18nextProvider, { i18n }, children);
};

describe('useFileCompressionOptionsQuery', () => {
  it('returns translated options in SDK declaration order', async () => {
    const wrapper = await createWrapper({});
    const { result } = renderHook(() => useFileCompressionOptionsQuery(), { wrapper });

    expect(result.current).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'None', value: SeqDbFileCompression.NONE },
        { label: 'GZIP', value: SeqDbFileCompression.GZIP },
      ],
    });
  });

  it('takes option labels from the translation resources', async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const wrapper = await createWrapper({ GZIP: 'Gzip NL', None: 'Geen' });
    const { result } = renderHook(() => useFileCompressionOptionsQuery(), { wrapper });

    expect(result.current.options).toEqual([
      { label: 'Geen', value: SeqDbFileCompression.NONE },
      { label: 'Gzip NL', value: SeqDbFileCompression.GZIP },
    ]);
  });
});
