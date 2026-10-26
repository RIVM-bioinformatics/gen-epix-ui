import type { GenEpixUiClientCommonTheme } from '@gen-epix/ui-client-common/models/theme.models';

export interface GenEpixCaseDbUiTheme extends GenEpixUiClientCommonTheme {
  components: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiClientCasedbLineList: GenEpixUiClientCasedbLineListTheme;
  } & GenEpixUiClientCommonTheme['components'];
}

export interface GenEpixUiClientCasedbLineListTheme {
  font: string;
}
