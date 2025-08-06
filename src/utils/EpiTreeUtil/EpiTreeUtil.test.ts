import Decimal from 'decimal.js';

import type { ArgumentTypes } from '../../models/generic';

import { EpiTreeUtil } from './EpiTreeUtil';

describe('EpiTreeUtil', () => {
  describe('getTickMarkScale', () => {
    it('determines the tick mark scale', () => {
      const cases: Array<[ArgumentTypes<typeof EpiTreeUtil.getTickMarkScale>[0], [number, number, number]]> = [
        [{
          geneticTreeWidth: new Decimal(16),
          minGeneticScaleUnit: 1,
          treeWidthMinusPadding: 1200,
          zoomLevel: 1,
        }, [17, 1, 1]],
        [{
          geneticTreeWidth: new Decimal(80),
          minGeneticScaleUnit: 1,
          treeWidthMinusPadding: 1200,
          zoomLevel: 1,
        }, [17, 5, 1]],
        [{
          geneticTreeWidth: new Decimal(150),
          minGeneticScaleUnit: 1,
          treeWidthMinusPadding: 1200,
          zoomLevel: 1,
        }, [16, 10, 1]],
        [{
          geneticTreeWidth: new Decimal(0.8),
          minGeneticScaleUnit: 1,
          treeWidthMinusPadding: 1200,
          zoomLevel: 1,
        }, [2, 1, 1]],
      ];

      cases.forEach(([input, expectedOutput]) => {
        expect(EpiTreeUtil.getTickMarkScale(input)).toEqual(expectedOutput);
      });
    });
  });
});
