import { createRef } from 'react';
import type { ComponentProps } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  object,
  string,
} from 'yup';
import type { DialogAction } from '@gen-epix/ui-core-components/components/Dialog';
import type { FormFieldDefinition } from '@gen-epix/ui-core-form/models/form.models';
import { FORM_FIELD_DEFINITION_TYPE } from '@gen-epix/ui-core-form/models/form.models';

import type { GenericData } from '../../models/data.models';
import { renderComponent } from '../../test/lib';

import { CrudPageEditDialog } from './CrudPageEditDialog';
import type {
  CrudPageEditDialogOpenProps,
  CrudPageEditDialogRefMethods,
} from './CrudPageEditDialog';

interface TestFormFields {
  readonly description: string;
  readonly note?: string;
}

interface TestItem extends GenericData {
  readonly description: string;
}

const itemFixture: TestItem = {
  description: 'Item one',
  id: 'item-1',
};

const descriptionField: FormFieldDefinition<TestFormFields> = {
  definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
  label: 'Description',
  name: 'description',
};

const noteField: FormFieldDefinition<TestFormFields> = {
  definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
  label: 'Note',
  name: 'note',
};

const schema = object({
  description: string().required(),
  note: string(),
});

const getName = (item: TestFormFields | TestItem) => item.description;

type EditDialogProps = ComponentProps<typeof CrudPageEditDialog>;

interface RenderDialogOptions {
  readonly createItemDialogTitle?: string;
  readonly defaultNewItem?: Partial<TestFormFields>;
  readonly formFieldDefinitions?: EditDialogProps['formFieldDefinitions'];
  readonly getFormValuesFromItem?: (item: TestItem) => Partial<TestFormFields>;
  readonly onChange?: EditDialogProps['onChange'];
  readonly onSave?: EditDialogProps['onSave'];
  readonly openProps?: CrudPageEditDialogOpenProps<TestItem>;
}

const renderDialog = async (options: RenderDialogOptions = {}) => {
  const ref = createRef<CrudPageEditDialogRefMethods<TestItem, TestFormFields>>();
  const screen = await renderComponent(
    <CrudPageEditDialog
      createItemDialogTitle={options.createItemDialogTitle}
      defaultNewItem={options.defaultNewItem}
      formFieldDefinitions={options.formFieldDefinitions ?? [descriptionField]}
      getFormValuesFromItem={options.getFormValuesFromItem}
      getName={getName}
      onChange={options.onChange}
      onSave={options.onSave ?? vi.fn()}
      ref={ref}
      schema={schema}
    />,
  );
  ref.current?.open(options.openProps ?? { canSave: true, item: itemFixture });
  return screen;
};

describe('CrudPageEditDialog', () => {
  it('shows the default create title when there is no item', async () => {
    const screen = await renderDialog({ openProps: { canSave: true } });

    await expect.element(screen.getByRole('heading', { name: 'Create new item' })).toBeVisible();
  });

  it('shows the configured create title when there is no item', async () => {
    const screen = await renderDialog({
      createItemDialogTitle: 'Create new outage',
      openProps: { canSave: true },
    });

    await expect.element(screen.getByRole('heading', { name: 'Create new outage' })).toBeVisible();
  });

  it('shows the edit title with the item name and fills the form from the item', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByRole('heading', { name: 'Edit item: Item one' })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('Item one');
  });

  it('uses getFormValuesFromItem to derive the form values and the title', async () => {
    const screen = await renderDialog({
      getFormValuesFromItem: (item) => ({ description: `Mapped ${item.description}` }),
    });

    await expect.element(screen.getByRole('heading', { name: 'Edit item: Mapped Item one' })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('Mapped Item one');
  });

  it('uses defaultNewItem values when creating an item', async () => {
    const screen = await renderDialog({
      defaultNewItem: { description: 'Default description' },
      openProps: { canSave: true },
    });

    await expect.element(screen.getByRole('heading', { name: 'Create new item' })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('Default description');
  });

  it('re-resolves function based field definitions after the form values change', async () => {
    const formFieldDefinitions = vi.fn((_item: TestItem | undefined, values?: TestFormFields) => {
      return values?.description?.includes('note')
        ? [descriptionField, noteField]
        : [descriptionField];
    });
    const screen = await renderDialog({ formFieldDefinitions });

    await expect.element(screen.getByRole('textbox', { name: 'Description' })).toBeVisible();
    expect(formFieldDefinitions).toHaveBeenCalledWith(itemFixture);
    await expect.element(screen.getByRole('textbox', { name: 'Note' })).not.toBeInTheDocument();

    await screen.getByRole('textbox', { name: 'Description' }).fill('add a note');

    await expect.element(screen.getByRole('textbox', { name: 'Note' }), { timeout: 3000 }).toBeVisible();
  });

  it('calls onChange with the item and the debounced form values', async () => {
    const onChange = vi.fn<(item: TestItem, formValues: TestFormFields, formMethods: unknown) => void>();
    const screen = await renderDialog({ onChange });

    await screen.getByRole('textbox', { name: 'Description' }).fill('changed');

    await expect.poll(() => onChange.mock.lastCall?.[1].description, { timeout: 3000 }).toBe('changed');
    expect(onChange).toHaveBeenLastCalledWith(itemFixture, expect.objectContaining({ description: 'changed' }), expect.anything());
  });

  it('saves the form values and closes the dialog when submitted', async () => {
    const onSave = vi.fn();
    const screen = await renderDialog({ onSave });

    await screen.getByRole('button', { name: 'Save' }).click();

    expect(onSave).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ description: 'Item one' }), itemFixture);
    await expect.element(screen.getByRole('heading', { name: 'Edit item: Item one' })).not.toBeInTheDocument();
  });

  it('does not save and reports the errors when validation fails', async () => {
    const consoleTableSpy = vi.spyOn(console, 'table').mockImplementation(() => undefined);
    try {
      const onSave = vi.fn();
      const screen = await renderDialog({
        onSave,
        openProps: { canSave: true },
      });

      await screen.getByRole('button', { name: 'Save' }).click();

      await expect.poll(() => consoleTableSpy.mock.calls.length).toBeGreaterThan(0);
      expect(onSave).not.toHaveBeenCalled();
      await expect.element(screen.getByRole('heading', { name: 'Create new item' })).toBeVisible();
    } finally {
      consoleTableSpy.mockRestore();
    }
  });

  it('disables the save button and the form fields when the item cannot be saved', async () => {
    const screen = await renderDialog({ openProps: { canSave: false, item: itemFixture } });

    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await expect.element(screen.getByRole('textbox', { name: 'Description' })).toBeDisabled();
  });

  it('disables the save button while a field is loading', async () => {
    const screen = await renderDialog({
      formFieldDefinitions: [{ ...descriptionField, loading: true }],
    });

    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('renders the extra actions provided by the open props', async () => {
    const extraActionsFactory = vi.fn((): DialogAction[] => [
      {
        label: 'Extra action',
        onClick: vi.fn(),
      },
    ]);
    const screen = await renderDialog({
      openProps: {
        canSave: true,
        extraActionsFactory,
        item: itemFixture,
      },
    });

    await expect.element(screen.getByRole('button', { name: 'Extra action' })).toBeVisible();
    expect(extraActionsFactory).toHaveBeenCalledWith(itemFixture);
  });
});
