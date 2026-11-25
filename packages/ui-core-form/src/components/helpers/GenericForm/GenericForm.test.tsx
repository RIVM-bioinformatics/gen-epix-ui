import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import type {
  FieldValues,
  UseFormProps,
} from 'react-hook-form';
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
import type { ObjectSchema } from 'yup';

import { renderComponent } from '../../../test/lib';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form.models';
import type {
  FormFieldDefinition,
  FormGroupDefinition,
} from '../../../models/form.models';

import type { GenericFormProps } from './GenericForm';
import { GenericForm } from './GenericForm';

type FieldForm = {
  autocomplete: null | string;
  boolean: boolean | null;
  booleanSwitch: boolean | null;
  date: Date | null;
  file: FileList | null;
  hidden: null | string;
  number: null | number;
  radio: null | string;
  richText: string;
  select: null | string;
  switch: boolean | null;
  text: null | string;
  transfer: null | string[];
};

const fieldFormDefaults: FieldForm = {
  autocomplete: 'alpha',
  boolean: true,
  booleanSwitch: false,
  date: new Date('2024-01-02T00:00:00.000Z'),
  file: null,
  hidden: 'hidden value',
  number: 12,
  radio: 'cat',
  richText: '<p>Rich text value</p>',
  select: 'apple',
  switch: false,
  text: 'Text value',
  transfer: ['pear'],
};

const fieldDefinitions: FormFieldDefinition<FieldForm>[] = [
  {
    definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
    label: 'Autocomplete',
    name: 'autocomplete',
    options: [{ label: 'Alpha', value: 'alpha' }],
  },
  {
    definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN,
    label: 'Boolean',
    name: 'boolean',
  },
  {
    definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH,
    label: 'Boolean switch',
    name: 'booleanSwitch',
  },
  {
    definition: FORM_FIELD_DEFINITION_TYPE.DATE,
    label: 'Date',
    name: 'date',
  },
  {
    accept: 'text/plain',
    definition: FORM_FIELD_DEFINITION_TYPE.FILE,
    label: 'File',
    name: 'file',
  },
  {
    definition: FORM_FIELD_DEFINITION_TYPE.HIDDEN,
    label: 'Hidden field',
    name: 'hidden',
  },
  {
    definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
    label: 'Number',
    name: 'number',
  },
  {
    definition: FORM_FIELD_DEFINITION_TYPE.RADIO_GROUP,
    label: 'Radio',
    name: 'radio',
    options: [
      { label: 'Cat', value: 'cat' },
      { label: 'Dog', value: 'dog' },
    ],
  },
  {
    definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT,
    label: 'Rich text',
    name: 'richText',
  },
  {
    definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
    label: 'Select',
    name: 'select',
    options: [{ label: 'Apple', value: 'apple' }],
  },
  {
    definition: FORM_FIELD_DEFINITION_TYPE.SWITCH,
    label: 'Switch',
    name: 'switch',
  },
  {
    definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
    label: 'Text',
    name: 'text',
  },
  {
    definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST,
    label: 'Transfer list',
    name: 'transfer',
    options: [{ label: 'Pear', value: 'pear' }],
  },
];

type DisabledForm = {
  disabled: string;
  enabled: string;
};

type GenericFormHarnessProps<TFormFields extends FieldValues> = {
  readonly initialValues?: UseFormProps<TFormFields>['defaultValues'];
} & Omit<GenericFormProps<TFormFields>, 'formMethods'>;

type GroupForm = {
  grouped: string;
  noMessages: string;
  orphan: string;
  plain: string;
};

const GenericFormHarness = <TFormFields extends FieldValues,>({
  initialValues,
  ...props
}: GenericFormHarnessProps<TFormFields>): ReactElement => {
  const formMethods = useForm<TFormFields>({
    defaultValues: initialValues,
  });

  return (
    <GenericForm<TFormFields>
      {...props}
      formMethods={formMethods}
    />
  );
};

const wrapWithSubmitButton = (children: ReactElement): ReactElement => (
  <>
    {children}
    <button type={'submit'}>
      {'Submit form'}
    </button>
  </>
);

const onFormSubmit = vi.fn<NonNullable<GenericFormProps<GroupForm>['onSubmit']>>((event) => {
  event.preventDefault();
});

describe('GenericForm', () => {
  it('renders each supported field type and omits hidden fields', async () => {
    const screen = await renderComponent(
      <GenericFormHarness<FieldForm>
        formFieldDefinitions={fieldDefinitions}
        initialValues={fieldFormDefaults}
      />,
    );

    await expect.element(screen.getByRole('combobox', { name: 'Autocomplete' })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { name: 'Boolean' })).toBeVisible();
    await expect.element(screen.getByRole('switch', { name: 'Boolean switch' })).toBeVisible();
    await expect.element(screen.getByTestId('DatePicker')).toBeVisible();
    await expect.element(screen.getByTestId('UploadButton')).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Number' })).toBeVisible();
    await expect.element(screen.getByRole('radiogroup', { name: 'Radio' })).toBeVisible();
    await expect.element(screen.getByText('Rich text value')).toBeVisible();
    await expect.element(screen.getByRole('combobox', { name: 'Select' })).toBeVisible();
    await expect.element(screen.getByRole('switch', { name: 'Switch' })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Text' })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Filter' })).toBeVisible();
    await expect.element(screen.getByText('Hidden field')).not.toBeInTheDocument();
  });

  it('sorts fields and groups, renders group content and actions, and leaves unmatched fields ungrouped', async () => {
    const onMessageClick = vi.fn();
    const definitions: FormFieldDefinition<GroupForm>[] = [
      {
        contentAfter: (
          <span>
            {'After grouped field'}
          </span>
        ),
        contentBefore: (
          <span>
            {'Before grouped field'}
          </span>
        ),
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        groupKey: 'main',
        label: 'Grouped field',
        name: 'grouped',
        order: 2,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        groupKey: 'unknown',
        label: 'Orphan field',
        name: 'orphan',
        order: 0,
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        groupKey: 'no-messages',
        label: 'No-message field',
        name: 'noMessages',
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: 'Plain field',
        name: 'plain',
        order: 1,
      },
    ];
    const groups: FormGroupDefinition[] = [
      {
        groupKey: 'empty',
        label: 'Empty group',
        order: 0,
      },
      {
        contentAfter: (
          <span>
            {'After main group'}
          </span>
        ),
        contentBefore: (
          <span>
            {'Before main group'}
          </span>
        ),
        description: 'Main group description',
        groupKey: 'main',
        label: 'Main group',
        messages: [
          {
            buttonLabel: 'Run group action',
            message: 'Action available',
            onButtonClick: onMessageClick,
            severity: 'info',
          },
          {
            buttonLabel: 'No callback',
            message: 'No action callback',
            severity: 'warning',
          },
          {
            message: 'No action label',
            onButtonClick: onMessageClick,
            severity: 'error',
          },
        ],
        order: 1,
      },
      {
        groupKey: 'no-messages',
        label: 'No messages group',
        order: 2,
      },
    ];
    const screen = await renderComponent(
      <GenericFormHarness<GroupForm>
        formFieldDefinitions={definitions}
        formGroupDefinitions={groups}
        initialValues={{ grouped: '', noMessages: '', orphan: '', plain: '' }}
      />,
    );

    await expect.element(screen.getByText('Main group')).toBeVisible();
    await expect.element(screen.getByText('Main group description')).toBeVisible();
    await expect.element(screen.getByText('Before main group')).toBeVisible();
    await expect.element(screen.getByText('After main group')).toBeVisible();
    await expect.element(screen.getByText('Before grouped field')).toBeVisible();
    await expect.element(screen.getByText('After grouped field')).toBeVisible();
    await expect.element(screen.getByText('No messages group')).toBeVisible();
    await expect.element(screen.getByText('Empty group')).not.toBeInTheDocument();
    await expect.element(screen.getByText('Action available')).toBeVisible();
    await expect.element(screen.getByText('No action callback')).toBeVisible();
    await expect.element(screen.getByText('No action label')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Run group action' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'No callback' })).not.toBeInTheDocument();

    await screen.getByRole('button', { name: 'Run group action' }).click();
    expect(onMessageClick).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole('textbox', { name: 'Orphan field' })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Plain field' })).toBeVisible();
  });

  it('uses custom field and group renderers and wraps and submits the form', async () => {
    const definitions: FormFieldDefinition<GroupForm>[] = [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        groupKey: 'main',
        label: 'Grouped field',
        name: 'grouped',
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: 'Plain field',
        name: 'plain',
      },
    ];
    const groups: FormGroupDefinition[] = [{ groupKey: 'main', label: 'Custom group' }];
    onFormSubmit.mockClear();
    const renderField = vi.fn((_definition: FormFieldDefinition<GroupForm>, element: ReactElement) => (
      <div>
        {element}
      </div>
    ));
    const renderGroup = vi.fn((group: FormGroupDefinition, children: ReactElement) => (
      <section aria-label={group.label}>
        {children}
      </section>
    ));
    const screen = await renderComponent(
      <GenericFormHarness<GroupForm>
        formFieldDefinitions={definitions}
        formGroupDefinitions={groups}
        formId={'custom-form'}
        initialValues={{ grouped: '', noMessages: '', orphan: '', plain: '' }}
        onSubmit={onFormSubmit}
        renderField={renderField}
        renderGroup={renderGroup}
        wrapForm={wrapWithSubmitButton}
      />,
    );

    expect(screen.container.querySelector('form')?.id).toBe('custom-form');
    await expect.element(screen.getByRole('region', { name: 'Custom group' })).toBeVisible();
    expect(renderField).toHaveBeenCalledTimes(2);
    expect(renderGroup).toHaveBeenCalledOnce();

    await screen.getByRole('button', { name: 'Submit form' }).click();
    expect(onFormSubmit).toHaveBeenCalledOnce();
  });

  it('combines per-field and global disabling and derives required labels from the schema', async () => {
    const formFieldDefinitions: FormFieldDefinition<DisabledForm>[] = [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        disabled: true,
        label: 'Disabled field',
        name: 'disabled',
      },
      {
        definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
        label: 'Enabled field',
        name: 'enabled',
      },
    ];
    const schema = object({
      disabled: string().required(),
      enabled: string().required(),
    }) as ObjectSchema<DisabledForm, DisabledForm>;
    const perFieldScreen = await renderComponent(
      <GenericFormHarness<DisabledForm>
        formFieldDefinitions={formFieldDefinitions}
        initialValues={{ disabled: '', enabled: '' }}
        schema={schema}
      />,
    );

    await expect.element(perFieldScreen.getByRole('textbox', { name: 'Disabled field' })).toBeDisabled();
    await expect.element(perFieldScreen.getByRole('textbox', { name: 'Enabled field' })).toBeEnabled();
    await expect.element(perFieldScreen.getByText('*', { exact: true })).toBeVisible();

    await perFieldScreen.rerender(
      <GenericFormHarness<DisabledForm>
        disableAll
        formFieldDefinitions={formFieldDefinitions}
        initialValues={{ disabled: '', enabled: '' }}
        schema={schema}
      />,
    );

    await expect.element(perFieldScreen.getByRole('textbox', { name: 'Disabled field' })).toBeDisabled();
    await expect.element(perFieldScreen.getByRole('textbox', { name: 'Enabled field' })).toBeDisabled();
  });

  it('throws for a field definition outside the supported union', async () => {
    const invalidDefinitions = [{ definition: 'unsupported', label: 'Invalid', name: 'enabled' }] as never;

    await expect(
      renderComponent(
        <GenericFormHarness<DisabledForm>
          formFieldDefinitions={invalidDefinitions}
          initialValues={{ disabled: '', enabled: '' }}
        />,
      ),
    ).rejects.toThrow('Unsupported form field definition');
  });
});
