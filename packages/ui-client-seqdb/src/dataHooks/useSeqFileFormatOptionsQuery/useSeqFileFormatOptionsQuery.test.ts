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
import { SeqDbSeqFileFormat } from '@gen-epix/api-seqdb';

import { useSeqFileFormatOptionsQuery } from './useSeqFileFormatOptionsQuery';

const createWrapper = async (translation: Record<string, string>) => {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({
    interpolation: { escapeValue: false },
    lng: 'en',
    resources: { en: { translation } },
  });
  return ({ children }: PropsWithChildren) => createElement(I18nextProvider, { i18n }, children);
};

describe('useSeqFileFormatOptionsQuery', () => {
  it('returns translated options with SDK values', async () => {
    const wrapper = await createWrapper({});
    const { result } = renderHook(() => useSeqFileFormatOptionsQuery(), { wrapper });

    expect(result.current).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'FASTA', value: SeqDbSeqFileFormat.FASTA },
      ],
    });
  });

  it('takes option labels from the translation resources', async () => {
    const wrapper = await createWrapper({ FASTA: 'FASTA NL' });
    const { result } = renderHook(() => useSeqFileFormatOptionsQuery(), { wrapper });

    expect(result.current.options).toEqual([{ label: 'FASTA NL', value: SeqDbSeqFileFormat.FASTA }]);
  });
});
