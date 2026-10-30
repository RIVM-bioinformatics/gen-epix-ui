/* eslint-disable @typescript-eslint/naming-convention */
import type { ApplicationBarActionsTheme } from '../components/ui/ApplicationBar/ApplicationBarActions';
import type { ApplicationBarNavigationMenuTheme } from '../components/ui/ApplicationBar/ApplicationBarNavigationMenu';
import type { ApplicationBarTheme } from '../components/ui/ApplicationBar/ApplicationBar';
import type { ApplicationFooterLinkSectionTheme } from '../components/ui/ApplicationFooter/ApplicationFooterLinkSection';
import type { ApplicationFooterLinkTheme } from '../components/ui/ApplicationFooter/ApplicationFooterLink';
import type { ApplicationFooterTheme } from '../components/ui/ApplicationFooter/ApplicationFooter';

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required to augment MUI's generic interface.
  interface Components<TTheme = unknown> {
    GenEpixUiClientCommonApplicationBar?: ApplicationBarTheme;
    GenEpixUiClientCommonApplicationBarActions?: ApplicationBarActionsTheme;
    GenEpixUiClientCommonApplicationBarNavigationMenu?: ApplicationBarNavigationMenuTheme;
    GenEpixUiClientCommonApplicationFooter?: ApplicationFooterTheme;
    GenEpixUiClientCommonApplicationFooterLink?: ApplicationFooterLinkTheme;
    GenEpixUiClientCommonApplicationFooterLinkSection?: ApplicationFooterLinkSectionTheme;
  }
}
