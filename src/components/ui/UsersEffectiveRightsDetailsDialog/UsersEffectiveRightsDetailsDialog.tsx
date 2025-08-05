import { useTranslation } from 'react-i18next';
import {
  Box,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import type {
  PropsWithChildren,
  ReactElement,
  SyntheticEvent,
} from 'react';
import {
  useState,
  useCallback,
  useEffect,
} from 'react';

import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import type { DialogAction } from '../Dialog';
import type { UserEffectiveRight } from '../../../models/caseAccess';
import type { User } from '../../../api';
import { useCaseTypeMapQuery } from '../../../dataHooks/useCaseTypesQuery';
import { useArray } from '../../../hooks/useArray';
import { ResponseHandler } from '../ResponseHandler';
import {
  useCaseTypeSetNameFactory,
  useCaseTypeSetsMapQuery,
} from '../../../dataHooks/useCaseTypeSetsQuery';
import { useDataCollectionsMapQuery } from '../../../dataHooks/useDataCollectionsQuery';
import { DataUtil } from '../../../utils/DataUtil';
import { useCaseTypeColSetsMapQuery } from '../../../dataHooks/useCaseTypeColSetsQuery';
import {
  useCaseTypeColMapQuery,
  useCaseTypeColNameFactory,
} from '../../../dataHooks/useCaseTypeColsQuery';
import { useCaseTypeColSetMembersQuery } from '../../../dataHooks/useCaseTypeColSetMembersQuery';
import { useCaseTypeSetMembersQuery } from '../../../dataHooks/useCaseTypeSetMembersQuery';


export type UsersEffectiveRightsDetailsType = 'caseTypeSets' | 'readColSets' | 'writeColSets';

export interface UsersEffectiveRightsDetailsDialogOpenProps {
  userEffectiveRight: UserEffectiveRight;
  type: 'caseTypeSets' | 'readColSets' | 'writeColSets';
  user: User;
}

const usersEffectiveRightsDetailsTypeOrder = ['caseTypeSets', 'readColSets', 'writeColSets'] as const;

export interface UsersEffectiveRightsDetailsDialogProps extends WithDialogRenderProps<UsersEffectiveRightsDetailsDialogOpenProps> {
  //
}

export type UsersEffectiveRightsDetailsDialogRefMethods = WithDialogRefMethods<UsersEffectiveRightsDetailsDialogProps, UsersEffectiveRightsDetailsDialogOpenProps>;

type CustomTabPanelProps = PropsWithChildren<{
  readonly index: number;
  readonly value: number;
}>;

const CustomTabPanel = (props: CustomTabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      aria-labelledby={`simple-tab-${index}`}
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      role="tabpanel"
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
};

export const UsersEffectiveRightsDetailsDialog = withDialog<UsersEffectiveRightsDetailsDialogProps, UsersEffectiveRightsDetailsDialogOpenProps>((
  {
    onTitleChange,
    onActionsChange,
    onClose,
    openProps: { userEffectiveRight, type, user },
  }: UsersEffectiveRightsDetailsDialogProps,
): ReactElement => {
  const [t] = useTranslation();
  const [activeTab, setActiveTab] = useState(usersEffectiveRightsDetailsTypeOrder.indexOf(type));

  const caseTypeMapQuery = useCaseTypeMapQuery();
  const caseTypeSetMapQuery = useCaseTypeSetsMapQuery();
  const caseTypeSetNameFactory = useCaseTypeSetNameFactory();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const caseTypeColSetsMapQuery = useCaseTypeColSetsMapQuery();
  const caseTypeColMapQuery = useCaseTypeColMapQuery();
  const caseTypeColNameFactory = useCaseTypeColNameFactory();
  const caseTypeSetMembersQuery = useCaseTypeSetMembersQuery();
  const caseTypeColSetMembersQuery = useCaseTypeColSetMembersQuery();

  const loadables = useArray([
    caseTypeMapQuery,
    caseTypeSetMapQuery,
    caseTypeSetNameFactory,
    dataCollectionsMapQuery,
    caseTypeColSetsMapQuery,
    caseTypeColMapQuery,
    caseTypeColNameFactory,
    caseTypeSetMembersQuery,
    caseTypeColSetMembersQuery,
  ]);

  const handleTabChange = useCallback((_event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  useEffect(() => {
    onTitleChange(t('{{userName}} effective rights details for {{dataCollectionName}}', { userName: DataUtil.getUserDisplayValue(user, t), dataCollectionName: dataCollectionsMapQuery.map.get(userEffectiveRight.data_collection_id)?.name ?? userEffectiveRight.data_collection_id }));
  }, [dataCollectionsMapQuery.map, onTitleChange, t, user, userEffectiveRight.data_collection_id]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push({
      ...TestIdUtil.createAttributes('UsersEffectiveRightsDetailsDialog-closeButton'),
      color: 'secondary',
      variant: 'contained',
      label: t`Close`,
      onClick: onClose,
    });
    onActionsChange(actions);
  }, [onActionsChange, onClose, t]);

  return (
    <ResponseHandler
      inlineSpinner
      loadables={loadables}
    >
      {!loadables.some(x => x.isLoading) && (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              aria-label="basic tabs example"
              onChange={handleTabChange}
              value={activeTab}
            >
              <Tab
                label="Case types"
                {...a11yProps(0)}
              />
              <Tab
                label="Read columns"
                {...a11yProps(1)}
              />
              <Tab
                label="Write columns"
                {...a11yProps(2)}
              />
              <Tab
                label="Rights"
                {...a11yProps(3)}
              />
            </Tabs>
          </Box>
          <CustomTabPanel
            index={0}
            value={activeTab}
          >
            { !userEffectiveRight.categorized_case_type_ids.length && !userEffectiveRight.uncategorized_case_type_ids.length && (
              <Box marginY={2}>
                <Typography variant="h5">
                  {t`No case types assigned`}
                </Typography>
              </Box>
            )}

            { userEffectiveRight.case_type_set_ids.length > 0 && (
              <Box marginY={2}>
                <Typography variant="h5">
                  {t`Case type sets`}
                </Typography>
                {userEffectiveRight.case_type_set_ids.map((caseTypeSetId) => {
                  const caseTypeSet = caseTypeSetMapQuery.map.get(caseTypeSetId);
                  const caseTypeSetMembers = caseTypeSetMembersQuery.data.filter(x => x.case_type_set_id === caseTypeSetId);
                  const sortedCaseTypeSetMembers = caseTypeSetMembers.sort((a, b) => {
                    const caseTypeA = caseTypeMapQuery.map.get(a.case_type_id);
                    const caseTypeB = caseTypeMapQuery.map.get(b.case_type_id);
                    return (caseTypeA?.name ?? '').localeCompare(caseTypeB?.name ?? '');
                  });
                  return (
                    <Box key={caseTypeSetId}>
                      <Box marginY={1}>
                        <Typography variant="h6">
                          {caseTypeSetNameFactory.getName(caseTypeSet) ?? caseTypeSetId}
                        </Typography>
                        {sortedCaseTypeSetMembers.map((caseTypeSetMember) => {
                          const caseType = caseTypeMapQuery.map.get(caseTypeSetMember.case_type_id);
                          return (
                            <Box key={caseTypeSetMember.case_type_id}>
                              {caseType?.name ?? caseTypeSetMember.case_type_id}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
            { userEffectiveRight.uncategorized_case_type_ids.length > 0 && (
              <Box marginY={2}>
                <Typography variant="h5">
                  {t`Uncategorized case types`}
                </Typography>
                {userEffectiveRight.uncategorized_case_type_ids.sort((a, b) => {
                  const caseTypeA = caseTypeMapQuery.map.get(a);
                  const caseTypeB = caseTypeMapQuery.map.get(b);
                  return (caseTypeA?.name ?? '').localeCompare(caseTypeB?.name ?? '');
                }).map((caseTypeId) => {
                  const caseType = caseTypeMapQuery.map.get(caseTypeId);
                  return (
                    <Box key={caseTypeId}>
                      {caseType?.name ?? caseTypeId}
                    </Box>
                  );
                })}
              </Box>
            )}
          </CustomTabPanel>

          <CustomTabPanel
            index={1}
            value={activeTab}
          >
            { !userEffectiveRight.categorized_read_case_type_col_ids.length && !userEffectiveRight.uncategorized_read_case_type_col_ids.length && (
              <Box marginY={2}>
                <Typography variant="h5">
                  {t`No read columns assigned`}
                </Typography>
              </Box>
            )}

            { userEffectiveRight.read_case_type_col_set_ids.length > 0 && (
              <Box marginY={2}>
                <Typography variant="h5">
                  {t`Read columns sets`}
                </Typography>
                {userEffectiveRight.read_case_type_col_set_ids.map((colSetId) => {
                  const colSet = caseTypeColSetsMapQuery.map.get(colSetId);
                  const colSetMembers = caseTypeColSetMembersQuery.data.filter(x => x.case_type_col_set_id === colSetId);
                  const sortedColSetMembers = colSetMembers.sort((a, b) => {
                    const colA = caseTypeColMapQuery.map.get(a.case_type_col_id);
                    const colB = caseTypeColMapQuery.map.get(b.case_type_col_id);
                    const colAName = caseTypeColNameFactory.getName(colA) ?? a.case_type_col_id;
                    const colBName = caseTypeColNameFactory.getName(colB) ?? b.case_type_col_id;
                    return colAName.localeCompare(colBName);
                  });
                  return (
                    <Box key={colSetId}>
                      <Box marginY={1}>
                        <Typography variant="h6">
                          {colSet?.name ?? colSetId}
                        </Typography>
                        {sortedColSetMembers.map((colSetMember) => {
                          const col = caseTypeColMapQuery.map.get(colSetMember.case_type_col_id);
                          return (
                            <Box key={col.id}>
                              {(col && caseTypeColNameFactory.getName(col)) ?? colSetMember.case_type_col_id}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
            { userEffectiveRight.uncategorized_read_case_type_col_ids.length > 0 && (
              <Box marginY={2}>
                <Typography variant="h5">
                  {t`Uncategorized read columns sets`}
                </Typography>
                {userEffectiveRight.uncategorized_read_case_type_col_ids.sort((a, b) => {
                  const colA = caseTypeColMapQuery.map.get(a);
                  const colB = caseTypeColMapQuery.map.get(b);
                  const colAName = caseTypeColNameFactory.getName(colA) ?? a;
                  const colBName = caseTypeColNameFactory.getName(colB) ?? b;
                  return colAName.localeCompare(colBName);
                }).map((colId) => {
                  const col = caseTypeColMapQuery.map.get(colId);
                  return (
                    <Box key={colId}>
                      {caseTypeColNameFactory.getName(col) ?? colId}
                    </Box>
                  );
                })}
              </Box>
            )}
          </CustomTabPanel>

          <CustomTabPanel
            index={2}
            value={activeTab}
          >
            { !userEffectiveRight.categorized_write_case_type_col_ids.length && !userEffectiveRight.uncategorized_write_case_type_col_ids.length && (
              <Box marginY={2}>
                <Typography variant="h5">
                  {t`No write columns assigned`}
                </Typography>
              </Box>
            )}

            { userEffectiveRight.write_case_type_col_set_ids.length > 0 && (
              <Box marginY={2}>
                <Typography variant="h5">
                  {t`Write columns sets`}
                </Typography>
                {userEffectiveRight.write_case_type_col_set_ids.map((colSetId) => {
                  const colSet = caseTypeColSetsMapQuery.map.get(colSetId);
                  const colSetMembers = caseTypeColSetMembersQuery.data.filter(x => x.case_type_col_set_id === colSetId);
                  const sortedColSetMembers = colSetMembers.sort((a, b) => {
                    const colA = caseTypeColMapQuery.map.get(a.case_type_col_id);
                    const colB = caseTypeColMapQuery.map.get(b.case_type_col_id);
                    const colAName = caseTypeColNameFactory.getName(colA) ?? a.case_type_col_id;
                    const colBName = caseTypeColNameFactory.getName(colB) ?? b.case_type_col_id;
                    return colAName.localeCompare(colBName);
                  });
                  return (
                    <Box key={colSetId}>
                      <Box marginY={1}>
                        <Typography variant="h6">
                          {colSet?.name ?? colSetId}
                        </Typography>
                        {sortedColSetMembers.map((colSetMember) => {
                          const col = caseTypeColMapQuery.map.get(colSetMember.case_type_col_id);
                          return (
                            <Box key={col.id}>
                              {caseTypeColNameFactory.getName(col) ?? colSetMember.case_type_col_id}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
            { userEffectiveRight.uncategorized_write_case_type_col_ids.length > 0 && (
              <Box marginY={2}>
                <Typography variant="h5">
                  {t`Uncategorized write columns sets`}
                </Typography>
                {userEffectiveRight.uncategorized_write_case_type_col_ids.sort((a, b) => {
                  const colA = caseTypeColMapQuery.map.get(a);
                  const colB = caseTypeColMapQuery.map.get(b);
                  const colAName = caseTypeColNameFactory.getName(colA) ?? a;
                  const colBName = caseTypeColNameFactory.getName(colB) ?? b;
                  return colAName.localeCompare(colBName);
                }).map((colId) => {
                  const col = caseTypeColMapQuery.map.get(colId);
                  return (
                    <Box key={colId}>
                      {caseTypeColNameFactory.getName(col) ?? colId}
                    </Box>
                  );
                })}
              </Box>
            )}
          </CustomTabPanel>

          <CustomTabPanel
            index={3}
            value={activeTab}
          >
            <Box
              component={'dl'}
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <dt>{t`Add case`}</dt>
              <dd>{userEffectiveRight.add_case ? t`Yes` : t`No`}</dd>
              <dt>{t`Remove case`}</dt>
              <dd>{userEffectiveRight.remove_case ? t`Yes` : t`No`}</dd>
              <dt>{t`Add case set`}</dt>
              <dd>{userEffectiveRight.add_case_set ? t`Yes` : t`No`}</dd>
              <dt>{t`Remove case set`}</dt>
              <dd>{userEffectiveRight.remove_case_set ? t`Yes` : t`No`}</dd>
              <dt>{t`Read case set`}</dt>
              <dd>{userEffectiveRight.read_case_set ? t`Yes` : t`No`}</dd>
              <dt>{t`Write case set`}</dt>
              <dd>{userEffectiveRight.write_case_set ? t`Yes` : t`No`}</dd>
              <dt>{t`Private`}</dt>
              <dd>{userEffectiveRight.is_private ? t`Yes` : t`No`}</dd>
            </Box>
          </CustomTabPanel>
        </Box>
      )}
    </ResponseHandler>
  );
}, {
  testId: 'UsersEffectiveRightsDetailsDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
  noCloseButton: false,
  disableBackdropClick: false,
});
