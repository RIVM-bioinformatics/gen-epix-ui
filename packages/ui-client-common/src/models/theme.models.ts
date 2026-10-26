import type { GenEpixCoreComponentsTheme } from '@gen-epix/ui-core-components/models/theme.models';

export interface GenEpixUiClientCommonFooterTheme {
  background: string;
  color: string;
  sectionBorderColor: string;
}

export interface GenEpixUiClientCommonNavbarTheme {
  activeBackground: string;
  activeColor: string;
  background: string;
  environmentMessageColor: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface GenEpixUiClientCommonTheme extends GenEpixCoreComponentsTheme {
  components: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiClientCommonFooter: GenEpixUiClientCommonFooterTheme;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiClientCommonNavbar: GenEpixUiClientCommonNavbarTheme;
  } & GenEpixCoreComponentsTheme['components'];
}
