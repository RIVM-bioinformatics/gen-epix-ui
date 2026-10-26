import type { GenEpixUiClientCommonTheme } from '@gen-epix/ui-client-common/models/theme.models';

export interface GenEpixCaseDbUiTheme extends GenEpixUiClientCommonTheme {
  'gen-epix-ui-client-casedb': {
    lineList: {
      font: string;
      fontVariationSettings?: string;
    };
    tree: {
      color: string;
      dimFn: (color: string) => string;
      font: string;
      fontVariationSettings?: string;
      supportLineColorLinked: string;
      supportLineColorUnlinked: string;
    };
  };
}
