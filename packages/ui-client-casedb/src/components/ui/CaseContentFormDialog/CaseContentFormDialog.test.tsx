import { createRef } from 'react';
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

import { renderComponent } from '../../../test/lib';

import type { CaseContentFormDialogRefMethods } from './CaseContentFormDialog';
import { CaseContentFormDialog } from './CaseContentFormDialog';

const FORM_ID = 'case-content-form-dialog';
const CASE_TYPE_ID = 'case-type-1';
const DATA_COLLECTION_ID = 'data-collection-1';

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  const dim: CaseDbDim = { case_type_id: CASE_TYPE_ID, code: 'other', id: 'dim-other', label: 'Other', rank: 1, ref_dim_id: 'ref-dim-other' };
  const refDims: Record<string, CaseDbRefDim> = {
    'ref-dim-other': { code: 'other', dim_type: CaseDbDimType.OTHER, id: 'ref-dim-other', label: 'Other' },
  };
  const col = { case_type_id: CASE_TYPE_ID, code: 'text', dim_id: dim.id, id: 'col-text', label: 'Text', rank: 1, ref_col_id: 'ref-col-text' } as CaseDbCol;
  const refCol: CaseDbRefCol = { code: 'text', col_type: CaseDbColType.TEXT, ref_dim_id: 'ref-dim-other' };
  const access: CaseDbCaseTypeAccessAbac = {
    add_case: false,
    add_case_set: false,
    case_type_id: CASE_TYPE_ID,
    data_collection_id: DATA_COLLECTION_ID,
    is_private: false,
    read_case_set: false,
    read_col_ids: [],
    remove_case: false,
    remove_case_set: false,
    write_case_set: false,
    write_col_ids: [col.id],
  };

  return {
    case_date_dim_id: null,
    case_type_access_abacs: { [DATA_COLLECTION_ID]: access },
    case_type_share_abacs: {},
    cols: { [col.id]: col },
    dims: { [dim.id]: dim },
    etiological_agents: {},
    etiologies: {},
    genetic_distance_protocols: {},
    id: CASE_TYPE_ID,
    name: 'Case type one',
    ordered_col_ids: [col.id],
    ordered_col_ids_by_dim: { [dim.id]: [col.id] },
    ordered_dim_ids: [dim.id],
    ref_cols: { 'ref-col-text': refCol },
    ref_dims: refDims,
    tree_algorithms: {},
    user_id: null,
  };
};

const renderDialog = async (onSubmit: (caseId: string, content: CaseDbCase['content']) => void) => {
  const ref = createRef<CaseContentFormDialogRefMethods>();
  const screen = await renderComponent(
    <CaseContentFormDialog
      onSubmit={onSubmit}
      ref={ref}
    />,
  );
  ref.current?.open({
    caseContent: { 'col-text': 'hello' },
    caseId: 'case-1',
    completeCaseType: createCompleteCaseType(),
    enabledColIds: ['col-text'],
    formId: FORM_ID,
  });
  return { ref, screen };
};

describe('CaseContentFormDialog', () => {
  it('shows the edit title, the form values and the close and save actions', async () => {
    const onSubmit = vi.fn();
    const { screen } = await renderDialog(onSubmit);

    await expect.element(screen.getByText('Edit case')).toBeInTheDocument();
    await expect.element(screen.getByRole('textbox', { name: 'Text' })).toHaveValue('hello');
    await expect.element(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('submits the form through the save action and closes the dialog', async () => {
    const onSubmit = vi.fn();
    const { screen } = await renderDialog(onSubmit);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
    expect(onSubmit).toHaveBeenCalledWith('case-1', expect.objectContaining({ 'col-text': 'hello' }));
    await expect.element(screen.getByText('Edit case')).not.toBeInTheDocument();
  });

  it('closes the dialog without submitting when the close action is clicked', async () => {
    const onSubmit = vi.fn();
    const { screen } = await renderDialog(onSubmit);

    await screen.getByRole('button', { name: 'Close' }).click();

    await expect.element(screen.getByText('Edit case')).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
