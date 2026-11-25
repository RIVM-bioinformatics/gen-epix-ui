import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  CaseDbCaseSet,
  CaseDbCaseSetCategory,
  CaseDbCaseSetStatus,
  CaseDbCaseType,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { container } from 'tsyringe';

import { CASEDB_QUERY_KEY } from '../../../constants/query.constants';
import { renderComponent } from '../../../test/lib';

import { CaseSetForm } from './CaseSetForm';

const FORM_ID = 'case-set-form';
const SUBMIT_TEST_ID = 'CaseSetForm-submit';
const CASE_SET_ID = '6b1c3a9e-2f4d-4c8a-9e7b-1a2b3c4d5e6f';
const CATEGORY_ID = '1f2e3d4c-5b6a-4789-8abc-0d1e2f3a4b5c';
const STATUS_ID = '2a3b4c5d-6e7f-4801-9a2b-3c4d5e6f7a8b';
const CASE_TYPE_ID = '3b4c5d6e-7f80-4912-8b3c-4d5e6f7a8b9c';

const CATEGORY: CaseDbCaseSetCategory = { description: 'Category description', id: CATEGORY_ID, name: 'Outbreak', rank: 1 };
const STATUS: CaseDbCaseSetStatus = { description: 'Status description', id: STATUS_ID, name: 'Open', rank: 1 };
const CASE_TYPE: CaseDbCaseType = { id: CASE_TYPE_ID, name: 'Case type one' };

const createCaseSet = (overrides: Partial<CaseDbCaseSet> = {}): CaseDbCaseSet => {
  return {
    case_set_category_id: CATEGORY_ID,
    case_set_date: '2024-03-05T14:30:00.000Z',
    case_set_status_id: STATUS_ID,
    case_type_id: CASE_TYPE_ID,
    code: 'event-code',
    created_in_data_collection_id: 'data-collection-1',
    description: 'Event description',
    id: CASE_SET_ID,
    name: 'Event one',
    ...overrides,
  };
};

const registerOptionHandlers = () => {
  mockApiRequest('GET', '/v1/case_set_categories', () => Response.json([CATEGORY]));
  mockApiRequest('GET', '/v1/case_set_statuses', () => Response.json([STATUS]));
  mockApiRequest('GET', '/v1/case_types', () => Response.json([CASE_TYPE]));
};

const renderForm = async ({ caseSet = createCaseSet(), onFinish = vi.fn(), onIsSavingChange = vi.fn() }: { caseSet?: CaseDbCaseSet; onFinish?: () => void; onIsSavingChange?: (isSaving: boolean) => void } = {}) => {
  const screen = await renderComponent(
    <>
      <CaseSetForm
        caseSet={caseSet}
        formId={FORM_ID}
        onFinish={onFinish}
        onIsSavingChange={onIsSavingChange}
      />
      <button
        form={FORM_ID}
        type={'submit'}
        {...TestIdUtil.createAttributes(SUBMIT_TEST_ID)}
      >
        {'Submit'}
      </button>
    </>,
  );
  return { screen };
};

describe('CaseSetForm', () => {
  beforeEach(() => {
    registerOptionHandlers();
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('shows the values of the case set in the form fields', async () => {
    const { screen } = await renderForm();

    await expect.element(screen.getByRole('textbox', { name: 'Event name' })).toHaveValue('Event one');
    await expect.element(screen.getByRole('textbox', { name: 'Code' })).toHaveValue('event-code');
    await expect.element(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('Outbreak');
    await expect.element(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('Open');
    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).toHaveValue('Case type one');
  });

  it('saves the edited case set and finishes on success', async () => {
    const requestBodies: unknown[] = [];
    mockApiRequest('PUT', `/v1/case_sets/${CASE_SET_ID}`, async (request: Request) => {
      const body = await request.json() as CaseDbCaseSet;
      requestBodies.push(body);
      return Response.json({ ...createCaseSet(), ...body });
    });
    const onFinish = vi.fn();
    const onIsSavingChange = vi.fn<(isSaving: boolean) => void>();
    const { screen } = await renderForm({ onFinish, onIsSavingChange });
    const queryClientService = container.resolve(QueryClientService);
    queryClientService.queryClient.setQueryData(queryClientService.getGenericKey(CASEDB_QUERY_KEY.CASE_SETS), [createCaseSet()]);

    await screen.getByRole('textbox', { name: 'Event name' }).fill('Event renamed');
    await screen.getByTestId(SUBMIT_TEST_ID).click();

    await expect.poll(() => onFinish.mock.calls.length).toBe(1);
    expect(requestBodies).toHaveLength(1);
    expect(requestBodies[0]).toEqual(expect.objectContaining({
      case_set_category_id: CATEGORY_ID,
      case_set_status_id: STATUS_ID,
      case_type_id: CASE_TYPE_ID,
      code: 'event-code',
      name: 'Event renamed',
    }));
    expect(onIsSavingChange).toHaveBeenCalledWith(true);
    await expect.poll(() => onIsSavingChange.mock.lastCall?.[0]).toBe(false);
  });

  it('shows a spinner while the case set is being saved', async () => {
    let resolveSave: (response: Response) => void = () => undefined;
    const savePromise = new Promise<Response>((resolve) => {
      resolveSave = resolve;
    });
    mockApiRequest('PUT', `/v1/case_sets/${CASE_SET_ID}`, async () => savePromise);
    const onFinish = vi.fn();
    const { screen } = await renderForm({ onFinish });

    await screen.getByTestId(SUBMIT_TEST_ID).click();

    await expect.element(screen.getByText('Saving event data')).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();

    resolveSave(Response.json(createCaseSet()));

    await expect.poll(() => onFinish.mock.calls.length).toBe(1);
  });

  it('finishes and reports the failure when saving fails', async () => {
    mockApiRequest('PUT', `/v1/case_sets/${CASE_SET_ID}`, () => Response.json({ detail: 'Server error' }, { status: 500 }));
    const onFinish = vi.fn();
    const onIsSavingChange = vi.fn<(isSaving: boolean) => void>();
    const { screen } = await renderForm({ onFinish, onIsSavingChange });

    await screen.getByTestId(SUBMIT_TEST_ID).click();

    await expect.poll(() => onFinish.mock.calls.length).toBe(1);
    await expect.poll(() => onIsSavingChange.mock.lastCall?.[0]).toBe(false);
  });
});
