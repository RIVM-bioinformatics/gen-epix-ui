import {
  use,
  useCallback,
  useEffect,
} from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import type { CaseDbConfig } from '../../../../models/config.models';
import type {
  Highlighting,
  LineListRangeSubjectValue,
  LinkedScrollSubjectValue,
} from '../../../../models/case-db.models';
import { createUserProfileStore } from '../../../../stores/userProfileStore/userProfileStore';
import { UserProfileStoreContext } from '../../../../stores/userProfileStore/userProfileStoreContext';
import { renderComponent } from '../../../../test/lib';
import { COMPLETE_CASE_TYPE_ID } from '../../../../test/fixtures/completeCaseType';

import { DashboardContext } from './DashboardContext';
import { DashboardContextProvider } from './DashboardContextProvider';

const CASE_SET_ID = '6b1c3a9e-2f4d-4c8a-9e7b-1a2b3c4d5e6f';
const CASE_SET_NAME = 'Event one';
const CATEGORY_ID = '1f2e3d4c-5b6a-4789-8abc-0d1e2f3a4b5c';
const STATUS_ID = '2a3b4c5d-6e7f-4801-9a2b-3c4d5e6f7a8b';
const DATA_COLLECTION_ID = '0c7d2a4e-8b1f-4e6a-9d3c-5f2b1a0e9d8c';
const HIGHLIGHT_LABEL = 'Highlight';
const RESET_LABEL = 'Reset';
// The provider emits origin null on reset although the Highlighting type declares a string.
const EMPTY_HIGHLIGHTING = { caseIds: [], origin: null } as unknown as Highlighting;
const HIGHLIGHTING: Highlighting = { caseIds: ['case-1', 'case-2'], origin: 'TEST_ORIGIN' };

const createCaseSet = (): CaseDbCaseSet => {
  return {
    case_set_category_id: CATEGORY_ID,
    case_set_status_id: STATUS_ID,
    case_type_id: COMPLETE_CASE_TYPE_ID,
    code: 'event-code',
    created_in_data_collection_id: DATA_COLLECTION_ID,
    description: 'Event description',
    id: CASE_SET_ID,
    name: CASE_SET_NAME,
  };
};

type ContextProbeProps = {
  readonly onHighlight: (highlighting: Highlighting) => void;
  readonly onLineListRange: (value: LineListRangeSubjectValue) => void;
  readonly onLinkedScroll: (value: LinkedScrollSubjectValue) => void;
};

const ContextProbe = ({ onHighlight, onLineListRange, onLinkedScroll }: ContextProbeProps) => {
  const dashboardContext = use(DashboardContext);

  const onClickHighlightButton = useCallback(() => {
    dashboardContext.highlight(HIGHLIGHTING);
  }, [dashboardContext]);

  const onClickResetButton = useCallback(() => {
    dashboardContext.reset();
  }, [dashboardContext]);

  useEffect(() => {
    const unsubscribeHighlight = dashboardContext.highlightSubject.subscribe(onHighlight);
    const unsubscribeLineListRange = dashboardContext.lineListRangeSubject.subscribe(onLineListRange);
    const unsubscribeLinkedScroll = dashboardContext.linkedScrollSubject.subscribe(onLinkedScroll);
    return () => {
      unsubscribeHighlight();
      unsubscribeLineListRange();
      unsubscribeLinkedScroll();
    };
  }, [dashboardContext, onHighlight, onLineListRange, onLinkedScroll]);

  return (
    <div>
      <span {...TestIdUtil.createAttributes('DashboardContextProbe-caseSetName')}>
        {dashboardContext.caseSet?.name}
      </span>
      <button
        onClick={onClickHighlightButton}
        type={'button'}
      >
        {HIGHLIGHT_LABEL}
      </button>
      <button
        onClick={onClickResetButton}
        type={'button'}
      >
        {RESET_LABEL}
      </button>
    </div>
  );
};

const renderProvider = async (isHighlightingEnabled: boolean) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = createUserProfileStore(config);
  userProfileStore.setState({ dashboardGeneralSettings: { isHighlightingEnabled } });
  const onHighlight = vi.fn<(highlighting: Highlighting) => void>();
  const onLineListRange = vi.fn<(value: LineListRangeSubjectValue) => void>();
  const onLinkedScroll = vi.fn<(value: LinkedScrollSubjectValue) => void>();
  const screen = await renderComponent(
    <UserProfileStoreContext value={userProfileStore}>
      <DashboardContextProvider caseSet={createCaseSet()}>
        <ContextProbe
          onHighlight={onHighlight}
          onLineListRange={onLineListRange}
          onLinkedScroll={onLinkedScroll}
        />
      </DashboardContextProvider>
    </UserProfileStoreContext>,
  );
  return { onHighlight, onLineListRange, onLinkedScroll, screen };
};

describe('DashboardContextProvider', () => {
  it('should provide the case set to consumers', async () => {
    const { screen } = await renderProvider(true);

    expect(screen.getByTestId('DashboardContextProbe-caseSetName').element().textContent).toBe(CASE_SET_NAME);
  });

  it('should forward highlighting to subscribers when highlighting is enabled', async () => {
    const { onHighlight, screen } = await renderProvider(true);

    await userEvent.click(screen.getByRole('button', { name: HIGHLIGHT_LABEL }));

    expect(onHighlight).toHaveBeenCalledTimes(1);
    expect(onHighlight).toHaveBeenCalledWith(HIGHLIGHTING, EMPTY_HIGHLIGHTING);
  });

  it('should not forward highlighting to subscribers when highlighting is disabled', async () => {
    const { onHighlight, screen } = await renderProvider(false);

    await userEvent.click(screen.getByRole('button', { name: HIGHLIGHT_LABEL }));

    expect(onHighlight).not.toHaveBeenCalled();
  });

  it('should emit empty highlighting, undefined line list range and undefined linked scroll on reset', async () => {
    const { onHighlight, onLineListRange, onLinkedScroll, screen } = await renderProvider(true);

    await userEvent.click(screen.getByRole('button', { name: RESET_LABEL }));

    expect(onHighlight).toHaveBeenCalledWith(EMPTY_HIGHLIGHTING, EMPTY_HIGHLIGHTING);
    expect(onLineListRange).toHaveBeenCalledWith(undefined, undefined);
    expect(onLinkedScroll).toHaveBeenCalledWith(undefined, undefined);
  });

  it('should emit reset even when highlighting is disabled', async () => {
    const { onHighlight, screen } = await renderProvider(false);

    await userEvent.click(screen.getByRole('button', { name: RESET_LABEL }));

    expect(onHighlight).toHaveBeenCalledTimes(1);
    expect(onHighlight).toHaveBeenCalledWith(EMPTY_HIGHLIGHTING, EMPTY_HIGHLIGHTING);
  });
});
