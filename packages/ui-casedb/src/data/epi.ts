import type { EpiDashboardArrangement } from '../models/epi';

export const EPI_WIDGET_NAME = {
  EPI_CURVE: 'EPI_CURVE',
  LEGENDA: 'LEGENDA',
  LINE_LIST: 'LINE_LIST',
  MAP: 'MAP',
  TREE: 'TREE',
};

export const EPI_DASHBOARD_DEFAULT_ARRANGEMENTS: { [key: string]: EpiDashboardArrangement } = {
  1: ['A', 'B'],
  2: [
    [
      'A',
      'B',
    ],
  ],
  3: [
    ['A', 'B'],
    ['C', 'D'],
  ],
  4: [
    [
      ['A', 'B'],
      ['C', 'D', 'E'],
    ],
  ],
};
