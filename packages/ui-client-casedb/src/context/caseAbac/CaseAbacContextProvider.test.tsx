import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseRights,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';
import type { OptionBase } from '@gen-epix/ui-core-form/models/form.models';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { renderComponent } from '../../test/lib';

import type { CaseAbacContext } from './CaseAbacContext';
import { CaseAbacContextProvider } from './CaseAbacContextProvider';
import { useCaseAbacContext } from './useCaseAbacContext';

const PROBE_TEST_ID = 'CaseAbacContextProvider-probe';

const dataCollectionOne = { id: 'dc-1', name: 'Data collection 1' } satisfies CaseDbDataCollection;
const dataCollectionTwo = { id: 'dc-2', name: 'Data collection 2' } satisfies CaseDbDataCollection;
const dataCollectionThree = { id: 'dc-3', name: 'Data collection 3' } satisfies CaseDbDataCollection;

const userDataCollectionOptions: OptionBase<string>[] = [
  { label: 'Data collection 1', value: 'dc-1' },
  { label: 'Data collection 2', value: 'dc-2' },
  { label: 'Data collection 3', value: 'dc-3' },
];

const createRights = (overrides: Partial<CaseDbCaseRights> = {}): CaseDbCaseRights => ({
  add_data_collection_ids: [],
  can_delete: false,
  case_id: 'case-1',
  case_type_id: 'case-type-1',
  created_in_data_collection_id: 'dc-1',
  data_collection_ids: [],
  is_full_access: false,
  read_col_ids: [],
  remove_data_collection_ids: [],
  shared_in_data_collection_ids: [],
  write_col_ids: [],
  ...overrides,
});

const createCaseAbac = (overrides: Partial<CaseAbacContext> = {}): CaseAbacContext => ({
  itemDataCollectionLinks: [],
  rights: [],
  userDataCollectionOptions,
  userDataCollections: [dataCollectionOne, dataCollectionTwo, dataCollectionThree],
  userDataCollectionsMap: new Map([
    [dataCollectionOne.id, dataCollectionOne],
    [dataCollectionThree.id, dataCollectionThree],
    [dataCollectionTwo.id, dataCollectionTwo],
  ]),
  ...overrides,
});

const ContextProbe = (props: {
  readonly selectValue: (caseAbac: CaseAbacContext) => unknown;
}) => {
  const caseAbac = useCaseAbacContext();
  return (
    <pre {...TestIdUtil.createAttributes(PROBE_TEST_ID)}>
      {JSON.stringify(props.selectValue(caseAbac))}
    </pre>
  );
};

const renderProvider = async (
  caseAbac: CaseAbacContext,
  selectValue: (caseAbac: CaseAbacContext) => unknown,
) => {
  const screen = await renderComponent(
    <CaseAbacContextProvider caseAbac={caseAbac}>
      <ContextProbe selectValue={selectValue} />
    </CaseAbacContextProvider>,
  );
  const probeText = screen.getByTestId(PROBE_TEST_ID).element().textContent ?? 'null';
  return JSON.parse(probeText) as unknown;
};

describe('CaseAbacContextProvider', () => {
  it('renders its children', async () => {
    const screen = await renderComponent(
      <CaseAbacContextProvider caseAbac={createCaseAbac()}>
        <div>
          {'Case ABAC child'}
        </div>
      </CaseAbacContextProvider>,
    );

    await expect.element(screen.getByText('Case ABAC child')).toBeInTheDocument();
  });

  it('keeps the original context values unchanged', async () => {
    const caseAbac = createCaseAbac({
      createdInDataCollection: dataCollectionOne,
      rights: [createRights()],
    });

    const values = await renderProvider(caseAbac, (context) => ({
      createdInDataCollection: context.createdInDataCollection,
      rights: context.rights,
      userDataCollectionOptions: context.userDataCollectionOptions,
      userDataCollections: context.userDataCollections,
    }));

    expect(values).toEqual({
      createdInDataCollection: dataCollectionOne,
      rights: [createRights()],
      userDataCollectionOptions,
      userDataCollections: [dataCollectionOne, dataCollectionTwo, dataCollectionThree],
    });
  });

  it('resolves the data collections of each right and drops unknown data collection ids', async () => {
    const caseAbac = createCaseAbac({
      rights: [
        createRights({ data_collection_ids: ['dc-1', 'unknown', 'dc-2'] }),
        createRights({ data_collection_ids: [] }),
      ],
    });

    const itemDataCollections = await renderProvider(caseAbac, (context) => context.itemDataCollections);

    expect(itemDataCollections).toEqual([
      [dataCollectionOne, dataCollectionTwo],
      [],
    ]);
  });

  it('keeps only the data collections in which each right is shared', async () => {
    const caseAbac = createCaseAbac({
      rights: [
        createRights({
          data_collection_ids: ['dc-1', 'dc-2', 'dc-3'],
          shared_in_data_collection_ids: ['dc-2', 'dc-3'],
        }),
        createRights({
          data_collection_ids: ['dc-1'],
          shared_in_data_collection_ids: [],
        }),
      ],
    });

    const itemSharedInDataCollections = await renderProvider(caseAbac, (context) => context.itemSharedInDataCollections);

    expect(itemSharedInDataCollections).toEqual([
      [dataCollectionTwo, dataCollectionThree],
      [],
    ]);
  });

  it('returns no data collection options for each right when the user has no data collection options', async () => {
    const caseAbac = createCaseAbac({
      rights: [createRights(), createRights()],
      userDataCollectionOptions: [],
    });

    const itemDataCollectionOptions = await renderProvider(caseAbac, (context) => context.itemDataCollectionOptions);

    expect(itemDataCollectionOptions).toEqual([[], []]);
  });

  it('marks shared data collections as selected and disables those that cannot be removed', async () => {
    const caseAbac = createCaseAbac({
      rights: [createRights({
        add_data_collection_ids: ['dc-2'],
        created_in_data_collection_id: 'dc-1',
        shared_in_data_collection_ids: ['dc-1'],
      })],
    });

    const itemDataCollectionOptions = await renderProvider(caseAbac, (context) => context.itemDataCollectionOptions);

    expect(itemDataCollectionOptions).toEqual([[
      { disabled: true, label: 'Data collection 1', value: 'dc-1' },
      { disabled: false, label: 'Data collection 2', value: 'dc-2' },
    ]]);
  });

  it('offers full access rights to add and remove any data collection except the creating one', async () => {
    const caseAbac = createCaseAbac({
      rights: [createRights({
        created_in_data_collection_id: 'dc-1',
        is_full_access: true,
        shared_in_data_collection_ids: ['dc-3'],
      })],
    });

    const itemDataCollectionOptions = await renderProvider(caseAbac, (context) => context.itemDataCollectionOptions);

    expect(itemDataCollectionOptions).toEqual([[
      { disabled: false, label: 'Data collection 2', value: 'dc-2' },
      { disabled: false, label: 'Data collection 3', value: 'dc-3' },
    ]]);
  });

  it('keeps a shared data collection that can be removed as enabled', async () => {
    const caseAbac = createCaseAbac({
      rights: [createRights({
        created_in_data_collection_id: 'dc-1',
        remove_data_collection_ids: ['dc-2'],
        shared_in_data_collection_ids: ['dc-1', 'dc-2'],
      })],
    });

    const itemDataCollectionOptions = await renderProvider(caseAbac, (context) => context.itemDataCollectionOptions);

    expect(itemDataCollectionOptions).toEqual([[
      { disabled: true, label: 'Data collection 1', value: 'dc-1' },
      { disabled: false, label: 'Data collection 2', value: 'dc-2' },
    ]]);
  });

  it('hides data collections that are neither shared nor can be added', async () => {
    const caseAbac = createCaseAbac({
      rights: [createRights({
        add_data_collection_ids: [],
        created_in_data_collection_id: 'dc-1',
        shared_in_data_collection_ids: [],
      })],
    });

    const itemDataCollectionOptions = await renderProvider(caseAbac, (context) => context.itemDataCollectionOptions);

    expect(itemDataCollectionOptions).toEqual([[]]);
  });
});
