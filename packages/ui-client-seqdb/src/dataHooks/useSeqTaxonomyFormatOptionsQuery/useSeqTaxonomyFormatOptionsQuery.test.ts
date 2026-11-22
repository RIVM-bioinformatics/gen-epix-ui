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
import { SeqDbSeqTaxonomyFormat } from '@gen-epix/api-seqdb';

import { useSeqTaxonomyFormatOptionsQuery } from './useSeqTaxonomyFormatOptionsQuery';

const createWrapper = async (translation: Record<string, string>) => {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({
    interpolation: { escapeValue: false },
    lng: 'en',
    resources: { en: { translation } },
  });
  return ({ children }: PropsWithChildren) => createElement(I18nextProvider, { i18n }, children);
};

describe('useSeqTaxonomyFormatOptionsQuery', () => {
  it('returns translated options with SDK values', async () => {
    const wrapper = await createWrapper({});
    const { result } = renderHook(() => useSeqTaxonomyFormatOptionsQuery(), { wrapper });

    expect(result.current).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'Taxonomy format 1', value: SeqDbSeqTaxonomyFormat.TAXONOMY_FORMAT1 },
      ],
    });
  });

  it('takes option labels from the translation resources', async () => {
    const wrapper = await createWrapper({ 'Taxonomy format 1': 'Taxonomieformaat 1' });
    const { result } = renderHook(() => useSeqTaxonomyFormatOptionsQuery(), { wrapper });

    expect(result.current.options).toEqual([
      { label: 'Taxonomieformaat 1', value: SeqDbSeqTaxonomyFormat.TAXONOMY_FORMAT1 },
    ]);
  });
});
