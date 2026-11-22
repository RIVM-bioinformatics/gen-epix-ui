import type { CaseDbCompleteCaseType } from '@gen-epix/api-casedb';
import { createRef } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import type { UploadEditColumnValuesDialogRefMethods } from './UploadEditColumnValuesDialog';
import { UploadEditColumnValuesDialog } from './UploadEditColumnValuesDialog';

const SUBMIT_BUTTON_TEST_ID = 'UploadEditColumnValuesDialog-submitButton';
const CLOSE_BUTTON_TEST_ID = 'UploadEditColumnValuesDialog-closeButton';
const TITLE = 'Edit values for Text (for selected rows)';
const WARNING_TITLE = 'You do not have the necessary rights to edit all rows in this column.';
const WARNING_BODY = 'Only the cases that you have write access to for this column will be updated. Please review the changes carefully before submitting.';
const NEW_VALUE = 'new value';

const createCompleteCaseTypeWithWritableTextCol = (): CaseDbCompleteCaseType => {
  const base = createCompleteCaseType();
  const access = base.case_type_access_abacs[COMPLETE_CASE_TYPE_DATA_COLLECTION_ID];
  return createCompleteCaseType({
    case_type_access_abacs: {
      [COMPLETE_CASE_TYPE_DATA_COLLECTION_ID]: {
        ...access,
        write_col_ids: [COMPLETE_CASE_TYPE_TEXT_COL_ID],
      },
    },
  });
};

const COMPLETE_CASE_TYPE = createCompleteCaseTypeWithWritableTextCol();

const renderDialog = async (shouldShowRightsWarning?: boolean) => {
  const ref = createRef<UploadEditColumnValuesDialogRefMethods>();
  const onSubmit = vi.fn();
  const screen = await renderComponent(
    <UploadEditColumnValuesDialog
      onSubmit={onSubmit}
      ref={ref}
    />,
  );
  ref.current?.open({
    colId: COMPLETE_CASE_TYPE_TEXT_COL_ID,
    completeCaseType: COMPLETE_CASE_TYPE,
    shouldShowRightsWarning,
  });
  return { onSubmit, screen };
};

describe('UploadEditColumnValuesDialog', () => {
  it('shows the edit title and the input for the column', async () => {
    const { screen } = await renderDialog();

    await expect.element(screen.getByText(TITLE)).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Text' })).toBeVisible();
  });

  it('does not show the rights warning when not requested', async () => {
    const { screen } = await renderDialog(false);

    await expect.element(screen.getByText(TITLE)).toBeVisible();
    await expect.poll(() => screen.getByText(WARNING_TITLE).query()).toBeNull();
  });

  it('shows the rights warning when requested', async () => {
    const { screen } = await renderDialog(true);

    const alert = screen.getByRole('alert');
    await expect.element(alert).toBeVisible();
    await expect.element(alert).toHaveTextContent(`${WARNING_TITLE}${WARNING_BODY}`);
  });

  it('submits the edited value and closes the dialog', async () => {
    const { onSubmit, screen } = await renderDialog();

    await screen.getByRole('textbox', { name: 'Text' }).fill(NEW_VALUE);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ [COMPLETE_CASE_TYPE_TEXT_COL_ID]: NEW_VALUE });
    });
    await expect.poll(() => screen.getByText(TITLE).query()).toBeNull();
  });

  it('closes the dialog without submitting when cancelled', async () => {
    const { onSubmit, screen } = await renderDialog();

    await expect.element(screen.getByText(TITLE)).toBeVisible();
    await screen.getByTestId(CLOSE_BUTTON_TEST_ID).click();

    await expect.poll(() => screen.getByText(TITLE).query()).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
