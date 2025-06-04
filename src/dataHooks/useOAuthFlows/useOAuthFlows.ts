import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { OauthFlowType } from '../../api';
import { translateOptions } from '../../hooks/useTranslatedOptions';
import type { UseOptions } from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';

export const oAuthFlowPresentationValues: Record<OauthFlowType, string> = {
  [OauthFlowType.AUTHORIZATION_CODE]: 'Authorization Code',
  [OauthFlowType.CLIENT_CREDENTIALS]: 'Client Credentials',
  [OauthFlowType.RESOURCE_OWNER]: 'Resource Owner',
  [OauthFlowType.HYBRID]: 'Hybrid',
  [OauthFlowType.DEVICE_AUTHORIZATION]: 'Device Authorization',
  [OauthFlowType.PKCE]: 'PCKE',
};

export const useOAuthFlowOptions = (): UseOptions<string> => {
  const [t] = useTranslation();
  return useMemo(() => {
    const options: OptionBase<string>[] = Object.entries(oAuthFlowPresentationValues).map(([value, label]) => ({ value, label }));
    return {
      isLoading: false,
      options: translateOptions(options, t),
      error: null as UseOptions<string>,
    };
  }, [t]);
};
