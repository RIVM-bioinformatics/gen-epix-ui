import type { StoreApi } from 'zustand';
import { container } from 'tsyringe';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  CaseDbCaseUploadResult,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbDataIssueType } from '@gen-epix/api-casedb';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { AuthorizationService } from '@gen-epix/ui-client-common/classes/services/AuthorizationService';
import type { TableStore } from '@gen-epix/ui-client-common/stores/tableStore';
import {
  TableStoreContextProvider,
  createTableStore,
} from '@gen-epix/ui-client-common/stores/tableStore';
import type { CommonDbUser } from '@gen-epix/api-commondb';

import {
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import { UploadCaseResultTable } from './UploadCaseResultTable';
import type { UploadCaseResultTableProps } from './UploadCaseResultTable';

const OTHER_COL_ID = 'col-other';

const USER: CommonDbUser = {
  email: 'jane@example.test',
  id: '00000000-0000-4000-8000-000000000101',
  is_active: true,
  key: 'jdoe',
  name: 'Jane Doe',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

const createCompleteCaseTypeWithTwoCols = (): CaseDbCompleteCaseType => {
  const base = createCompleteCaseType();
  const textCol = base.cols[COMPLETE_CASE_TYPE_TEXT_COL_ID];
  const otherCol: CaseDbCol = {
    ...textCol,
    code: 'other',
    id: OTHER_COL_ID,
    label: 'Other col',
    rank: 2,
  };
  const baseAccess = Object.values(base.case_type_access_abacs)[0];
  return createCompleteCaseType({
    case_type_access_abacs: {
      [baseAccess.data_collection_id]: {
        ...baseAccess,
        write_col_ids: [textCol.id, otherCol.id],
      },
    },
    cols: { [textCol.id]: textCol, [otherCol.id]: otherCol },
    ordered_col_ids: [textCol.id, otherCol.id],
    ordered_col_ids_by_dim: { 'dim-other': [textCol.id, otherCol.id] },
  });
};

const COMPLETE_CASE_TYPE = createCompleteCaseTypeWithTwoCols();

const CASE_RESULTS: CaseDbCaseUploadResult[] = [
  {
    data_issues: [
      {
        code: 'invalid_text',
        col_id: COMPLETE_CASE_TYPE_TEXT_COL_ID,
        data_issue_type: CaseDbDataIssueType.INVALID,
        message: 'Text is invalid',
        original_value: 'Alph',
        updated_value: null,
      },
    ],
    id: 'case-1',
    is_new: false,
    validated_content: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: 'Alpha', [OTHER_COL_ID]: 'one' },
  },
  {
    data_issues: [
      {
        code: 'missing_text',
        col_id: COMPLETE_CASE_TYPE_TEXT_COL_ID,
        data_issue_type: CaseDbDataIssueType.MISSING,
        message: 'Text is missing',
        original_value: null,
        updated_value: null,
      },
      {
        code: 'missing_other',
        col_id: OTHER_COL_ID,
        data_issue_type: CaseDbDataIssueType.MISSING,
        message: 'Other is missing',
        original_value: null,
        updated_value: null,
      },
    ],
    id: null,
    is_new: true,
    validated_content: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: '', [OTHER_COL_ID]: 'two' },
  },
  {
    data_issues: [
      {
        code: 'transformed_text',
        col_id: COMPLETE_CASE_TYPE_TEXT_COL_ID,
        data_issue_type: CaseDbDataIssueType.TRANSFORMED,
        message: 'Text was transformed',
        original_value: 'gamma',
        updated_value: 'Gamma',
      },
      {
        code: 'transformed_other',
        col_id: OTHER_COL_ID,
        data_issue_type: CaseDbDataIssueType.TRANSFORMED,
        message: 'Other was transformed',
        original_value: 'three',
        updated_value: 'three',
      },
      {
        code: 'derived_other',
        col_id: OTHER_COL_ID,
        data_issue_type: CaseDbDataIssueType.DERIVED,
        message: 'Other was derived',
        original_value: 'three',
        updated_value: 'three',
      },
    ],
    id: 'case-3',
    is_new: false,
    validated_content: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: 'Gamma', [OTHER_COL_ID]: 'three' },
  },
];

const RIGHTS_COL_MAP: Record<string, string[]> = {
  [COMPLETE_CASE_TYPE_TEXT_COL_ID]: ['case-1', 'case-3'],
  [OTHER_COL_ID]: ['case-1', 'case-2', 'case-3'],
};

const mockTableApi = () => {
  container.resolve(AuthorizationService).user = USER;
  mockApiRequest('GET', `/v1/case_types/${COMPLETE_CASE_TYPE_ID}`, () => Response.json({ id: COMPLETE_CASE_TYPE_ID }));
};

const createProps = (overrides: Partial<UploadCaseResultTableProps> = {}, tableStore?: StoreApi<TableStore<CaseDbCaseUploadResult>>): UploadCaseResultTableProps => {
  return {
    caseRightsColMap: RIGHTS_COL_MAP,
    caseUploadResults: CASE_RESULTS,
    completeCaseType: COMPLETE_CASE_TYPE,
    getOriginalCellValue: vi.fn(() => 'orig'),
    onCaseContentEditSubmit: vi.fn(),
    onColContentEditSubmit: vi.fn(),
    tableStore: tableStore as StoreApi<TableStore<CaseDbCaseUploadResult>>,
    ...overrides,
  };
};

const renderUploadCaseResultTable = async (overrides: Partial<UploadCaseResultTableProps> = {}) => {
  const tableStore = createTableStore<CaseDbCaseUploadResult>({
    idSelectorCallback: (row) => row.id ?? `new-${row.validated_content?.[OTHER_COL_ID] ?? ''}`,
  });
  const props = createProps(overrides, tableStore);
  const screen = await renderComponent(
    <TableStoreContextProvider store={tableStore}>
      <div style={{ height: 600, width: 1200 }}>
        <UploadCaseResultTable {...props} />
      </div>
    </TableStoreContextProvider>,
  );
  return { props, screen, tableStore };
};

describe('UploadCaseResultTable', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render a row for each upload result with the column values', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable();

    await expect.element(screen.getByRole('cell', { name: 'Alph Alpha', exact: true })).toBeVisible();
    await expect.element(screen.getByText('two', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('cell', { name: 'gamma Gamma', exact: true })).toBeVisible();
    await expect.element(screen.getByText('case-1', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('case-3', { exact: true })).toBeVisible();
  });

  it('should render the original value struck through when it differs from the value', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable();

    await expect.element(screen.getByText('Alph', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('gamma', { exact: true })).toBeVisible();
  });

  it('should not render the original value when it equals the value', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable();

    await expect.element(screen.getByText('three', { exact: true })).toBeVisible();
    await expect.poll(() => document.querySelectorAll('s').length).toBe(2);
  });

  it('should render an issue icon with the error messages for invalid results', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable();

    await expect.element(screen.getByLabelText('Text: Text is invalid')).toBeVisible();
  });

  it('should render an add icon for new cases without an id', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable();

    await expect.element(screen.getByLabelText('This case does not have an ID and will be created')).toBeVisible();
  });

  it('should show the original value as the cell title for cells without an issue', async () => {
    mockTableApi();
    const { props, screen } = await renderUploadCaseResultTable();

    await expect.element(screen.getByTitle('one (original value: "orig")', { exact: true })).toBeVisible();
    expect(props.getOriginalCellValue).toHaveBeenCalled();
  });

  it('should fall back to an empty original value when the callback returns nothing', async () => {
    mockTableApi();
    const getOriginalCellValue = vi.fn(() => undefined as unknown as string);
    const { screen } = await renderUploadCaseResultTable({ getOriginalCellValue });

    await expect.element(screen.getByTitle('one (original value: "")', { exact: true })).toBeVisible();
  });

  it('should render the case id column only when some result has an id', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable();

    await expect.element(screen.getByText('case_id', { exact: true })).toBeVisible();
  });

  it('should not render the case id column when no result has an id', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable({
      caseUploadResults: [{ data_issues: [], id: null, validated_content: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: 'Delta' } }],
    });

    await expect.element(screen.getByText('Delta', { exact: true })).toBeVisible();
    await expect.poll(() => document.body.textContent?.includes('case_id')).toBe(false);
  });

  it('should list all messages of multiple issues in the case and cell tooltips', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable({
      caseUploadResults: [{
        data_issues: [
          {
            code: 'invalid_text',
            col_id: COMPLETE_CASE_TYPE_TEXT_COL_ID,
            data_issue_type: CaseDbDataIssueType.INVALID,
            message: 'Text is invalid',
            original_value: 'Del',
            updated_value: null,
          },
          {
            code: 'transformed_text',
            col_id: COMPLETE_CASE_TYPE_TEXT_COL_ID,
            data_issue_type: CaseDbDataIssueType.TRANSFORMED,
            message: 'Text was transformed',
            original_value: 'delta',
            updated_value: 'Delta',
          },
          {
            code: 'invalid_other',
            col_id: OTHER_COL_ID,
            data_issue_type: CaseDbDataIssueType.INVALID,
            message: 'Other is invalid',
            original_value: 'x',
            updated_value: null,
          },
        ],
        id: 'case-4',
        is_new: false,
        validated_content: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: 'Delta', [OTHER_COL_ID]: 'four' },
      }],
    });

    await expect.element(screen.getByLabelText('Text: Text is invalid, Other col: Other is invalid', { exact: true })).toBeVisible();

    await screen.getByRole('cell', { name: 'Del Delta', exact: true }).getByTestId('ErrorOutlinedIcon').hover();
    await expect.element(screen.getByRole('tooltip').getByText('Text: Text was transformed', { exact: true })).toBeVisible();
  });

  it('should render a row without validated content and without issues', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable({
      caseUploadResults: [{ data_issues: [], id: 'case-5', validated_content: undefined }],
    });

    await expect.element(screen.getByText('case-5', { exact: true })).toBeVisible();
  });

  it('should render no rows when there are no upload results', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable({ caseUploadResults: [] });

    await expect.poll(() => document.body.textContent?.includes('Alpha')).toBe(false);
    await expect.element(screen.getByText('case_id', { exact: true })).not.toBeInTheDocument();
  });

  it('should render no rows when the upload results are undefined', async () => {
    mockTableApi();
    await renderUploadCaseResultTable({ caseUploadResults: undefined });

    await expect.poll(() => document.body.textContent?.includes('Alpha')).toBe(false);
  });

  it('should open the edit values dialog with a rights warning when not all rows can be edited', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable();

    await screen.getByText('text', { exact: true }).hover();
    await screen.getByTitle('Edit values for Text (for selected rows)').click();

    await expect.element(screen.getByText('You do not have the necessary rights to edit all rows in this column.')).toBeVisible();
  });

  it('should open the edit values dialog without a rights warning when all rows can be edited', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable();

    await screen.getByText('other', { exact: true }).hover();
    await screen.getByTitle('Edit values for Other col (for selected rows)').click();

    await expect.element(screen.getByText('Edit values for Other col (for selected rows)', { exact: true })).toBeVisible();
    await expect.poll(() => document.body.textContent?.includes('You do not have the necessary rights')).toBe(false);
  });

  it('should not render the edit values icon for a column without rights entries', async () => {
    mockTableApi();
    const { screen } = await renderUploadCaseResultTable({ caseRightsColMap: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: ['case-1'] } });

    await screen.getByText('other', { exact: true }).hover();
    await expect.poll(() => screen.getByTitle('Edit values for Other col (for selected rows)').query()).toBeNull();
  });

  it('should submit edited column values for the cases with rights to the column', async () => {
    mockTableApi();
    const { props, screen } = await renderUploadCaseResultTable();

    await screen.getByText('other', { exact: true }).hover();
    await screen.getByTitle('Edit values for Other col (for selected rows)').click();
    await screen.getByRole('textbox', { name: 'Other col' }).fill('updated');
    await screen.getByTestId('UploadEditColumnValuesDialog-submitButton').click();

    await vi.waitFor(() => {
      expect(props.onColContentEditSubmit).toHaveBeenCalledWith({
        'case-1': { [OTHER_COL_ID]: 'updated' },
        'case-2': { [OTHER_COL_ID]: 'updated' },
        'case-3': { [OTHER_COL_ID]: 'updated' },
      });
    });
  });

  it('should submit edited values for a single case from the row edit action', async () => {
    mockTableApi();
    const { props, screen } = await renderUploadCaseResultTable();

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await screen.getByRole('textbox', { name: 'Text' }).fill('Changed');
    await screen.getByRole('button', { name: 'Save', exact: true }).click();

    await vi.waitFor(() => {
      expect(props.onCaseContentEditSubmit).toHaveBeenCalledWith('case-1', expect.objectContaining({ [COMPLETE_CASE_TYPE_TEXT_COL_ID]: 'Changed' }));
    });
  });
});
