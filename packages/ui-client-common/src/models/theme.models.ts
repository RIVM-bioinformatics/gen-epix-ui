import type { GenEpixCoreComponentsTheme } from '@gen-epix/ui-core-components/models/theme.models';

export interface GenEpixUiClientCommonTheme extends GenEpixCoreComponentsTheme {
  'gen-epix-ui-client-common': {
    footer: {
      background: string;
      color: string;
      sectionBorderColor: string;
    };
    navbar: {
      activeBackground: string;
      activeColor: string;
      background: string;
      environmentMessageColor: string;
      primaryColor: string;
      secondaryColor: string;
    };
  };
}
