import { useTranslation } from 'react-i18next';
import {
  Box,
  Link,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import type {
  ReactElement,
  SyntheticEvent,
} from 'react';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import type { CaseDbUser } from '@gen-epix/api-casedb';
import type {
  DialogAction,
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import {
  CommonDataUtil,
  LoadableUtil,
  ResponseHandler,
  TestIdUtil,
  useArray,
  withDialog,
} from '@gen-epix/ui';

import { useCaseTypeSetMembersQuery } from '../../../dataHooks/useCaseTypeSetMembersQuery';
import {
  useCaseTypeSetNameFactory,
  useCaseTypeSetsMapQuery,
} from '../../../dataHooks/useCaseTypeSetsQuery';
import { useCaseTypeMapQuery } from '../../../dataHooks/useCaseTypesQuery';
import { useColSetMembersQuery } from '../../../dataHooks/useColSetMembersQuery';
import { useColSetMapQuery } from '../../../dataHooks/useColSetsQuery';
import {
  useColMapQuery,
  useColNameFactory,
} from '../../../dataHooks/useColsQuery';
import { useDataCollectionsMapQuery } from '../../../dataHooks/useDataCollectionsQuery';
import type { UserEffectiveRight } from '../../../models/caseAccess';
import { EpiCustomTabPanel } from '../../epi/EpiCustomTabPanel';


export interface UsersEffectiveRightsDetailsDialogOpenProps {
  type: 'caseTypeSets' | 'readColSets' | 'writeColSets';
  user: CaseDbUser;
  userEffectiveRight: UserEffectiveRight;
}

export type UsersEffectiveRightsDetailsType = 'caseTypeSets' | 'readColSets' | 'writeColSets';

const usersEffectiveRightsDetailsTypeOrder = ['caseTypeSets', 'readColSets', 'writeColSets'] as const;

export interface UsersEffectiveRightsDetailsDialogProps extends WithDialogRenderProps<UsersEffectiveRightsDetailsDialogOpenProps> {
  //
}

export type UsersEffectiveRightsDetailsDialogRefMethods = WithDialogRefMethods<UsersEffectiveRightsDetailsDialogProps, UsersEffectiveRightsDetailsDialogOpenProps>;

const a11yProps = (index: number) => {
  return {
    'aria-controls': `simple-tabpanel-${index}`,
    id: `simple-tab-${index}`,
  };
};

export const UsersEffectiveRightsDetailsDialog = withDialog<UsersEffectiveRightsDetailsDialogProps, UsersEffectiveRightsDetailsDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps: { type, user, userEffectiveRight },
  }: UsersEffectiveRightsDetailsDialogProps,
): ReactElement => {

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(usersEffectiveRightsDetailsTypeOrder.indexOf(type));
  const [visibleItems, setVisibleItems] = useState<string[]>([]);

  const caseTypeMapQuery = useCaseTypeMapQuery();
  const caseTypeSetMapQuery = useCaseTypeSetsMapQuery();
  const caseTypeSetNameFactory = useCaseTypeSetNameFactory();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const colSetMapQuery = useColSetMapQuery();
  const colMapQuery = useColMapQuery();
  const colNameFactory = useColNameFactory();
  const caseTypeSetMembersQuery = useCaseTypeSetMembersQuery();
  const colSetMembersQuery = useColSetMembersQuery();

  const loadables = useArray([
    caseTypeMapQuery,
    caseTypeSetMapQuery,
    caseTypeSetNameFactory,
    dataCollectionsMapQuery,
    colSetMapQuery,
    colMapQuery,
    colNameFactory,
    caseTypeSetMembersQuery,
    colSetMembersQuery,
  ]);

  const onTabChange = useCallback((_event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  const onToggleSectionLinkClick = useCallback((key: string) => {
    setVisibleItems((prev) => {
      if (prev.includes(key)) {
        return prev.filter(item => item !== key);
      }
      return [...prev, key];
    });
  }, []);

  useEffect(() => {
    onTitleChange(t('{{userName}} effective rights details for {{dataCollectionName}}', { dataCollectionName: dataCollectionsMapQuery.map.get(userEffectiveRight.data_collection_id)?.name ?? userEffectiveRight.data_collection_id, userName: CommonDataUtil.getUserDisplayValue(user, t) }));
  }, [dataCollectionsMapQuery.map, onTitleChange, t, user, userEffectiveRight.data_collection_id]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push({
      ...TestIdUtil.createAttributes('UsersEffectiveRightsDetailsDialog-closeButton'),
      color: 'secondary',
      label: t`Close`,
      onClick: onClose,
      variant: 'contained',
    });
    onActionsChange(actions);
  }, [onActionsChange, onClose, t]);

  const isLoading = LoadableUtil.isSomeLoading(loadables);
  return (
    <ResponseHandler
      inlineSpinner
      loadables={loadables}
    >
      {!isLoading && (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              aria-label={'basic tabs example'}
              onChange={onTabChange}
              value={activeTab}
            >
              <Tab
                label={'Case types'}
                {...a11yProps(0)}
              />
              <Tab
                label={'Read columns'}
                {...a11yProps(1)}
              />
              <Tab
                label={'Write columns'}
                {...a11yProps(2)}
              />
              <Tab
                label={'Rights'}
                {...a11yProps(3)}
              />
              <Tab
                label={'Additional rights'}
                {...a11yProps(4)}
              />
            </Tabs>
          </Box>
          <EpiCustomTabPanel
            index={0}
            value={activeTab}
          >
            { !userEffectiveRight.categorized_case_type_ids.length && !userEffectiveRight.uncategorized_case_type_ids.length && (
              <Box
                sx={{
                  marginY: 2,
                }}
              >
                {t`No case types assigned`}
              </Box>
            )}
            { userEffectiveRight.case_type_set_ids.length > 0 && (
              <Box>
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
                      <Box
                        sx={{
                          marginY: 1,
                        }}
                      >
                        <Link
                          href={'#'}
                          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                          onClick={() => onToggleSectionLinkClick(`case-type-sets-${caseTypeSetId}`)}
                          tabIndex={0}
                        >
                          {caseTypeSetNameFactory.getName(caseTypeSet) ?? caseTypeSetId}
                        </Link>
                        <Box sx={{ display: visibleItems.includes(`case-type-sets-${caseTypeSetId}`) ? 'block' : 'none' }}>
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
                    </Box>
                  );
                })}
              </Box>
            )}
            { userEffectiveRight.uncategorized_case_type_ids.length > 0 && (
              <Box
                sx={{
                  marginY: 1,
                }}
              >
                <Link
                  href={'#'}
                  // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                  onClick={() => onToggleSectionLinkClick(`uncategorized-case-type-sets`)}
                  tabIndex={0}
                >
                  {t`Uncategorized case types`}
                </Link>
                <Box sx={{ display: visibleItems.includes(`uncategorized-case-type-sets`) ? 'block' : 'none' }}>
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
              </Box>
            )}
          </EpiCustomTabPanel>
          <EpiCustomTabPanel
            index={1}
            value={activeTab}
          >
            { !userEffectiveRight.categorized_read_col_ids.length && !userEffectiveRight.uncategorized_read_col_ids.length && (
              <Box
                sx={{
                  marginY: 2,
                }}
              >
                {t`No read columns assigned`}
              </Box>
            )}
            { userEffectiveRight.read_col_set_ids.length > 0 && (
              <Box>
                {userEffectiveRight.read_col_set_ids.map((colSetId) => {
                  const colSet = colSetMapQuery.map.get(colSetId);
                  const colSetMembers = colSetMembersQuery.data.filter(x => x.col_set_id === colSetId);
                  const sortedColSetMembers = colSetMembers.sort((a, b) => {
                    const colA = colMapQuery.map.get(a.col_id);
                    const colB = colMapQuery.map.get(b.col_id);
                    const colAName = colNameFactory.getName(colA) ?? a.col_id;
                    const colBName = colNameFactory.getName(colB) ?? b.col_id;
                    return colAName.localeCompare(colBName);
                  });
                  return (
                    <Box key={colSetId}>
                      <Box
                        sx={{
                          marginY: 1,
                        }}
                      >
                        <Link
                          href={'#'}
                          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                          onClick={() => onToggleSectionLinkClick(`read-col-sets-${colSetId}`)}
                          tabIndex={0}
                        >
                          {colSet?.name ?? colSetId}
                        </Link>
                        <Box sx={{ display: visibleItems.includes(`read-col-sets-${colSetId}`) ? 'block' : 'none' }}>
                          {sortedColSetMembers.map((colSetMember) => {
                            const refCol = colMapQuery.map.get(colSetMember.col_id);
                            return (
                              <Box key={refCol.id}>
                                {(refCol && colNameFactory.getName(refCol)) ?? colSetMember.col_id}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
            { userEffectiveRight.uncategorized_read_col_ids.length > 0 && (
              <Box
                sx={{
                  marginY: 1,
                }}
              >
                <Typography variant={'h5'}>
                  {t`Uncategorized read columns sets`}
                </Typography>
                <Link
                  href={'#'}
                  // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                  onClick={() => onToggleSectionLinkClick(`uncategorized-read-col-sets`)}
                  tabIndex={0}
                >
                  {t`Uncategorized read columns sets`}
                </Link>
                <Box sx={{ display: visibleItems.includes(`uncategorized-read-col-sets`) ? 'block' : 'none' }}>
                  {userEffectiveRight.uncategorized_read_col_ids.sort((a, b) => {
                    const colA = colMapQuery.map.get(a);
                    const colB = colMapQuery.map.get(b);
                    const colAName = colNameFactory.getName(colA) ?? a;
                    const colBName = colNameFactory.getName(colB) ?? b;
                    return colAName.localeCompare(colBName);
                  }).map((colId) => {
                    const refCol = colMapQuery.map.get(colId);
                    return (
                      <Box key={colId}>
                        {colNameFactory.getName(refCol) ?? colId}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </EpiCustomTabPanel>
          <EpiCustomTabPanel
            index={2}
            value={activeTab}
          >
            { !userEffectiveRight.categorized_write_col_ids.length && !userEffectiveRight.uncategorized_write_col_ids.length && (
              <Box
                sx={{
                  marginY: 2,
                }}
              >
                {t`No write columns assigned`}
              </Box>
            )}
            { userEffectiveRight.write_col_set_ids.length > 0 && (
              <Box>
                {userEffectiveRight.write_col_set_ids.map((colSetId) => {
                  const colSet = colSetMapQuery.map.get(colSetId);
                  const colSetMembers = colSetMembersQuery.data.filter(x => x.col_set_id === colSetId);
                  const sortedColSetMembers = colSetMembers.sort((a, b) => {
                    const colA = colMapQuery.map.get(a.col_id);
                    const colB = colMapQuery.map.get(b.col_id);
                    const colAName = colNameFactory.getName(colA) ?? a.col_id;
                    const colBName = colNameFactory.getName(colB) ?? b.col_id;
                    return colAName.localeCompare(colBName);
                  });
                  return (
                    <Box key={colSetId}>
                      <Box
                        sx={{
                          marginY: 1,
                        }}
                      >
                        <Link
                          href={'#'}
                          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                          onClick={() => onToggleSectionLinkClick(`write-col-sets-${colSetId}`)}
                          tabIndex={0}
                        >
                          {colSet?.name ?? colSetId}
                        </Link>
                        <Box sx={{ display: visibleItems.includes(`write-col-sets-${colSetId}`) ? 'block' : 'none' }}>
                          {sortedColSetMembers.map((colSetMember) => {
                            const refCol = colMapQuery.map.get(colSetMember.col_id);
                            return (
                              <Box key={refCol.id}>
                                {colNameFactory.getName(refCol) ?? colSetMember.col_id}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
            { userEffectiveRight.uncategorized_write_col_ids.length > 0 && (
              <Box
                sx={{
                  marginY: 1,
                }}
              >
                <Link
                  href={'#'}
                  // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                  onClick={() => onToggleSectionLinkClick(`uncategorized-write-col-sets`)}
                  tabIndex={0}
                >
                  {t`Uncategorized write columns sets`}
                </Link>
                <Box sx={{ display: visibleItems.includes(`uncategorized-write-col-sets`) ? 'block' : 'none' }}>
                  {userEffectiveRight.uncategorized_write_col_ids.sort((a, b) => {
                    const colA = colMapQuery.map.get(a);
                    const colB = colMapQuery.map.get(b);
                    const colAName = colNameFactory.getName(colA) ?? a;
                    const colBName = colNameFactory.getName(colB) ?? b;
                    return colAName.localeCompare(colBName);
                  }).map((colId) => {
                    const refCol = colMapQuery.map.get(colId);
                    return (
                      <Box key={colId}>
                        {colNameFactory.getName(refCol) ?? colId}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </EpiCustomTabPanel>
          <EpiCustomTabPanel
            index={3}
            value={activeTab}
          >
            <Box
              component={'dl'}
              sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}
            >
              <dt>
                {t`Add case`}
              </dt>
              <dd>
                {userEffectiveRight.add_case ? t`Yes` : t`No`}
              </dd>
              <dt>
                {t`Remove case`}
              </dt>
              <dd>
                {userEffectiveRight.remove_case ? t`Yes` : t`No`}
              </dd>
              <dt>
                {t`Add case set`}
              </dt>
              <dd>
                {userEffectiveRight.add_case_set ? t`Yes` : t`No`}
              </dd>
              <dt>
                {t`Remove case set`}
              </dt>
              <dd>
                {userEffectiveRight.remove_case_set ? t`Yes` : t`No`}
              </dd>
              <dt>
                {t`Read case set`}
              </dt>
              <dd>
                {userEffectiveRight.read_case_set ? t`Yes` : t`No`}
              </dd>
              <dt>
                {t`Write case set`}
              </dt>
              <dd>
                {userEffectiveRight.write_case_set ? t`Yes` : t`No`}
              </dd>
              <dt>
                {t`Private`}
              </dt>
              <dd>
                {userEffectiveRight.is_private ? t`Yes` : t`No`}
              </dd>
            </Box>
          </EpiCustomTabPanel>
          <EpiCustomTabPanel
            index={4}
            value={activeTab}
          >
            <Box
              sx={{
                marginY: 2,
              }}
            >
              { !userEffectiveRight.effective_share_case_rights.length && (
                <Box
                  sx={{
                    marginY: 2,
                  }}
                >
                  {t`No additional rights assigned`}
                </Box>
              )}
              {userEffectiveRight.effective_share_case_rights.map((right) => (
                <Box
                  key={right.from_data_collection_id}
                  sx={{
                    marginY: 2,
                  }}
                >
                  <Box>
                    <Typography variant={'h5'}>
                      {t('From: {{dataCollectionName}}', {
                        dataCollectionName: dataCollectionsMapQuery.map.get(right.from_data_collection_id)?.name ?? right.from_data_collection_id,
                      })}
                    </Typography>
                  </Box>
                  <Box>
                    {right.categorized_case_type_ids.length === 0 && right.uncategorized_case_type_ids.length === 0 && (
                      <Box
                        sx={{
                          marginY: 2,
                        }}
                      >
                        {t`No case types assigned`}
                      </Box>
                    )}
                    {right.case_type_set_ids.map((caseTypeSetId) => {
                      const caseTypeSet = caseTypeSetMapQuery.map.get(caseTypeSetId);
                      const caseTypeSetMembers = caseTypeSetMembersQuery.data.filter(x => x.case_type_set_id === caseTypeSetId);
                      const sortedCaseTypeSetMembers = caseTypeSetMembers.sort((a, b) => {
                        const caseTypeA = caseTypeMapQuery.map.get(a.case_type_id);
                        const caseTypeB = caseTypeMapQuery.map.get(b.case_type_id);
                        return (caseTypeA?.name ?? '').localeCompare(caseTypeB?.name ?? '');
                      });
                      return (
                        <Box key={caseTypeSetId}>
                          <Box
                            sx={{
                              marginY: 1,
                            }}
                          >
                            <Link
                              href={'#'}
                              // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                              onClick={() => onToggleSectionLinkClick(`${right.from_data_collection_id}-${caseTypeSetId}`)}
                              tabIndex={0}
                            >
                              {caseTypeSetNameFactory.getName(caseTypeSet) ?? caseTypeSetId}
                            </Link>
                            <Box sx={{ display: visibleItems.includes(`${right.from_data_collection_id}-${caseTypeSetId}`) ? 'block' : 'none' }}>
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
                        </Box>
                      );
                    })}
                    {right.uncategorized_case_type_ids.length > 0 && (
                      <Box
                        sx={{
                          marginY: 2,
                        }}
                      >
                        <Link
                          href={'#'}
                          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                          onClick={() => onToggleSectionLinkClick(`${right.from_data_collection_id}-uncategorized`)}
                          tabIndex={0}
                        >
                          {t`Uncategorized case types`}
                        </Link>
                        <Box sx={{ display: visibleItems.includes(`${right.from_data_collection_id}-uncategorized`) ? 'block' : 'none' }}>
                          {right.uncategorized_case_type_ids.sort((a, b) => {
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
                      </Box>
                    )}
                  </Box>
                  <Box
                    component={'dl'}
                    sx={{ display: 'grid', gap: 0, gridTemplateColumns: '1fr 1fr' }}
                  >
                    <dt>
                      {t`Add case`}
                    </dt>
                    <dd>
                      {right.add_case ? t`Yes` : t`No`}
                    </dd>
                    <dt>
                      {t`Remove case`}
                    </dt>
                    <dd>
                      {right.remove_case ? t`Yes` : t`No`}
                    </dd>
                    <dt>
                      {t`Add case set`}
                    </dt>
                    <dd>
                      {right.add_case_set ? t`Yes` : t`No`}
                    </dd>
                    <dt>
                      {t`Remove case set`}
                    </dt>
                    <dd>
                      {right.remove_case_set ? t`Yes` : t`No`}
                    </dd>
                  </Box>
                </Box>
              ))}

            </Box>
          </EpiCustomTabPanel>
        </Box>
      )}
    </ResponseHandler>
  );
}, {
  defaultTitle: '',
  disableBackdropClick: false,
  fullWidth: true,
  maxWidth: 'lg',
  noCloseButton: false,
  testId: 'UsersEffectiveRightsDetailsDialog',
});
