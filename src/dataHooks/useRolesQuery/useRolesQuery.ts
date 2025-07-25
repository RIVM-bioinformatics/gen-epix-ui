import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Role } from '../../api';
import { translateOptions } from '../../hooks/useTranslatedOptions';
import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';


export const rolePresentationValues: Record<Role, string> = {
  [Role.ROOT]: 'ROOT',
  [Role.APP_ADMIN]: 'APP_ADMIN',
  [Role.ORG_ADMIN]: 'ORG_ADMIN',
  [Role.METADATA_ADMIN]: 'METADATA_ADMIN',
  [Role.ORG_USER]: 'ORG_USER',
  [Role.GUEST]: 'GUEST',
  [Role.ROLE1]: 'ROLE1',
};

export const useRoleOptionsQuery = (): UseOptions<string> => {
  const [t] = useTranslation();
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(rolePresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options: translateOptions(options, t),
      error: null,
    } as UseOptions<string>;
  }, [t]);
};
