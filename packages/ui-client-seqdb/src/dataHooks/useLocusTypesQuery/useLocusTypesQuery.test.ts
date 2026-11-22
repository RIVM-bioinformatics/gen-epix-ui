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
import { SeqDbLocusType } from '@gen-epix/api-seqdb';

import { useLocusTypeOptionsQuery } from './useLocusTypesQuery';

const createWrapper = async (translation: Record<string, string>) => {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({
    interpolation: { escapeValue: false },
    lng: 'en',
    resources: { en: { translation } },
  });
  return ({ children }: PropsWithChildren) => createElement(I18nextProvider, { i18n }, children);
};

describe('useLocusTypeOptionsQuery', () => {
  it('returns translated options in SDK declaration order', async () => {
    const wrapper = await createWrapper({});
    const { result } = renderHook(() => useLocusTypeOptionsQuery(), { wrapper });

    expect(result.current).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'Gene', value: SeqDbLocusType.GENE },
        { label: 'Intergenic region', value: SeqDbLocusType.INTERGENIC_REGION },
        { label: 'Tandem repeat', value: SeqDbLocusType.TANDEM_REPEAT },
        { label: 'PCR', value: SeqDbLocusType.PCR },
        { label: 'Other', value: SeqDbLocusType.OTHER },
        { label: 'Unknown', value: SeqDbLocusType.UNKNOWN },
      ],
    });
  });

  it('takes option labels from the translation resources', async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const wrapper = await createWrapper({ Gene: 'Gen NL', Unknown: 'Onbekend' });
    const { result } = renderHook(() => useLocusTypeOptionsQuery(), { wrapper });

    expect(result.current.options.slice(0, 1)).toEqual([{ label: 'Gen NL', value: SeqDbLocusType.GENE }]);
    expect(result.current.options.at(-1)).toEqual({ label: 'Onbekend', value: SeqDbLocusType.UNKNOWN });
  });
});
