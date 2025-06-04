import type { ArgumentTypes } from '../../models/generic';

import { EpiTreeUtil } from './EpiTreeUtil';

describe('EpiTreeUtil', () => {
  describe('getTickMarkScale', () => {
    it('determines the tick mark scale', () => {
      const cases: Array<[ArgumentTypes<typeof EpiTreeUtil.getTickMarkScale>[0], [number, number, number]]> = [
        [{
          geneticTreeWidth: 16,
          minGeneticScaleUnit: 1,
          treeWidthMinusPadding: 1200,
          zoomLevel: 1,
        }, [16, 1, 1]],
        [{
          geneticTreeWidth: 80,
          minGeneticScaleUnit: 1,
          treeWidthMinusPadding: 1200,
          zoomLevel: 1,
        }, [16, 5, 1]],
        [{
          geneticTreeWidth: 150,
          minGeneticScaleUnit: 1,
          treeWidthMinusPadding: 1200,
          zoomLevel: 1,
        }, [15, 10, 1]],
        [{
          geneticTreeWidth: 0.8,
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
