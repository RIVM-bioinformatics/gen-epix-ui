import {
  describe,
  it,
  expect,
} from 'vitest';

import type {
  CaseTypeCol,
  Col,
  CompleteCaseType,
  Dim,
  CaseTypeDim,
} from '../../api';
import {
  ColType,
  DimType,
} from '../../api';

import { EpiUploadUtil } from './EpiUploadUtil';

describe('EpiUploadUtil', () => {
  // Helper functions for creating mock data
  const createMockFile = (name: string, type = 'application/octet-stream'): File => {
    return new File(['mock content'], name, { type });
  };

  const createMockFileList = (files: File[]): FileList => {
    const fileList = {
      length: files.length,
      item: (index: number) => files[index] || null,
      *[Symbol.iterator]() {
        for (const file of files) {
          yield file;
        }
      },
    };

    // Add indexed properties
    files.forEach((file, index) => {
      (fileList as unknown as Record<number, File>)[index] = file;
    });

    return fileList as FileList;
  };

  const createMockCaseTypeCol = (
    id: string,
    colId: string,
    _colType: ColType,
    label = 'Test Column',
    code = 'test_col',
  ): CaseTypeCol => ({
    id,
    col_id: colId,
    case_type_id: 'case-type-1',
    code,
    label,
    description: null,
    occurrence: null,
    rank: 1,
    min_value: null,
    max_value: null,
  });

  const createMockCol = (id: string, colType: ColType, dimId = 'dim-1'): Col => ({
    id,
    dim_id: dimId,
    code_suffix: null,
    code: 'test_col',
    rank_in_dim: 1,
    label: 'Test Column',
    col_type: colType,
    concept_set_id: null,
    description: null,
  });

  const createMockDim = (id: string, dimType = DimType.OTHER): Dim => ({
    id,
    dim_type: dimType,
    code: 'test_dim',
    label: 'Test Dimension',
    rank: 1,
    col_code_prefix: null,
    description: null,
  });

  const createMockCaseTypeDim = (
    id: string,
    dimId: string,
    caseTypeColOrder: string[] = [],
  ): CaseTypeDim => ({
    id,
    dim_id: dimId,
    occurrence: null,
    rank: 1,
    case_type_col_order: caseTypeColOrder,
  });

  const createMockCompleteCaseType = (
    caseTypeCols: CaseTypeCol[] = [],
    cols: Col[] = [],
    dims: Dim[] = [],
    caseTypeDims: CaseTypeDim[] = [],
  ): CompleteCaseType => {
    const colsMap: { [key: string]: Col } = {};
    cols.forEach(col => {
      if (col.id) {
        colsMap[col.id] = col;
      }
    });

    const caseTypeColsMap: { [key: string]: CaseTypeCol } = {};
    caseTypeCols.forEach(ctc => {
      if (ctc.id) {
        caseTypeColsMap[ctc.id] = ctc;
      }
    });

    const dimsMap: { [key: string]: Dim } = {};
    dims.forEach(dim => {
      if (dim.id) {
        dimsMap[dim.id] = dim;
      }
    });

    return {
      id: 'case-type-1',
      name: 'Test Case Type',
      description: null,
      disease_id: null,
      etiological_agent_id: null,
      etiologies: {},
      etiological_agents: {},
      dims: dimsMap,
      cols: colsMap,
      case_type_dims: caseTypeDims,
      case_type_cols: caseTypeColsMap,
      case_type_col_order: [],
      genetic_distance_protocols: {},
      tree_algorithms: {},
      case_type_access_abacs: {},
      case_type_share_abacs: {},
    };
  };

  describe('assignFilesToColumns', () => {
    it('should return empty array when fileList is empty', () => {
      const completeCaseType = createMockCompleteCaseType();
      const emptyFileList = createMockFileList([]);

      const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, emptyFileList);

      expect(result).toEqual([]);
    });

    it('should assign null to unsupported file types', () => {
      const completeCaseType = createMockCompleteCaseType();
      const unsupportedFile = createMockFile('document.pdf');
      const fileList = createMockFileList([unsupportedFile]);

      const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

      expect(result).toEqual([
        {
          file: unsupportedFile,
          caseTypeCol: null,
        },
      ]);
    });

    it('should handle multiple unsupported files', () => {
      const completeCaseType = createMockCompleteCaseType();
      const file1 = createMockFile('document.pdf');
      const file2 = createMockFile('image.png');
      const fileList = createMockFileList([file1, file2]);

      const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

      expect(result).toEqual([
        { file: file1, caseTypeCol: null },
        { file: file2, caseTypeCol: null },
      ]);
    });

    describe('genome files (.fa, .fasta)', () => {
      it('should assign to single GENETIC_SEQUENCE column when available', () => {
        const col = createMockCol('col-1', ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'col-1', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const genomeFile = createMockFile('genome.fasta');
        const fileList = createMockFileList([genomeFile]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        expect(result).toEqual([
          {
            file: genomeFile,
            caseTypeCol,
          },
        ]);
      });

      it('should assign null when no GENETIC_SEQUENCE column exists', () => {
        const completeCaseType = createMockCompleteCaseType();

        const genomeFile = createMockFile('genome.fa');
        const fileList = createMockFileList([genomeFile]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        expect(result).toEqual([
          {
            file: genomeFile,
            caseTypeCol: null,
          },
        ]);
      });

      it('should assign null when multiple GENETIC_SEQUENCE columns exist', () => {
        const col1 = createMockCol('col-1', ColType.GENETIC_SEQUENCE);
        const col2 = createMockCol('col-2', ColType.GENETIC_SEQUENCE);
        const caseTypeCol1 = createMockCaseTypeCol('ctc-1', 'col-1', ColType.GENETIC_SEQUENCE);
        const caseTypeCol2 = createMockCaseTypeCol('ctc-2', 'col-2', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol1, caseTypeCol2], [col1, col2]);

        const genomeFile = createMockFile('genome.fasta.gz');
        const fileList = createMockFileList([genomeFile]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        expect(result).toEqual([
          {
            file: genomeFile,
            caseTypeCol: null,
          },
        ]);
      });

      it('should handle multiple genome files', () => {
        const col = createMockCol('col-1', ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'col-1', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const file1 = createMockFile('genome1.fa');
        const file2 = createMockFile('genome2.fasta');
        const fileList = createMockFileList([file1, file2]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        expect(result).toEqual([
          { file: file1, caseTypeCol },
          { file: file2, caseTypeCol },
        ]);
      });
    });

    describe('single reads file (.fq, .fastq)', () => {
      it('should assign to single GENETIC_READS column when available', () => {
        const col = createMockCol('col-1', ColType.GENETIC_READS);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'col-1', ColType.GENETIC_READS);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const readsFile = createMockFile('reads.fastq');
        const fileList = createMockFileList([readsFile]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        expect(result).toEqual([
          {
            file: readsFile,
            caseTypeCol,
          },
        ]);
      });

      it('should assign null when no GENETIC_READS column exists', () => {
        const completeCaseType = createMockCompleteCaseType();

        const readsFile = createMockFile('reads.fq');
        const fileList = createMockFileList([readsFile]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        expect(result).toEqual([
          {
            file: readsFile,
            caseTypeCol: null,
          },
        ]);
      });

      it('should assign null when multiple GENETIC_READS columns exist', () => {
        const col1 = createMockCol('col-1', ColType.GENETIC_READS);
        const col2 = createMockCol('col-2', ColType.GENETIC_READS);
        const caseTypeCol1 = createMockCaseTypeCol('ctc-1', 'col-1', ColType.GENETIC_READS);
        const caseTypeCol2 = createMockCaseTypeCol('ctc-2', 'col-2', ColType.GENETIC_READS);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol1, caseTypeCol2], [col1, col2]);

        const readsFile = createMockFile('reads.fastq.gz');
        const fileList = createMockFileList([readsFile]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        expect(result).toEqual([
          {
            file: readsFile,
            caseTypeCol: null,
          },
        ]);
      });
    });

    describe('paired reads files', () => {
      it('should assign to paired FWD/REV columns when exactly one pair exists in same dimension', () => {
        const dim = createMockDim('dim-1');
        const colFwd = createMockCol('col-fwd', ColType.GENETIC_READS_FWD, 'dim-1');
        const colRev = createMockCol('col-rev', ColType.GENETIC_READS_REV, 'dim-1');
        const caseTypeColFwd = createMockCaseTypeCol('ctc-fwd', 'col-fwd', ColType.GENETIC_READS_FWD);
        const caseTypeColRev = createMockCaseTypeCol('ctc-rev', 'col-rev', ColType.GENETIC_READS_REV);
        const caseTypeDim = createMockCaseTypeDim('ctd-1', 'dim-1', ['ctc-fwd', 'ctc-rev']);
        const completeCaseType = createMockCompleteCaseType(
          [caseTypeColFwd, caseTypeColRev],
          [colFwd, colRev],
          [dim],
          [caseTypeDim],
        );

        const file1 = createMockFile('sample_1.fq');
        const file2 = createMockFile('sample_2.fq');
        const fileList = createMockFileList([file1, file2]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        // Files should be sorted by name, so sample_1.fq goes to FWD, sample_2.fq to REV
        expect(result).toEqual([
          { file: file1, caseTypeCol: caseTypeColFwd },
          { file: file2, caseTypeCol: caseTypeColRev },
        ]);
      });

      it('should assign null when no paired columns exist', () => {
        const completeCaseType = createMockCompleteCaseType();

        const file1 = createMockFile('reads1.fastq');
        const file2 = createMockFile('reads2.fastq');
        const fileList = createMockFileList([file1, file2]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        expect(result).toEqual([
          { file: file1, caseTypeCol: null },
          { file: file2, caseTypeCol: null },
        ]);
      });

      it('should assign null when paired columns exist but not in same dimension', () => {
        // Create FWD/REV columns in different dimensions - they won't be paired
        const dim1 = createMockDim('dim-1');
        const dim2 = createMockDim('dim-2');
        const colFwd = createMockCol('col-fwd', ColType.GENETIC_READS_FWD, 'dim-1');
        const colRev = createMockCol('col-rev', ColType.GENETIC_READS_REV, 'dim-2');
        const caseTypeColFwd = createMockCaseTypeCol('ctc-fwd', 'col-fwd', ColType.GENETIC_READS_FWD);
        const caseTypeColRev = createMockCaseTypeCol('ctc-rev', 'col-rev', ColType.GENETIC_READS_REV);
        const caseTypeDim1 = createMockCaseTypeDim('ctd-1', 'dim-1', ['ctc-fwd']);
        const caseTypeDim2 = createMockCaseTypeDim('ctd-2', 'dim-2', ['ctc-rev']);
        const completeCaseType = createMockCompleteCaseType(
          [caseTypeColFwd, caseTypeColRev],
          [colFwd, colRev],
          [dim1, dim2],
          [caseTypeDim1, caseTypeDim2],
        );

        const file1 = createMockFile('reads1.fastq');
        const file2 = createMockFile('reads2.fastq');
        const fileList = createMockFileList([file1, file2]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        // Columns exist but not in same dimension, so no pairing possible
        expect(result).toEqual([
          { file: file1, caseTypeCol: null },
          { file: file2, caseTypeCol: null },
        ]);
      });

      it('should assign null when multiple paired columns exist', () => {
        // Create two pairs of FWD/REV columns in different dimensions
        const dim1 = createMockDim('dim-1');
        const dim2 = createMockDim('dim-2');
        const colFwd1 = createMockCol('col-fwd1', ColType.GENETIC_READS_FWD, 'dim-1');
        const colRev1 = createMockCol('col-rev1', ColType.GENETIC_READS_REV, 'dim-1');
        const colFwd2 = createMockCol('col-fwd2', ColType.GENETIC_READS_FWD, 'dim-2');
        const colRev2 = createMockCol('col-rev2', ColType.GENETIC_READS_REV, 'dim-2');
        const caseTypeColFwd1 = createMockCaseTypeCol('ctc-fwd1', 'col-fwd1', ColType.GENETIC_READS_FWD);
        const caseTypeColRev1 = createMockCaseTypeCol('ctc-rev1', 'col-rev1', ColType.GENETIC_READS_REV);
        const caseTypeColFwd2 = createMockCaseTypeCol('ctc-fwd2', 'col-fwd2', ColType.GENETIC_READS_FWD);
        const caseTypeColRev2 = createMockCaseTypeCol('ctc-rev2', 'col-rev2', ColType.GENETIC_READS_REV);
        const caseTypeDim1 = createMockCaseTypeDim('ctd-1', 'dim-1', ['ctc-fwd1', 'ctc-rev1']);
        const caseTypeDim2 = createMockCaseTypeDim('ctd-2', 'dim-2', ['ctc-fwd2', 'ctc-rev2']);
        const completeCaseType = createMockCompleteCaseType(
          [caseTypeColFwd1, caseTypeColRev1, caseTypeColFwd2, caseTypeColRev2],
          [colFwd1, colRev1, colFwd2, colRev2],
          [dim1, dim2],
          [caseTypeDim1, caseTypeDim2],
        );

        const file1 = createMockFile('reads1.fastq');
        const file2 = createMockFile('reads2.fastq');
        const fileList = createMockFileList([file1, file2]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        // Multiple pairs exist, so assignment is ambiguous - should assign null
        expect(result).toEqual([
          { file: file1, caseTypeCol: null },
          { file: file2, caseTypeCol: null },
        ]);
      });

      it('should handle filename-based matching failure gracefully', () => {
        // Create paired columns but with filenames that don't match the findUniqueCaseTypeColumnByFilename logic
        const dim = createMockDim('dim-1');
        const colFwd = createMockCol('col-fwd', ColType.GENETIC_READS_FWD, 'dim-1');
        const colRev = createMockCol('col-rev', ColType.GENETIC_READS_REV, 'dim-1');
        const caseTypeColFwd = createMockCaseTypeCol('ctc-fwd', 'col-fwd', ColType.GENETIC_READS_FWD);
        const caseTypeColRev = createMockCaseTypeCol('ctc-rev', 'col-rev', ColType.GENETIC_READS_REV);
        const caseTypeDim = createMockCaseTypeDim('ctd-1', 'dim-1', ['ctc-fwd', 'ctc-rev']);
        const completeCaseType = createMockCompleteCaseType(
          [caseTypeColFwd, caseTypeColRev],
          [colFwd, colRev],
          [dim],
          [caseTypeDim],
        );

        // Use generic filenames that won't match specific column names
        const file1 = createMockFile('sample1.fastq');
        const file2 = createMockFile('sample2.fastq');
        const fileList = createMockFileList([file1, file2]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        // Filename matching should fail, but paired column assignment should work
        expect(result).toEqual([
          { file: file1, caseTypeCol: caseTypeColFwd }, // sample1.fastq (first alphabetically)
          { file: file2, caseTypeCol: caseTypeColRev }, // sample2.fastq (second alphabetically)
        ]);
      });

      it('should handle files in different order', () => {
        const dim = createMockDim('dim-1');
        const colFwd = createMockCol('col-fwd', ColType.GENETIC_READS_FWD, 'dim-1');
        const colRev = createMockCol('col-rev', ColType.GENETIC_READS_REV, 'dim-1');
        const caseTypeColFwd = createMockCaseTypeCol('ctc-fwd', 'col-fwd', ColType.GENETIC_READS_FWD);
        const caseTypeColRev = createMockCaseTypeCol('ctc-rev', 'col-rev', ColType.GENETIC_READS_REV);
        const caseTypeDim = createMockCaseTypeDim('ctd-1', 'dim-1', ['ctc-fwd', 'ctc-rev']);
        const completeCaseType = createMockCompleteCaseType(
          [caseTypeColFwd, caseTypeColRev],
          [colFwd, colRev],
          [dim],
          [caseTypeDim],
        );

        const file1 = createMockFile('z_sample.fastq');
        const file2 = createMockFile('a_sample.fastq');
        const fileList = createMockFileList([file1, file2]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        // Files should be sorted alphabetically: a_sample.fastq -> FWD, z_sample.fastq -> REV
        expect(result).toEqual([
          { file: file2, caseTypeCol: caseTypeColFwd }, // a_sample.fastq
          { file: file1, caseTypeCol: caseTypeColRev }, // z_sample.fastq
        ]);
      });
    });

    describe('multiple reads files (>2)', () => {
      it('should assign null to all files when more than 2 reads files', () => {
        const completeCaseType = createMockCompleteCaseType();

        const file1 = createMockFile('reads1.fq');
        const file2 = createMockFile('reads2.fq');
        const file3 = createMockFile('reads3.fq');
        const fileList = createMockFileList([file1, file2, file3]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        expect(result).toEqual([
          { file: file1, caseTypeCol: null },
          { file: file2, caseTypeCol: null },
          { file: file3, caseTypeCol: null },
        ]);
      });
    });

    describe('mixed file types', () => {
      it('should handle combination of genome, reads, and unsupported files', () => {
        const genomeCol = createMockCol('col-genome', ColType.GENETIC_SEQUENCE);
        const readsCol = createMockCol('col-reads', ColType.GENETIC_READS);
        const genomeCtc = createMockCaseTypeCol('ctc-genome', 'col-genome', ColType.GENETIC_SEQUENCE);
        const readsCtc = createMockCaseTypeCol('ctc-reads', 'col-reads', ColType.GENETIC_READS);
        const completeCaseType = createMockCompleteCaseType([genomeCtc, readsCtc], [genomeCol, readsCol]);

        const genomeFile = createMockFile('genome.fasta');
        const readsFile = createMockFile('reads.fastq');
        const unsupportedFile = createMockFile('document.txt');
        const fileList = createMockFileList([genomeFile, readsFile, unsupportedFile]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        expect(result).toEqual([
          { file: unsupportedFile, caseTypeCol: null }, // Unsupported files are processed first
          { file: genomeFile, caseTypeCol: genomeCtc },
          { file: readsFile, caseTypeCol: readsCtc },
        ]);
      });

      it('should handle genome files with paired reads files', () => {
        const dim = createMockDim('dim-1');
        const genomeCol = createMockCol('col-genome', ColType.GENETIC_SEQUENCE);
        const fwdCol = createMockCol('col-fwd', ColType.GENETIC_READS_FWD, 'dim-1');
        const revCol = createMockCol('col-rev', ColType.GENETIC_READS_REV, 'dim-1');
        const genomeCtc = createMockCaseTypeCol('ctc-genome', 'col-genome', ColType.GENETIC_SEQUENCE);
        const fwdCtc = createMockCaseTypeCol('ctc-fwd', 'col-fwd', ColType.GENETIC_READS_FWD);
        const revCtc = createMockCaseTypeCol('ctc-rev', 'col-rev', ColType.GENETIC_READS_REV);
        const caseTypeDim = createMockCaseTypeDim('ctd-1', 'dim-1', ['ctc-fwd', 'ctc-rev']);
        const completeCaseType = createMockCompleteCaseType(
          [genomeCtc, fwdCtc, revCtc],
          [genomeCol, fwdCol, revCol],
          [dim],
          [caseTypeDim],
        );

        const genomeFile = createMockFile('assembly.fa');
        const reads1File = createMockFile('reads_1.fastq');
        const reads2File = createMockFile('reads_2.fastq');
        const fileList = createMockFileList([genomeFile, reads1File, reads2File]);

        const result = EpiUploadUtil.assignFilesToColumns(completeCaseType, fileList);

        expect(result).toEqual([
          { file: genomeFile, caseTypeCol: genomeCtc },
          { file: reads1File, caseTypeCol: fwdCtc },
          { file: reads2File, caseTypeCol: revCtc },
        ]);
      });
    });

    describe('findUniqueCaseTypeColumnByFilename', () => {
      it('should return null when no matches are found', () => {
        const completeCaseType = createMockCompleteCaseType();

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          'no_matching_filename.fasta',
          [ColType.GENETIC_SEQUENCE],
        );

        expect(result).toBeNull();
      });

      it('should match basic filename without extension', () => {
        const col = createMockCol('sample_name', ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'sample_name', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          'sample_name.fasta',
          [ColType.GENETIC_SEQUENCE],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should match filename with underscores converted to spaces', () => {
        const col = createMockCol('sample name', ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'sample name', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          'sample_name.fa',
          [ColType.GENETIC_SEQUENCE],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should match filename with dashes and dots converted to spaces', () => {
        const col = createMockCol('sample name test', ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'sample name test', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          'sample-name.test.fasta.gz',
          [ColType.GENETIC_SEQUENCE],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should match UUID in filename (hyphenated format)', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        const col = createMockCol(uuid, ColType.GENETIC_READS);
        const caseTypeCol = createMockCaseTypeCol('ctc-uuid', uuid, ColType.GENETIC_READS);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          `sample_${uuid}_data.fastq`,
          [ColType.GENETIC_READS],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should match UUID without hyphens and convert to hyphenated format', () => {
        const uuidWithHyphens = '550e8400-e29b-41d4-a716-446655440000';
        const uuidWithoutHyphens = '550e8400e29b41d4a716446655440000';
        const col = createMockCol(uuidWithHyphens, ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-uuid', uuidWithHyphens, ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          `prefix_${uuidWithoutHyphens}_suffix.fa`,
          [ColType.GENETIC_SEQUENCE],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should match UUID without hyphens using original format', () => {
        const uuidWithoutHyphens = '550e8400e29b41d4a716446655440000';
        const col = createMockCol(uuidWithoutHyphens, ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-uuid', uuidWithoutHyphens, ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          `sample_${uuidWithoutHyphens}.fasta.gz`,
          [ColType.GENETIC_SEQUENCE],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should match ULID in filename', () => {
        const ulid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
        const col = createMockCol(ulid.toLowerCase(), ColType.GENETIC_READS_FWD);
        const caseTypeCol = createMockCaseTypeCol('ctc-ulid', ulid.toLowerCase(), ColType.GENETIC_READS_FWD);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          `data_${ulid}_sample.fq`,
          [ColType.GENETIC_READS_FWD],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should handle multiple extensions correctly', () => {
        const col = createMockCol('sample', ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'sample', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        // Test all supported extension combinations
        const extensions = ['.fasta.gz', '.fa.gz', '.fastq.gz', '.fq.gz', '.fasta', '.fa', '.fastq', '.fq'];

        extensions.forEach(ext => {
          const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
            completeCaseType,
            `sample${ext}`,
            [ColType.GENETIC_SEQUENCE],
          );

          expect(result).toBe(caseTypeCol);
        });
      });

      it('should only return columns of matching type', () => {
        const col = createMockCol('sample', ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'sample', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        // Should not match when looking for different column type
        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          'sample.fasta',
          [ColType.GENETIC_READS],
        );

        expect(result).toBeNull();
      });

      it('should match when column type is in the allowed list', () => {
        const col = createMockCol('sample', ColType.GENETIC_READS_FWD);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'sample', ColType.GENETIC_READS_FWD);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          'sample.fastq',
          [ColType.GENETIC_READS_FWD, ColType.GENETIC_READS_REV],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should handle case insensitive matching', () => {
        const col = createMockCol('sample_name', ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'sample_name', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          'SAMPLE_NAME.FASTA',
          [ColType.GENETIC_SEQUENCE],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should handle mixed case UUIDs', () => {
        const uuid = '550E8400-E29B-41D4-A716-446655440000';
        const col = createMockCol(uuid.toLowerCase(), ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-uuid', uuid.toLowerCase(), ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          `Sample_${uuid}_Data.FA`,
          [ColType.GENETIC_SEQUENCE],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should handle multiple UUIDs and match the first valid one', () => {
        const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
        const uuid2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

        // Only create a column for the second UUID
        const col = createMockCol(uuid2, ColType.GENETIC_READS);
        const caseTypeCol = createMockCaseTypeCol('ctc-uuid2', uuid2, ColType.GENETIC_READS);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          `${uuid1}_${uuid2}.fastq`,
          [ColType.GENETIC_READS],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should handle multiple ULIDs and match the first valid one', () => {
        const ulid1 = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
        const ulid2 = '01BX5ZZKBKACTAV9WEVGEMMVRY';

        // Only create a column for the second ULID
        const col = createMockCol(ulid2.toLowerCase(), ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-ulid2', ulid2.toLowerCase(), ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          `${ulid1}_${ulid2}.fasta`,
          [ColType.GENETIC_SEQUENCE],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should return null when EpiCaseTypeUtil finds no matching column', () => {
        // Create a case type column but with a different col_id
        const col = createMockCol('different-col-id', ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'different-col-id', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          'sample.fasta',
          [ColType.GENETIC_SEQUENCE],
        );

        expect(result).toBeNull();
      });

      it('should return null when EpiCaseTypeUtil finds column but wrong type', () => {
        const col = createMockCol('sample', ColType.GENETIC_SEQUENCE);
        const caseTypeCol = createMockCaseTypeCol('ctc-1', 'sample', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          'sample.fasta',
          [ColType.GENETIC_READS], // Looking for wrong type
        );

        expect(result).toBeNull();
      });

      it('should handle complex filename with all identifier types', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        const ulid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

        // Create column matching the ULID (which comes later in processing)
        const col = createMockCol(ulid.toLowerCase(), ColType.GENETIC_READS_REV);
        const caseTypeCol = createMockCaseTypeCol('ctc-ulid', ulid.toLowerCase(), ColType.GENETIC_READS_REV);
        const completeCaseType = createMockCompleteCaseType([caseTypeCol], [col]);

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          `complex_file_${uuid}_with_${ulid}_identifiers.fq.gz`,
          [ColType.GENETIC_READS_REV],
        );

        expect(result).toBe(caseTypeCol);
      });

      it('should demonstrate processing order - filename matches before UUID extraction', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';

        // Create two columns - one matching filename, one matching UUID
        const nameCol = createMockCol(`sample_data_${uuid}`, ColType.GENETIC_SEQUENCE);
        const uuidCol = createMockCol(uuid, ColType.GENETIC_SEQUENCE);
        const nameCaseTypeCol = createMockCaseTypeCol('ctc-name', `sample_data_${uuid}`, ColType.GENETIC_SEQUENCE);
        const uuidCaseTypeCol = createMockCaseTypeCol('ctc-uuid', uuid, ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType(
          [nameCaseTypeCol, uuidCaseTypeCol],
          [nameCol, uuidCol],
        );

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          `sample_data_${uuid}.fasta`,
          [ColType.GENETIC_SEQUENCE],
        );

        // Full filename match is processed first, before UUID extraction
        expect(result).toBe(nameCaseTypeCol);
      });

      it('should prioritize exact filename match when no UUIDs/ULIDs present', () => {
        // Create columns for both exact match and space-converted match
        const exactCol = createMockCol('sample_data_file', ColType.GENETIC_SEQUENCE);
        const spaceCol = createMockCol('sample data file', ColType.GENETIC_SEQUENCE);
        const exactCaseTypeCol = createMockCaseTypeCol('ctc-exact', 'sample_data_file', ColType.GENETIC_SEQUENCE);
        const spaceCaseTypeCol = createMockCaseTypeCol('ctc-space', 'sample data file', ColType.GENETIC_SEQUENCE);
        const completeCaseType = createMockCompleteCaseType(
          [exactCaseTypeCol, spaceCaseTypeCol],
          [exactCol, spaceCol],
        );

        const result = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(
          completeCaseType,
          'sample_data_file.fasta',
          [ColType.GENETIC_SEQUENCE],
        );

        // Should match the exact filename first (processed before space conversion)
        expect(result).toBe(exactCaseTypeCol);
      });
    });
  });
});
