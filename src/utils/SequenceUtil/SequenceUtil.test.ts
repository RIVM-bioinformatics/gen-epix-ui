import {
  describe,
  it,
  expect,
} from 'vitest';

import type {
  GeneticSequence,
  Case,
} from '../../api';

import { SequenceUtil } from './SequenceUtil';

describe('SequenceUtil', () => {
  describe('createFastaContent', () => {
    it('should create correct FASTA content', () => {
      const sequences: GeneticSequence[] = [
        { nucleotide_sequence: 'ATCG' },
        { nucleotide_sequence: 'GGTA' },
      ];

      const cases: Case[] = [
        { id: 'case1' },
        { id: 'case2' },
      ] as Case[];

      const expectedFastaContent = '>case1\nATCG\n\n>case2\nGGTA\n';

      const fastaContent = SequenceUtil.createFastaContent(sequences, cases);
      expect(fastaContent).toBe(expectedFastaContent);
    });

    it('should handle cases where sequences array is shorter than cases array', () => {
      const sequences: GeneticSequence[] = [
        { nucleotide_sequence: 'ATCG' },
      ];

      const cases: Case[] = [
        { id: 'case1' },
        { id: 'case2' },
      ] as Case[];

      const expectedFastaContent = '>case1\nATCG\n';

      const fastaContent = SequenceUtil.createFastaContent(sequences, cases);
      expect(fastaContent).toBe(expectedFastaContent);
    });

    it('should handle empty sequences and cases arrays', () => {
      const sequences: GeneticSequence[] = [];
      const cases: Case[] = [];

      const expectedFastaContent = '';

      const fastaContent = SequenceUtil.createFastaContent(sequences, cases);
      expect(fastaContent).toBe(expectedFastaContent);
    });
  });
});
