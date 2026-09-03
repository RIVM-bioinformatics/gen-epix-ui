import type { GenEpixUiTheme } from '@gen-epix/ui-client-common/models/theme';

export interface GenEpixCaseDbUiTheme extends GenEpixUiTheme {
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
