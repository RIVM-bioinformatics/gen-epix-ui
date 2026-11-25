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
import { SeqDbQualityControlResult } from '@gen-epix/api-seqdb';

import { useQualityControlResultOptionsQuery } from './useQualityControlResultOptionsQuery';

const createWrapper = async (translation: Record<string, string>) => {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({
    interpolation: { escapeValue: false },
    lng: 'en',
    resources: { en: { translation } },
  });
  return ({ children }: PropsWithChildren) => createElement(I18nextProvider, { i18n }, children);
};

describe('useQualityControlResultOptionsQuery', () => {
  it('returns translated options in SDK declaration order', async () => {
    const wrapper = await createWrapper({});
    const { result } = renderHook(() => useQualityControlResultOptionsQuery(), { wrapper });

    expect(result.current).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'Pending', value: SeqDbQualityControlResult.PENDING },
        { label: 'Fail', value: SeqDbQualityControlResult.FAIL },
        { label: 'Warning', value: SeqDbQualityControlResult.WARN },
        { label: 'Pass', value: SeqDbQualityControlResult.PASS },
      ],
    });
  });

  it('takes option labels from the translation resources', async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const wrapper = await createWrapper({ Pass: 'Geslaagd', Warning: 'Waarschuwing' });
    const { result } = renderHook(() => useQualityControlResultOptionsQuery(), { wrapper });

    expect(result.current.options.at(-1)).toEqual({ label: 'Geslaagd', value: SeqDbQualityControlResult.PASS });
    expect(result.current.options[2]).toEqual({ label: 'Waarschuwing', value: SeqDbQualityControlResult.WARN });
  });
});
