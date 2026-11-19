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
import { SeqDbSeqFormat } from '@gen-epix/api-seqdb';

import { useSeqFormatOptionsQuery } from './useSeqFormatsQuery';

describe('useSeqFormatOptionsQuery', () => {
  it('returns translated options with numeric SDK values', async () => {
    const i18n = createInstance();
    await i18n.use(initReactI18next).init({
      interpolation: { escapeValue: false },
      lng: 'en',
      resources: { en: { translation: {} } },
    });
    const wrapper = ({ children }: PropsWithChildren) => createElement(I18nextProvider, { i18n }, children);
    const { result } = renderHook(() => useSeqFormatOptionsQuery(), { wrapper });

    expect(result.current.options).toEqual([
      { label: 'Hash only', value: SeqDbSeqFormat.HASH_ONLY },
      { label: 'DNA sequence', value: SeqDbSeqFormat.STR_DNA },
      { label: 'DNA sequence including gaps', value: SeqDbSeqFormat.STR_DNA_INCL_GAP },
      { label: 'Nextclade', value: SeqDbSeqFormat.NEXTCLADE },
      { label: 'Compressed DNA sequence', value: SeqDbSeqFormat.STR_DNA_GZB64 },
      { label: 'Compressed DNA sequence including gaps', value: SeqDbSeqFormat.STR_DNA_INCL_GAP_GZB64 },
    ]);
    expect(result.current.options.every(option => typeof option.value === 'number')).toBe(true);
    expect(result.current).toMatchObject({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
    });
  });
});
