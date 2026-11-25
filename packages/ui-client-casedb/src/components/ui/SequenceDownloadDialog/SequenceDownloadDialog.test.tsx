import type {
  CaseDbCase,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { createRef } from 'react';
import type { StoreApi } from 'zustand';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import type { DialogAction } from '@gen-epix/ui-core-components/components/Dialog';

import { renderComponent } from '../../../test/lib';
import { CaseDbStandardConfigUtil } from '../../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../../theme/demoTheme';
import {
  createDashboardStore,
  DashboardStoreContext,
} from '../../../stores/dashboardStore';
import type { DashboardStore } from '../../../stores/dashboardStore';
import { EventBusService } from '../../../classes/services/EventBusService';
import {
  createLineListCompleteCaseType,
  LINE_LIST_DIM_OTHER_ID,
  SEQUENCE_COL_ID,
} from '../../../test/fixtures/lineListCompleteCaseType';

import type { SequenceDownloadDialogRefMethods } from './SequenceDownloadDialog';
import { SequenceDownloadDialog } from './SequenceDownloadDialog';

const SECOND_SEQUENCE_COL_ID = 'col-sequence-second';
const DOWNLOAD_BUTTON_NAME = 'Download FASTA';
const COLUMN_SELECT_NAME = 'Genetic sequence column';
const SEQUENCE_LABEL = 'Sequence';
const SECOND_SEQUENCE_LABEL = 'Second sequence';

const CASE_ONE: CaseDbCase = { case_type_id: 'complete-case-type', content: {}, created_in_data_collection_id: 'dc-1', id: 'case-1' };
const CASE_TWO: CaseDbCase = { case_type_id: 'complete-case-type', content: {}, created_in_data_collection_id: 'dc-1', id: 'case-2' };

let store: StoreApi<DashboardStore> | undefined;
let storeCounter = 0;
const submittedForms: HTMLFormElement[] = [];

const createCompleteCaseType = (): CaseDbCompleteCaseType => {
  return createLineListCompleteCaseType();
};

const createTwoSequenceCaseType = (): CaseDbCompleteCaseType => {
  const base = createLineListCompleteCaseType();
  const sequenceCol = base.cols[SEQUENCE_COL_ID];
  return {
    ...base,
    cols: {
      ...base.cols,
      [SECOND_SEQUENCE_COL_ID]: { ...sequenceCol, code: 'sequence-second', id: SECOND_SEQUENCE_COL_ID, label: SECOND_SEQUENCE_LABEL, rank: 4 },
    },
    ordered_col_ids_by_dim: {
      ...base.ordered_col_ids_by_dim,
      [LINE_LIST_DIM_OTHER_ID]: [...base.ordered_col_ids_by_dim[LINE_LIST_DIM_OTHER_ID], SECOND_SEQUENCE_COL_ID],
    },
  };
};

const createNoSequenceCaseType = (): CaseDbCompleteCaseType => {
  const base = createLineListCompleteCaseType();
  return {
    ...base,
    ref_cols: Object.fromEntries(
      Object.entries(base.ref_cols).map(([id, refCol]) => [
        id,
        refCol.col_type === CaseDbColType.GENETIC_SEQUENCE ? { ...refCol, col_type: CaseDbColType.NOMINAL } : refCol,
      ]),
    ),
  };
};

const createStore = (completeCaseType: CaseDbCompleteCaseType): StoreApi<DashboardStore> => {
  storeCounter += 1;
  const newStore = createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType,
    config: { ...CaseDbStandardConfigUtil.createConfig(), theme: createCaseDbDemoTheme('light') },
    idSelectorCallback: (row: CaseDbCase) => row.id,
    storageNamePostFix: `sequence-download-dialog-${storeCounter}`,
    storageVersion: 1,
  });
  newStore.setState({ globalAbortSignal: new AbortController().signal });
  return newStore;
};

const renderDialog = async (
  completeCaseType: CaseDbCompleteCaseType,
  openProps: { cases: CaseDbCase[]; geneticSequenceColId?: string },
) => {
  store = createStore(completeCaseType);
  const ref = createRef<SequenceDownloadDialogRefMethods>();
  const screen = await renderComponent(
    <DashboardStoreContext value={store}>
      <SequenceDownloadDialog ref={ref} />
    </DashboardStoreContext>,
  );
  ref.current?.open(openProps);
  return screen;
};

describe('SequenceDownloadDialog', () => {
  beforeEach(() => {
    submittedForms.length = 0;
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function submit(this: HTMLFormElement) {
      submittedForms.push(this);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    store?.getState().destroy();
    store = undefined;
    container.resolve(NotificationService).clearNotifications();
  });

  it('auto-selects the only genetic sequence column and enables the download button', async () => {
    const screen = await renderDialog(createCompleteCaseType(), { cases: [CASE_ONE] });

    await expect.element(screen.getByRole('combobox', { name: COLUMN_SELECT_NAME })).toHaveTextContent(SEQUENCE_LABEL);
    await expect.element(screen.getByRole('button', { exact: true, name: DOWNLOAD_BUTTON_NAME })).toBeEnabled();
  });

  it('disables the download button when there is no genetic sequence column', async () => {
    const screen = await renderDialog(createNoSequenceCaseType(), { cases: [CASE_ONE] });

    await expect.element(screen.getByRole('button', { exact: true, name: DOWNLOAD_BUTTON_NAME })).toBeDisabled();
  });

  it('keeps the requested genetic sequence column when it is not the first option', async () => {
    const screen = await renderDialog(createTwoSequenceCaseType(), {
      cases: [CASE_ONE],
      geneticSequenceColId: SECOND_SEQUENCE_COL_ID,
    });

    await expect.element(screen.getByRole('combobox', { name: COLUMN_SELECT_NAME })).toHaveTextContent(SECOND_SEQUENCE_LABEL);
    await expect.element(screen.getByRole('button', { exact: true, name: DOWNLOAD_BUTTON_NAME })).toBeEnabled();
  });

  it('renders when a requested column is given but no genetic sequence column exists', async () => {
    const screen = await renderDialog(createNoSequenceCaseType(), {
      cases: [CASE_ONE],
      geneticSequenceColId: SEQUENCE_COL_ID,
    });

    await expect.element(screen.getByRole('combobox', { name: COLUMN_SELECT_NAME })).toBeVisible();
  });

  it('lets the user choose a different genetic sequence column', async () => {
    const screen = await renderDialog(createTwoSequenceCaseType(), { cases: [CASE_ONE] });

    await expect.element(screen.getByRole('combobox', { name: COLUMN_SELECT_NAME })).toBeVisible();
    await screen.getByRole('combobox', { name: COLUMN_SELECT_NAME }).click();
    await screen.getByRole('option', { exact: true, name: SECOND_SEQUENCE_LABEL }).click();

    await expect.element(screen.getByRole('combobox', { name: COLUMN_SELECT_NAME })).toHaveTextContent(SECOND_SEQUENCE_LABEL);
  });

  it('submits a FASTA download form for the selected column and closes the dialog', async () => {
    const completeCaseType = createCompleteCaseType();
    const screen = await renderDialog(completeCaseType, { cases: [CASE_ONE, CASE_TWO] });

    await screen.getByRole('button', { exact: true, name: DOWNLOAD_BUTTON_NAME }).click();

    await vi.waitFor(() => {
      expect(submittedForms).toHaveLength(1);
    });
    await expect.element(screen.getByRole('button', { exact: true, name: DOWNLOAD_BUTTON_NAME })).not.toBeInTheDocument();
    const entries = [...new FormData(submittedForms[0]).entries()];
    expect(entries).toEqual(expect.arrayContaining([
      ['case_ids', CASE_ONE.id],
      ['case_ids', CASE_TWO.id],
      ['case_type_id', completeCaseType.id],
      ['genetic_sequence_col_id', SEQUENCE_COL_ID],
    ]));
    expect(entries).toContainEqual(['file_name', expect.stringMatching(/-sequence-sequences\.fasta$/)]);
    expect(submittedForms[0].action).toContain('/v1/retrieve/genetic_sequence/fasta');
    expect(submittedForms[0].isConnected).toBe(false);
  });

  it('submits the column chosen by the user', async () => {
    const screen = await renderDialog(createTwoSequenceCaseType(), { cases: [CASE_ONE] });

    await screen.getByRole('combobox', { name: COLUMN_SELECT_NAME }).click();
    await screen.getByRole('option', { exact: true, name: SECOND_SEQUENCE_LABEL }).click();
    await screen.getByRole('button', { exact: true, name: DOWNLOAD_BUTTON_NAME }).click();

    await vi.waitFor(() => {
      expect(submittedForms).toHaveLength(1);
    });
    const entries = [...new FormData(submittedForms[0]).entries()];
    expect(entries).toContainEqual(['genetic_sequence_col_id', SECOND_SEQUENCE_COL_ID]);
    expect(entries).toContainEqual(['file_name', expect.stringMatching(/-second-sequence-sequences\.fasta$/)]);
  });

  it('does not download when the form is submitted directly', async () => {
    const screen = await renderDialog(createCompleteCaseType(), { cases: [CASE_ONE] });

    await expect.element(screen.getByRole('combobox', { name: COLUMN_SELECT_NAME })).toBeVisible();
    const form = screen.getByRole('combobox', { name: COLUMN_SELECT_NAME }).element().closest('form');
    expect(form).not.toBeNull();
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(submittedForms).toHaveLength(0);
  });

  it('merges extra FASTA download actions from the event bus with the built-in action', async () => {
    const eventBusService = container.resolve(EventBusService);
    const extraOnClick = vi.fn();
    const requestedPayloads: unknown[] = [];
    const onRequested = (payload: unknown) => {
      requestedPayloads.push(payload);
      const extraActions: DialogAction[] = [{ label: 'Extra action', onClick: extraOnClick }];
      eventBusService.emit('onFastaDownloadActionsChanged', extraActions);
    };
    eventBusService.addEventListener('onFastaDownloadActionsRequested', onRequested);

    try {
      const screen = await renderDialog(createCompleteCaseType(), { cases: [CASE_ONE] });

      await screen.getByRole('button', { exact: true, name: 'Extra action' }).click();
      expect(extraOnClick).toHaveBeenCalledTimes(1);
      await expect.element(screen.getByRole('button', { exact: true, name: DOWNLOAD_BUTTON_NAME })).toBeEnabled();
      expect(requestedPayloads).toEqual([{
        caseIds: [CASE_ONE.id],
        caseTypeId: createCompleteCaseType().id,
        geneticSequenceColId: SEQUENCE_COL_ID,
      }]);
    } finally {
      eventBusService.removeEventListener('onFastaDownloadActionsRequested', onRequested);
    }
  });
});
