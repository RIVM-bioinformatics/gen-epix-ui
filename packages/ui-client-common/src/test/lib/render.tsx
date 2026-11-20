import { CacheProvider } from '@emotion/react';
import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { container } from 'tsyringe';
import { render } from 'vitest-browser-react';
import type { RenderOptions } from 'vitest-browser-react';

import { EmotionCacheService } from '../../classes/services/EmotionCacheService';
import { I18nService } from '../../classes/services/I18nService';
import { QueryClientService } from '../../classes/services/QueryClientService';
import type { ConfigBase } from '../../models/config.models';
import { DependencyContainerUtil } from '../../utils/DependencyContainerUtil';

export const renderClientComponent = async <TConfig extends ConfigBase,>(
  ui: ReactNode,
  { configure, language, wrapper: Wrapper, ...options }: RenderOptions & {
    configure?: (config: TConfig) => void;
    language?: 'en' | 'nl';
  } = {},
) => {
  const config = DependencyContainerUtil.resolveConfig<TConfig>();
  configure?.(config);
  if (language) {
    await container.resolve(I18nService).switchLanguage(language);
  }
  const { queryClient } = container.resolve(QueryClientService);
  const { emotionCache } = container.resolve(EmotionCacheService);

  return render(ui, {
    ...options,
    wrapper: ({ children }) => (
      <I18nextProvider i18n={i18next}>
        <QueryClientProvider client={queryClient}>
          <CacheProvider value={emotionCache}>
            <ThemeProvider theme={config.theme}>
              <CssBaseline />
              {Wrapper ? (
                <Wrapper>
                  {children}
                </Wrapper>
              ) : children}
            </ThemeProvider>
          </CacheProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  });
};

export const renderComponent = renderClientComponent<ConfigBase>;
export const customRender = renderComponent;
