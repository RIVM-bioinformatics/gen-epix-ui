import type { StoreApi } from 'zustand';
import { container } from 'tsyringe';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { CommonDbApiPermission, CommonDbUser } from '@gen-epix/api-commondb';
import type { CaseDbCaseUploadResult } from '@gen-epix/api-casedb';
import { AuthorizationService } from '@gen-epix/ui-client-common/classes/services/AuthorizationService';
import {
  mockApiRequest,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import {
  STEP_ORDER_UPLOAD,
  UploadStoreContext,
  createUploadStore,
} from '../../../stores/uploadStore';
import type { UploadStore } from '../../../stores/uploadStore/uploadStore';
import { UPLOAD_STEP } from '../../../models/upload.models';
import { createCompleteCaseType } from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import { UploadCreateCases } from './UploadCreateCases';

const USER: CommonDbUser = {
  email: 'jane@example.test',
  id: '00000000-0000-4000-8000-000000000101',
  is_active: true,
  key: 'jdoe',
  name: 'Jane Doe',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

const PERMISSIONS: CommonDbApiPermission[] = [];

const VALIDATED_CASES: CaseDbCaseUploadResult[] = [
  { id: 'case-1', status: 'CREATED' },
  { id: 'case-2', status: 'CREATED' },
  { id: 'case-3', status: 'CREATED' },
];

const createDataTransfer = (fileNames: string[]) => {
  const dataTransfer = new DataTransfer();
  for (const fileName of fileNames) {
    dataTransfer.items.add(new File(['x'], fileName));
  }
  return dataTransfer;
};

const mockUploadApi = (responder: () => Response | Promise<Response> = () => Response.json({ status: 'CREATED', cases: [{ id: 'case-1', status: 'CREATED' }] })) => {
  container.resolve(AuthorizationService).user = USER;
  mockApiRequest('POST', '/v1/upload/cases', responder);
};

const renderUploadCreateCases = async (overrides: Partial<UploadStore> = {}) => {
  const store: StoreApi<UploadStore> = createUploadStore({
    completeCaseType: createCompleteCaseType(),
    stepOrder: STEP_ORDER_UPLOAD,
  });
  store.setState({
    activeStep: UPLOAD_STEP.CREATE_CASES,
    selectedIdsForUpload: ['case-1', 'case-2'],
    sequenceFilesDataTransfer: createDataTransfer([]),
    sequenceMapping: {},
    validatedCases: VALIDATED_CASES,
    ...overrides,
  });
  const screen = await renderComponent(
    <UploadStoreContext value={store}>
      <UploadCreateCases />
    </UploadStoreContext>,
  );
  return { screen, store };
};

describe('UploadCreateCases', () => {
  it('should show the number of ready cases and mapped files', async () => {
    mockUploadApi();
    const { screen } = await renderUploadCreateCases({
      selectedIdsForUpload: ['case-1', 'case-2'],
      sequenceFilesDataTransfer: createDataTransfer(['genome-a.fa', 'genome-b.fasta', 'genome-c.fa', 'reads-a.fq', 'reads-b.fastq']),
      sequenceMapping: {
        'case-1': { readsFileNames: { 'col-reads': { fwd: 'reads-a.fq', rev: '' } }, sequenceFileNames: { 'col-seq': 'genome-a.fa' } },
        'case-2': { readsFileNames: {}, sequenceFileNames: { 'col-seq': 'genome-b.fasta' } },
      },
    });
    await expect.element(screen.getByText('2 cases are ready to be uploaded.', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('2 genome files are ready to be uploaded.', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('1 reads files are ready to be uploaded.', { exact: true })).toBeVisible();
  });

  it('should warn about unselected cases and unmapped files', async () => {
    mockUploadApi();
    const { screen } = await renderUploadCreateCases({
      selectedIdsForUpload: ['case-1', 'case-2'],
      sequenceFilesDataTransfer: createDataTransfer(['genome-a.fa', 'genome-b.fasta', 'genome-c.fa', 'reads-a.fq', 'reads-b.fastq']),
      sequenceMapping: {
        'case-1': { readsFileNames: { 'col-reads': { fwd: 'reads-a.fq', rev: '' } }, sequenceFileNames: { 'col-seq': 'genome-a.fa' } },
        'case-2': { readsFileNames: {}, sequenceFileNames: { 'col-seq': 'genome-b.fasta' } },
      },
    });
    await expect.element(screen.getByText('1 cases were not selected and will not be uploaded.', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('1 unmapped genome files will not be uploaded.', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('1 unmapped reads files will not be uploaded.', { exact: true })).toBeVisible();
  });

  it('should not show file or unselected case warnings when everything is selected and mapped', async () => {
    mockUploadApi();
    const { screen } = await renderUploadCreateCases({
      selectedIdsForUpload: ['case-1', 'case-2', 'case-3'],
      sequenceFilesDataTransfer: createDataTransfer([]),
      sequenceMapping: {},
    });
    await expect.element(screen.getByText('3 cases are ready to be uploaded.', { exact: true })).toBeVisible();
    await expect.poll(() => screen.getByText('cases were not selected and will not be uploaded.').query()).toBeNull();
    await expect.poll(() => screen.getByText('unmapped genome files will not be uploaded.').query()).toBeNull();
    await expect.poll(() => screen.getByText('unmapped reads files will not be uploaded.').query()).toBeNull();
    await expect.poll(() => screen.getByText('genome files are ready to be uploaded.').query()).toBeNull();
    await expect.poll(() => screen.getByText('reads files are ready to be uploaded.').query()).toBeNull();
  });

  it('should go back to the previous step', async () => {
    mockUploadApi();
    const { screen, store } = await renderUploadCreateCases();
    await screen.getByRole('button', { name: 'Go back' }).click();
    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_SEQUENCE_FILES);
  });

  it('should show progress while uploading and report completion', async () => {
    let releaseUpload: () => void = () => undefined;
    const uploadGate = new Promise<void>((resolve) => {
      releaseUpload = resolve;
    });
    mockUploadApi(async () => {
      await uploadGate;
      return Response.json({ status: 'CREATED', cases: [{ id: 'case-1', status: 'CREATED' }] });
    });
    const onUploadComplete = vi.fn();
    const { screen } = await renderUploadCreateCases({ onUploadComplete });
    await screen.getByRole('button', { name: 'Start upload' }).click();
    await expect.element(screen.getByText('Uploading cases and files.')).toBeVisible();
    releaseUpload();
    await expect.element(screen.getByText('Upload completed.')).toBeVisible();
    await vi.waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledWith({ status: 'CREATED', cases: [{ id: 'case-1', status: 'CREATED' }] });
    });
  });

  it('should reset the upload when clicking upload more cases', async () => {
    mockUploadApi();
    const { screen, store } = await renderUploadCreateCases();
    await screen.getByRole('button', { name: 'Start upload' }).click();
    await expect.element(screen.getByText('Upload completed.')).toBeVisible();
    await screen.getByRole('button', { name: 'Upload more cases' }).click();
    await expect.poll(() => store.getState().activeStep).toBe(UPLOAD_STEP.SELECT_FILE);
  });

  it('should navigate to the case type when clicking view uploaded cases', async () => {
    mockUploadApi();
    const completeCaseType = createCompleteCaseType();
    const store: StoreApi<UploadStore> = createUploadStore({
      completeCaseType,
      stepOrder: STEP_ORDER_UPLOAD,
    });
    store.setState({
      activeStep: UPLOAD_STEP.CREATE_CASES,
      selectedIdsForUpload: ['case-1'],
      validatedCases: VALIDATED_CASES,
    });
    const screen = await renderRoutedPage(
      <UploadStoreContext value={store}>
        <UploadCreateCases />
      </UploadStoreContext>,
      { path: '/upload', permissions: PERMISSIONS, url: '/upload' },
    );
    await screen.getByRole('button', { name: 'Start upload' }).click();
    await expect.element(screen.getByText('Upload completed.')).toBeVisible();
    await screen.getByRole('button', { name: 'View uploaded cases' }).click();
    await expect.poll(() => window.location.pathname).toBe(CaseTypeUtil.createCaseTypeLink(completeCaseType));
  });

  it('should show the custom upload complete button instead of the default buttons', async () => {
    mockUploadApi();
    const uploadCompleteButtonCallback = vi.fn();
    const { screen } = await renderUploadCreateCases({
      uploadCompleteButtonCallback,
      uploadCompleteButtonLabel: 'Close wizard',
    });
    await screen.getByRole('button', { name: 'Start upload' }).click();
    await expect.element(screen.getByText('Upload completed.')).toBeVisible();
    await expect.poll(() => screen.getByRole('button', { name: 'Upload more cases' }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('button', { name: 'View uploaded cases' }).query()).toBeNull();
    await screen.getByRole('button', { name: 'Close wizard' }).click();
    expect(uploadCompleteButtonCallback).toHaveBeenCalledTimes(1);
  });

  it('should show an error when the batch upload fails', async () => {
    mockUploadApi(() => Response.json({ status: 'FAILED', cases: [] }));
    const { screen } = await renderUploadCreateCases();
    await screen.getByRole('button', { name: 'Start upload' }).click();
    await expect.element(screen.getByText('Failed to create cases during upload.')).toBeVisible();
    await expect.element(screen.getByText('An error occurred while creating cases.', { exact: false })).toBeVisible();
    await expect.poll(() => screen.getByText('Upload completed.').query()).toBeNull();
  });

  it('should show a generic error when the completion callback throws', async () => {
    mockUploadApi();
    const { screen } = await renderUploadCreateCases({
      onUploadComplete: vi.fn().mockRejectedValue(new Error('Boom')),
    });
    await screen.getByRole('button', { name: 'Start upload' }).click();
    await expect.element(screen.getByText('We have encountered a problem', { exact: false })).toBeVisible();
  });

  it('should not report completion when the request fails with an HTTP error', async () => {
    mockUploadApi(() => new Response('Server error', { status: 500 }));
    const { screen } = await renderUploadCreateCases();
    await screen.getByRole('button', { name: 'Start upload' }).click();
    await expect.poll(() => screen.getByText('Upload completed.').query()).toBeNull();
  });

  it('should ignore a stale upload result after the upload was restarted', async () => {
    let rejectFirstCompletion: (reason: unknown) => void = () => undefined;
    const onUploadComplete = vi.fn()
      .mockImplementationOnce(() => new Promise((_resolve, reject) => {
        rejectFirstCompletion = reject;
      }))
      .mockResolvedValueOnce(undefined);
    mockUploadApi();
    const { screen, store } = await renderUploadCreateCases({ onUploadComplete });
    await screen.getByRole('button', { name: 'Start upload' }).click();
    await vi.waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledTimes(1);
    });
    store.setState({ casesForVerificationFromSourceData: [] });
    await vi.waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledTimes(2);
    });
    rejectFirstCompletion(new Error('stale'));
    await expect.element(screen.getByText('Upload completed.')).toBeVisible();
    await expect.poll(() => screen.getByText('stale', { exact: false }).query()).toBeNull();
  });
});
