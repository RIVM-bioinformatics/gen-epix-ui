import type { GenEpixUiTheme } from '@gen-epix/ui';

export interface GenEpixCaseDbUiTheme extends GenEpixUiTheme {
  'gen-epix-ui-casedb': {
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
