import type { Theme } from '@mui/material';

import type { Stratification } from '../../models/epi';

export class StratificationUtil {
  public static getEchartsColors(stratification: Stratification, theme: Theme): string[] {
    if (!stratification) {
      return [theme.palette.primary.main];
    }
    return stratification.legendaItems?.map(item => item.color) ?? [];
  }
}
