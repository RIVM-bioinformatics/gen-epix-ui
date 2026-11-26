import { Box } from '@mui/material';
import type { StoreApi } from 'zustand';
import { container } from 'tsyringe';
import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CaseDbCaseForUpload } from '@gen-epix/api-casedb';
import {
  CaseDbDataIssueType,
  CaseDbEtlStatus,
} from '@gen-epix/api-casedb';
import type { CommonDbUser } from '@gen-epix/api-commondb';
import { AuthorizationService } from '@gen-epix/ui-client-common/classes/services/AuthorizationService';

import {
  createUploadStore,
  STEP_ORDER_UPLOAD,
  UploadStoreContext,
} from '../../../stores/uploadStore';
import type { UploadStore } from '../../../stores/uploadStore/uploadStore';
import { UPLOAD_STEP } from '../../../models/upload.models';
import {
  COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
  mockCompleteCaseTypeLoaderApi,
} from '../../../test/fixtures/completeCaseType';
import {
  mockUploadCasesJobRequest,
  renderComponent,
} from '../../../test/lib';

import { UploadPreview } from './UploadPreview';

type MockOptions = {
  failRevalidation?: boolean;
  maxCases?: number;
  revalidationGate?: Promise<void>;
  validationGate?: Promise<void>;
};

type Screen = Awaited<ReturnType<typeof renderComponent>>;

type UploadCasesRequestBody = {
  case_batch: {
    cases: Array<CaseDbCaseForUpload>;
  };
  default_created_in_data_collection_id?: string;
};

const INVALID_VALUE = 'invalid';
const FAILED_VALUE = 'failed';
const UPDATED_VALUE = 'updated';
const UNAUTHORIZED_VALUE = 'unauthorized';

const USER: CommonDbUser = {
  email: 'jane@example.test',
  id: '00000000-0000-4000-8000-000000000101',
  is_active: true,
  key: 'jdoe',
  name: 'Jane Doe',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

const createCaseForUpload = (id: string, value: string): CaseDbCaseForUpload => ({
  case: {
    case_type_id: COMPLETE_CASE_TYPE_ID,
    content: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: value },
    created_in_data_collection_id: COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
    id,
  },
  id,
});

// The text column must be writable so that the case edit form and column edit dialog render its field.
const createWritableCompleteCaseType = (maxCases: number) => {
  const base = createCompleteCaseType({ props: { create_max_n_cases: maxCases } });
  const baseAccess = Object.values(base.case_type_access_abacs)[0];
  return createCompleteCaseType({
    case_type_access_abacs: {
      [baseAccess.data_collection_id]: {
        ...baseAccess,
        write_col_ids: [COMPLETE_CASE_TYPE_TEXT_COL_ID],
      },
    },
    props: { create_max_n_cases: maxCases },
  });
};

const createDefaultCases = (): Array<CaseDbCaseForUpload> => [
  createCaseForUpload('case-1', 'Valid one'),
  createCaseForUpload('case-2', INVALID_VALUE),
  createCaseForUpload('case-3', 'Valid three'),
];

const createCaseWithoutDataCollection = (id: string, value: string): CaseDbCaseForUpload => ({
  case: {
    case_type_id: COMPLETE_CASE_TYPE_ID,
    content: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: value },
    created_in_data_collection_id: null,
    id,
  },
  id,
});

const createCaseWithUnknownColumn = (id: string, value: string): CaseDbCaseForUpload => ({
  case: {
    case_type_id: COMPLETE_CASE_TYPE_ID,
    content: { 'col-unknown': 'extra', [COMPLETE_CASE_TYPE_TEXT_COL_ID]: value },
    created_in_data_collection_id: COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
    id,
  },
  id,
});

const getDataIssue = (value: unknown) => {
  if (value === INVALID_VALUE) {
    return { code: 'INVALID_VALUE', data_issue_type: CaseDbDataIssueType.INVALID, message: 'Invalid value' };
  }
  if (value === UNAUTHORIZED_VALUE) {
    return { code: 'UNAUTHORIZED_VALUE', data_issue_type: CaseDbDataIssueType.UNAUTHORIZED, message: 'Unauthorized value' };
  }
  return undefined;
};

const getValidationStatus = (value: unknown) => {
  if (value === FAILED_VALUE) {
    return CaseDbEtlStatus.FAILED;
  }
  if (value === UPDATED_VALUE) {
    return CaseDbEtlStatus.UPDATED;
  }
  return CaseDbEtlStatus.SUCCESS;
};

// Echoes the submitted cases: 'invalid' and 'unauthorized' yield data issues, 'failed' and 'updated' yield a status.
const createValidationResult = (caseForUpload: CaseDbCaseForUpload) => {
  const content = caseForUpload.case?.content ?? {};
  const value = content[COMPLETE_CASE_TYPE_TEXT_COL_ID] ?? null;
  const issue = getDataIssue(value);
  return {
    data_issues: issue
      ? [{
        ...issue,
        col_id: COMPLETE_CASE_TYPE_TEXT_COL_ID,
        original_value: value,
        updated_value: null as null | string,
      }]
      : [],
    id: caseForUpload.id,
    is_new: false,
    status: getValidationStatus(value),
    validated_content: content,
  };
};

const mockUploadPreviewApi = (requests: Array<UploadCasesRequestBody>, options: MockOptions) => {
  container.resolve(AuthorizationService).user = USER;
  mockCompleteCaseTypeLoaderApi(createWritableCompleteCaseType(options.maxCases ?? 10));
  mockUploadCasesJobRequest(async (request) => {
    const body = (await request.json()) as UploadCasesRequestBody;
    requests.push(body);
    if (requests.length === 1) {
      await options.validationGate;
    } else {
      await options.revalidationGate;
      if (options.failRevalidation) {
        return Response.json({ message: 'Revalidation failed' }, { status: 500 });
      }
    }
    return Response.json({ cases: body.case_batch.cases.map(createValidationResult) });
  });
};

const renderUploadPreview = async ({
  cases = createDefaultCases(),
  createdInDataCollectionId = COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
  ...options
}: { cases?: Array<CaseDbCaseForUpload>; createdInDataCollectionId?: null | string } & MockOptions = {}) => {
  const requests: Array<UploadCasesRequestBody> = [];
  mockUploadPreviewApi(requests, options);
  const completeCaseType = createWritableCompleteCaseType(options.maxCases ?? 10);
  const store: StoreApi<UploadStore> = createUploadStore({
    completeCaseType,
    stepOrder: STEP_ORDER_UPLOAD,
  });
  store.setState({
    activeStep: UPLOAD_STEP.PREVIEW,
    caseRightsColMap: { [COMPLETE_CASE_TYPE_TEXT_COL_ID]: cases.map(caseForUpload => caseForUpload.case?.id ?? '') },
    casesForVerificationFromSourceData: cases,
    createdInDataCollectionId,
  });
  const screen = await renderComponent(
    <UploadStoreContext value={store}>
      <Box sx={{ height: 800 }}>
        <UploadPreview caseTypeId={COMPLETE_CASE_TYPE_ID} />
      </Box>
    </UploadStoreContext>,
  );
  return { requests, screen, store };
};

const editRowValue = async (screen: Screen, rowIndex: number, value: string) => {
  await screen.getByRole('button', { name: 'Row actions' }).nth(rowIndex).click();
  await screen.getByRole('menuitem', { exact: true, name: 'Edit' }).click();
  await screen.getByRole('textbox', { name: 'Text' }).fill(value);
  await screen.getByRole('button', { exact: true, name: 'Save' }).click();
};

const editColumnValues = async (screen: Screen, value: string) => {
  await screen.getByText('text', { exact: true }).first().hover();
  await screen.getByTitle('Edit values for Text (for selected rows)').click();
  await screen.getByRole('textbox', { name: 'Text' }).fill(value);
  await screen.getByTestId('UploadEditColumnValuesDialog-submitButton').click();
};

const getSelectedIds = (store: StoreApi<UploadStore>) => [...store.getState().selectedIdsForUpload].sort();

describe('UploadPreview', () => {
  it('should show a validating message while the cases are being validated', async () => {
    let releaseValidation: () => void = () => undefined;
    const validationGate = new Promise<void>((resolve) => {
      releaseValidation = resolve;
    });
    const { screen } = await renderUploadPreview({ validationGate });

    await expect.element(screen.getByText('Validating cases', { exact: true })).toBeVisible();

    releaseValidation();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();
  });

  it('should validate the cases and select only the cases without invalid data issues', async () => {
    const { requests, screen } = await renderUploadPreview();

    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();
    await expect.element(screen.getByRole('checkbox', { name: 'Select row' }).nth(0)).toBeChecked();
    await expect.element(screen.getByRole('checkbox', { name: 'Select row' }).nth(1)).not.toBeChecked();
    await expect.element(screen.getByRole('checkbox', { name: 'Select row' }).nth(2)).toBeChecked();
    expect(requests).toHaveLength(1);
    expect(requests[0].case_batch.cases.map(caseForUpload => caseForUpload.case?.id)).toEqual(['case-1', 'case-2', 'case-3']);
  });

  it('should not validate when there are no cases to verify', async () => {
    const { requests, screen } = await renderUploadPreview({ cases: [] });

    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed' })).toBeVisible();
    expect(requests).toHaveLength(0);
  });

  it('should show the maximum cases alert and disable proceeding when too many cases are selected', async () => {
    const { screen } = await renderUploadPreview({ maxCases: 1 });

    await expect.element(screen.getByRole('alert')).toHaveTextContent('You have exceeded the maximum number of 1 cases for this case type. Please reduce the number of selected cases before proceeding.');
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeDisabled();
  });

  it('should revalidate the selected cases after editing a column', async () => {
    const { requests, screen } = await renderUploadPreview();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await editColumnValues(screen, 'Changed');

    await expect.poll(() => requests.length).toBe(2);
    expect(requests[1].case_batch.cases.map(caseForUpload => caseForUpload.case?.id)).toEqual(['case-1', 'case-3']);
    expect(requests[1].case_batch.cases.map(caseForUpload => caseForUpload.case?.content[COMPLETE_CASE_TYPE_TEXT_COL_ID])).toEqual(['Changed', 'Changed']);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Changed' }).first()).toBeVisible();
  });

  it('should revalidate a single case after editing its row values', async () => {
    const { requests, screen } = await renderUploadPreview();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await editRowValue(screen, 0, 'Changed row');

    await expect.poll(() => requests.length).toBe(2);
    expect(requests[1].case_batch.cases).toHaveLength(1);
    expect(requests[1].case_batch.cases[0].case?.id).toBe('case-1');
    expect(requests[1].case_batch.cases[0].case?.content[COMPLETE_CASE_TYPE_TEXT_COL_ID]).toBe('Changed row');
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Changed row' })).toBeVisible();
  });

  it('should select a previously invalid case once its revalidation no longer reports issues', async () => {
    const { screen } = await renderUploadPreview();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await editRowValue(screen, 1, 'Fixed');

    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 3 selected cases' })).toBeVisible();
    await expect.element(screen.getByRole('checkbox', { name: 'Select row' }).nth(1)).toBeChecked();
  });

  it('should show a revalidating message while the cases are being revalidated', async () => {
    let releaseRevalidation: () => void = () => undefined;
    const revalidationGate = new Promise<void>((resolve) => {
      releaseRevalidation = resolve;
    });
    const { screen } = await renderUploadPreview({ revalidationGate });
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await editRowValue(screen, 0, 'Changed row');

    await expect.element(screen.getByText('Revalidating cases', { exact: true })).toBeVisible();

    releaseRevalidation();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Changed row' })).toBeVisible();
  });

  it('should show the revalidation error when revalidating the cases fails', async () => {
    const { screen } = await renderUploadPreview({ failRevalidation: true });
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await editRowValue(screen, 0, 'Changed row');

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Sorry, an unexpected error has occurred.' })).toBeVisible();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Changed row' }).query()).toBeNull();
  });

  it('should proceed directly to the next step when all unselected cases have invalid data issues', async () => {
    const { screen, store } = await renderUploadPreview();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' }).click();

    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_SEQUENCE_FILES);
    expect(getSelectedIds(store)).toEqual(['case-1', 'case-3']);
    expect(store.getState().validatedCases).toHaveLength(3);
  });

  it('should ask for confirmation before proceeding with selected cases that have issues and keep only the valid ones', async () => {
    const { screen, store } = await renderUploadPreview();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();
    await screen.getByRole('checkbox', { name: 'Select row' }).nth(1).click();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 3 selected cases' })).toBeVisible();

    await screen.getByRole('button', { exact: true, name: 'Proceed with 3 selected cases' }).click();

    await expect.element(screen.getByText('Issues found with selected cases', { exact: true })).toBeVisible();
    await screen.getByRole('button', { exact: true, name: 'Proceed' }).click();

    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_SEQUENCE_FILES);
    expect(getSelectedIds(store)).toEqual(['case-1', 'case-3']);
  });

  it('should ask for confirmation before proceeding with selected cases that have a failed status', async () => {
    const { screen, store } = await renderUploadPreview({ cases: [createCaseForUpload('case-1', 'Valid one'), createCaseForUpload('case-2', FAILED_VALUE)] });
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' }).click();

    await expect.element(screen.getByText('Issues found with selected cases', { exact: true })).toBeVisible();
    await screen.getByRole('button', { exact: true, name: 'Proceed' }).click();

    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_SEQUENCE_FILES);
    expect(getSelectedIds(store)).toEqual(['case-1', 'case-2']);
  });

  it('should ask for confirmation before proceeding without unselected valid cases', async () => {
    const { screen, store } = await renderUploadPreview();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();
    await screen.getByRole('checkbox', { name: 'Select row' }).nth(0).click();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 1 selected cases' })).toBeVisible();

    await screen.getByRole('button', { exact: true, name: 'Proceed with 1 selected cases' }).click();

    await expect.element(screen.getByText('Not all cases are selected.', { exact: true })).toBeVisible();
    await screen.getByRole('button', { exact: true, name: 'Proceed' }).click();

    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_SEQUENCE_FILES);
    expect(getSelectedIds(store)).toEqual(['case-3']);
  });

  it('should go back to the previous step', async () => {
    const { screen, store } = await renderUploadPreview();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Go back' })).toBeVisible();

    await screen.getByRole('button', { exact: true, name: 'Go back' }).click();

    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.MAP_COLUMNS);
  });

  it('should send unknown columns of a case along when revalidating its column values', async () => {
    const { requests, screen } = await renderUploadPreview({ cases: [createCaseWithUnknownColumn('case-1', 'Valid one'), createCaseForUpload('case-2', 'Valid two')] });
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await editColumnValues(screen, 'Changed');

    await expect.poll(() => requests.length).toBe(2);
    expect(requests[1].case_batch.cases[0].case?.content).toEqual({ 'col-unknown': 'extra', [COMPLETE_CASE_TYPE_TEXT_COL_ID]: 'Changed' });
  });

  it('should send a missing value as empty when revalidating a case', async () => {
    const { requests, screen } = await renderUploadPreview();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await editRowValue(screen, 0, '');

    await expect.poll(() => requests.length).toBe(2);
    expect(requests[1].case_batch.cases[0].case?.content[COMPLETE_CASE_TYPE_TEXT_COL_ID]).toBeNull();
  });

  it('should keep a case selected when its revalidation reports an updated status', async () => {
    const { requests, screen } = await renderUploadPreview();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await editRowValue(screen, 0, UPDATED_VALUE);

    await expect.poll(() => requests.length).toBe(2);
    await expect.element(screen.getByRole('cell', { exact: true, name: UPDATED_VALUE })).toBeVisible();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();
  });

  it('should select a case whose revalidation reports a failed status', async () => {
    const { screen } = await renderUploadPreview();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();
    await expect.element(screen.getByRole('checkbox', { name: 'Select row' }).nth(1)).not.toBeChecked();

    await editRowValue(screen, 1, FAILED_VALUE);

    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 3 selected cases' })).toBeVisible();
    await expect.element(screen.getByRole('checkbox', { name: 'Select row' }).nth(1)).toBeChecked();
  });

  it('should keep an already selected case selected when its revalidation reports a failed status', async () => {
    const { requests, screen } = await renderUploadPreview();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await editRowValue(screen, 0, FAILED_VALUE);

    await expect.poll(() => requests.length).toBe(2);
    await expect.element(screen.getByRole('cell', { exact: true, name: FAILED_VALUE })).toBeVisible();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();
    await expect.element(screen.getByRole('checkbox', { name: 'Select row' }).nth(0)).toBeChecked();
  });

  it('should not select cases with unauthorized data issues', async () => {
    const { screen, store } = await renderUploadPreview({ cases: [createCaseForUpload('case-1', 'Valid one'), createCaseForUpload('case-2', UNAUTHORIZED_VALUE), createCaseForUpload('case-3', 'Valid three')] });
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();
    await expect.element(screen.getByRole('checkbox', { name: 'Select row' }).nth(1)).not.toBeChecked();

    await screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' }).click();

    await expect.element(screen.getByText('Not all cases are selected.', { exact: true })).toBeVisible();
    await screen.getByRole('button', { exact: true, name: 'Proceed' }).click();

    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_SEQUENCE_FILES);
    expect(getSelectedIds(store)).toEqual(['case-1', 'case-3']);
  });

  it('should validate cases without a default data collection when none is set', async () => {
    const { requests, screen } = await renderUploadPreview({ createdInDataCollectionId: null });

    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();
    expect(requests).toHaveLength(1);
  });

  it('should use the default data collection when revalidating a case without a data collection', async () => {
    const { requests, screen } = await renderUploadPreview({ cases: [createCaseWithoutDataCollection('case-1', 'Valid one'), createCaseForUpload('case-2', 'Valid two')] });
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await editRowValue(screen, 0, 'Changed row');

    await expect.poll(() => requests.length).toBe(2);
    expect(requests[1].case_batch.cases[0].case?.created_in_data_collection_id).toBe(COMPLETE_CASE_TYPE_DATA_COLLECTION_ID);
  });

  it('should not send a default data collection when revalidating cases without one set', async () => {
    const { requests, screen } = await renderUploadPreview({
      cases: [createCaseWithoutDataCollection('case-1', 'Valid one'), createCaseWithoutDataCollection('case-2', 'Valid two')],
      createdInDataCollectionId: null,
    });
    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();

    await editRowValue(screen, 0, 'Changed row');

    await expect.poll(() => requests.length).toBe(2);
    expect(requests[1].default_created_in_data_collection_id).toBeUndefined();
  });

  it('should validate a case without a value in its source data', async () => {
    const caseWithoutValue: CaseDbCaseForUpload = {
      case: {
        case_type_id: COMPLETE_CASE_TYPE_ID,
        content: {},
        created_in_data_collection_id: COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
        id: 'case-2',
      },
      id: 'case-2',
    };
    const { screen } = await renderUploadPreview({ cases: [createCaseForUpload('case-1', 'Valid one'), caseWithoutValue] });

    await expect.element(screen.getByRole('button', { exact: true, name: 'Proceed with 2 selected cases' })).toBeVisible();
  });
});
