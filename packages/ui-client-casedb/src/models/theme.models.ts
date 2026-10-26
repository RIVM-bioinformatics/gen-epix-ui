import type { GenEpixUiClientCommonTheme } from '@gen-epix/ui-client-common/models/theme.models';

export interface GenEpixCaseDbUiTheme extends GenEpixUiClientCommonTheme {
  components: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiClientCasedbLineList: GenEpixUiClientCasedbLineListTheme;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiClientCasedbTreeWidget: GenEpixUiClientCasedbTreeWidgetTheme;
  } & GenEpixUiClientCommonTheme['components'];
}

export interface GenEpixUiClientCasedbLineListTheme {
  font: string;
}

export interface GenEpixUiClientCasedbTreeWidgetTheme {
  color: string;
  dimFn: (color: string) => string;
  labelFont: string;
  scaleFont: string;
  supportLineColorLinked: string;
  supportLineColorUnlinked: string;
}
