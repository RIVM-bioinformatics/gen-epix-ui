import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';

import { renderComponent } from '../../../test/lib';

import { CaseTypeInfoValues } from './CaseTypeInfoValues';

const CASE_TYPE_ID = 'case-type-1';

const createCol = (id: string, code: string, dimId: string, refColId: string): CaseDbCol => ({
  case_type_id: CASE_TYPE_ID,
  code,
  dim_id: dimId,
  id,
  label: code,
  rank: 1,
  ref_col_id: refColId,
});

const createDim = (id: string, code: string, refDimId: string, occurrence?: number): CaseDbDim => ({
  case_type_id: CASE_TYPE_ID,
  code,
  description: `${code} description`,
  id,
  label: code,
  occurrence,
  rank: 1,
  ref_dim_id: refDimId,
});

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  const refDims: Record<string, CaseDbRefDim> = {
    'ref-dim-gd': { code: 'gd', dim_type: CaseDbDimType.OTHER, id: 'ref-dim-gd', label: 'GD' },
    'ref-dim-mixed': { code: 'mixed', dim_type: CaseDbDimType.OTHER, id: 'ref-dim-mixed', label: 'Mixed' },
    'ref-dim-text': { code: 'text', dim_type: CaseDbDimType.TEXT, id: 'ref-dim-text', label: 'Text' },
  };
  const refCols: Record<string, CaseDbRefCol> = {
    'ref-col-gd': { code: 'gd', col_type: CaseDbColType.GENETIC_DISTANCE, ref_dim_id: 'ref-dim-gd' },
    'ref-col-text': { code: 'text', col_type: CaseDbColType.TEXT, ref_dim_id: 'ref-dim-text' },
  };
  const dimText = createDim('dim-text', 'text', 'ref-dim-text');
  const dimMixed = createDim('dim-mixed', 'mixed', 'ref-dim-mixed', 1);
  const dimGd = createDim('dim-gd', 'gd', 'ref-dim-gd');
  const colText = createCol('col-text', 'col-text', dimText.id, 'ref-col-text');
  const colMixedText = createCol('col-mixed-text', 'col-mixed-text', dimMixed.id, 'ref-col-text');
  const colMixedGd = createCol('col-mixed-gd', 'col-mixed-gd', dimMixed.id, 'ref-col-gd');
  const colGd = createCol('col-gd', 'col-gd', dimGd.id, 'ref-col-gd');

  return {
    case_date_dim_id: null,
    case_type_access_abacs: {},
    case_type_share_abacs: {},
    cols: {
      [colGd.id]: colGd,
      [colMixedGd.id]: colMixedGd,
      [colMixedText.id]: colMixedText,
      [colText.id]: colText,
    },
    description: 'description',
    dims: {
      [dimGd.id]: dimGd,
      [dimMixed.id]: dimMixed,
      [dimText.id]: dimText,
    },
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: CASE_TYPE_ID,
    name: 'Case type one',
    ordered_col_ids: [colText.id, colMixedText.id, colMixedGd.id, colGd.id],
    ordered_col_ids_by_dim: {
      [dimGd.id]: [colGd.id],
      [dimMixed.id]: [colMixedText.id, colMixedGd.id],
      [dimText.id]: [colText.id],
    },
    ordered_dim_ids: [dimText.id, dimGd.id, dimMixed.id],
    ref_cols: refCols,
    ref_dims: refDims,
    tree_algorithms: {},
    user_id: null,
  };
};

describe('CaseTypeInfoValues', () => {
  it('renders an accordion per dimension in order, keeping dimensions with non-genetic-distance columns', async () => {
    const screen = await renderComponent(
      <CaseTypeInfoValues completeCaseType={createCompleteCaseType()} />,
    );

    await expect.element(screen.getByRole('button', { exact: true, name: 'text' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { exact: true, name: 'mixed' })).toBeInTheDocument();
    expect(document.getElementById('panel-text-0-header')).not.toBeNull();
    expect(document.getElementById('panel-mixed-1-header')).not.toBeNull();
    expect(document.querySelectorAll('[id$="-header"]')).toHaveLength(2);
  });

  it('hides dimensions of type OTHER that only contain genetic distance columns', async () => {
    const screen = await renderComponent(
      <CaseTypeInfoValues completeCaseType={createCompleteCaseType()} />,
    );

    await expect.element(screen.getByRole('button', { exact: true, name: 'mixed' })).toBeInTheDocument();
    expect(document.getElementById('panel-gd-0-header')).toBeNull();
  });
});
