import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCaseTypeAccessAbac,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { renderComponent } from '../../../test/lib';

import { CaseContentForm } from './CaseContentForm';

const FORM_ID = 'case-content-form';
const SUBMIT_TEST_ID = 'CaseContentForm-submit';

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  const dims: CaseDbDim[] = [
    { case_type_id: 'case-type-1', code: 'time', id: 'dim-time', label: 'Time', rank: 1, ref_dim_id: 'ref-dim-time' },
    { case_type_id: 'case-type-1', code: 'other', id: 'dim-other', label: 'Other', rank: 2, ref_dim_id: 'ref-dim-other' },
  ];
  const refDims: CaseDbRefDim[] = [
    { code: 'time', dim_type: CaseDbDimType.TIME, id: 'ref-dim-time', label: 'Time' },
    { code: 'other', dim_type: CaseDbDimType.OTHER, id: 'ref-dim-other', label: 'Other' },
  ];
  const columnSpecifications: { col: CaseDbCol; dimId: string }[] = [
    { col: { case_type_id: 'case-type-1', code: 'time-text', dim_id: 'dim-time', id: 'col-time-text', label: 'Time text', rank: 1, ref_col_id: 'ref-col-time-text' }, dimId: 'dim-time' },
    { col: { case_type_id: 'case-type-1', code: 'text', dim_id: 'dim-other', id: 'col-text', label: 'Text', rank: 2, ref_col_id: 'ref-col-text' }, dimId: 'dim-other' },
    { col: { case_type_id: 'case-type-1', code: 'readonly', dim_id: 'dim-other', id: 'col-readonly', label: 'Read only', rank: 3, ref_col_id: 'ref-col-readonly' }, dimId: 'dim-other' },
  ];
  const refCols: Record<string, CaseDbRefCol> = {
    'ref-col-readonly': { code: 'readonly', col_type: CaseDbColType.TEXT, ref_dim_id: 'ref-dim-other' },
    'ref-col-text': { code: 'text', col_type: CaseDbColType.TEXT, ref_dim_id: 'ref-dim-other' },
    'ref-col-time-text': { code: 'time-text', col_type: CaseDbColType.TEXT, ref_dim_id: 'ref-dim-time' },
  };
  const colIds = columnSpecifications.map(({ col }) => col.id);
  const access: CaseDbCaseTypeAccessAbac = {
    add_case: false,
    add_case_set: false,
    case_type_id: 'case-type-1',
    data_collection_id: 'data-collection-1',
    is_private: false,
    read_case_set: false,
    read_col_ids: [],
    remove_case: false,
    remove_case_set: false,
    write_case_set: false,
    write_col_ids: colIds.filter(colId => colId !== 'col-readonly'),
  };

  return {
    case_date_dim_id: null,
    case_type_access_abacs: { 'data-collection-1': access },
    case_type_share_abacs: {},
    cols: Object.fromEntries(columnSpecifications.map(({ col }) => [col.id, col])),
    dims: Object.fromEntries(dims.map(dim => [dim.id, dim])),
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: 'case-type-1',
    name: 'Case type one',
    ordered_col_ids: colIds,
    ordered_col_ids_by_dim: {
      'dim-other': ['col-text', 'col-readonly'],
      'dim-time': ['col-time-text'],
    },
    ordered_dim_ids: dims.map(dim => dim.id),
    ref_cols: refCols,
    ref_dims: Object.fromEntries(refDims.map(refDim => [refDim.id, refDim])),
    tree_algorithms: {},
    user_id: null,
  };
};

const createContent = (): CaseDbCase['content'] => ({
  'col-readonly': 'locked',
  'col-text': 'hello',
  'col-time-text': 'January',
});

const renderCaseContentForm = async ({ caseId, onSubmit }: { caseId: string; onSubmit: (caseId: string, content: CaseDbCase['content']) => void }) => {
  const completeCaseType = createCompleteCaseType();
  const renderTree = (currentCaseId: string) => (
    <>
      <CaseContentForm
        caseContent={createContent()}
        caseId={currentCaseId}
        completeCaseType={completeCaseType}
        enabledColIds={['col-text', 'col-time-text']}
        formId={FORM_ID}
        onSubmit={onSubmit}
      />
      <button
        form={FORM_ID}
        type={'submit'}
        {...TestIdUtil.createAttributes(SUBMIT_TEST_ID)}
      >
        {'Submit'}
      </button>
    </>
  );
  const screen = await renderComponent(renderTree(caseId));
  return { renderTree, screen };
};

describe('CaseContentForm', () => {
  it('renders the case content values and clears a dimension group on request', async () => {
    const onSubmit = vi.fn();
    const { screen } = await renderCaseContentForm({ caseId: 'case-1', onSubmit });

    await expect.element(screen.getByRole('textbox', { name: 'Time text' })).toHaveValue('January');
    await expect.element(screen.getByRole('textbox', { name: 'Text' })).toHaveValue('hello');

    await screen.getByRole('button', { name: 'Clear all Time fields' }).click();

    await expect.element(screen.getByRole('textbox', { name: 'Time text' })).toHaveValue('');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the string values of the form for a case with an id', async () => {
    const onSubmit = vi.fn();
    const { screen } = await renderCaseContentForm({ caseId: 'case-1', onSubmit });

    await screen.getByTestId(SUBMIT_TEST_ID).click();

    await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
    expect(onSubmit).toHaveBeenCalledWith('case-1', expect.objectContaining({
      'col-text': 'hello',
      'col-time-text': 'January',
    }));
  });

  it('does not submit when there is no case id', async () => {
    const onSubmit = vi.fn();
    const { renderTree, screen } = await renderCaseContentForm({ caseId: '', onSubmit });

    await screen.getByTestId(SUBMIT_TEST_ID).click();
    await screen.rerender(renderTree('case-1'));
    await screen.getByTestId(SUBMIT_TEST_ID).click();

    await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
    expect(onSubmit.mock.calls[0]?.[0]).toBe('case-1');
  });
});
