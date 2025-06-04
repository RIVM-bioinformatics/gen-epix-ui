import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useMemo } from 'react';

import type { OptionBase } from '../../models/form';

export const translateOptions = <T, K extends OptionBase<T>>(options: K[], t: TFunction<'translation', undefined>): K[] => {
  return options.map(option => ({
    ...option,
    label: t(option.label),
  }));
};

export const useTranslatedOptions = <T, K extends OptionBase<T>>(options: K[]): K[] => {
  const [t] = useTranslation();

  return useMemo(() => translateOptions(options, t), [options, t]);
};
