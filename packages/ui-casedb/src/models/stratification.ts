import type {
  CaseDbCol,
  CaseDbColType,
} from '@gen-epix/api-casedb';

import type { CaseTypeRowValue } from './caseDb';

export enum STRATIFICATION_MODE {
  FIELD = 'FIELD',
  SELECTION = 'SELECTION',
}


export enum STRATIFICATION_SELECTED {
  SELECTED = 'SELECTED',
  UNSELECTED = 'UNSELECTED',
}

export interface StratifiableColumn {
  col: CaseDbCol;
  enabled: boolean;
}

export type Stratification = {
  caseIdColors: { [key: string]: string };
  col?: CaseDbCol;
  colorForIsMissing: string;
  legendaItems?: StratificationLegendaItem[];
  legendaItemsByColor?: { [key: string]: StratificationLegendaItem };
  legendaItemsByValue?: { [key: string]: StratificationLegendaItem };
  mode: STRATIFICATION_MODE;
};

export type StratificationLegendaItem = {
  caseIds: string[];
  color: string;
  columnType?: CaseDbColType;
  rowValue: CaseTypeRowValue;
};
