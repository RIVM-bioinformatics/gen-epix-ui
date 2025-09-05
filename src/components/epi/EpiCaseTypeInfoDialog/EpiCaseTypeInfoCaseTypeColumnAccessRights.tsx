import type { ReactNode } from 'react';
import {
  Fragment,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  Box,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useEpiCaseTypeAbacContext } from '../../../context/epiCaseTypeAbac';

export type EpiCaseTypeInfoCaseTypeColumnAccessRightsProps = {
  readonly caseTypeColumnId: string;
};

type DataCollectionAccess = {
  readonly dataCollectionId: string;
  readonly dataCollectionName: string;
  readonly hasWriteAccess: boolean;
  readonly hasReadAccess: boolean;
};

const MAX_ITEMS = 5;

export const EpiCaseTypeInfoCaseTypeColumnAccessRights = ({ caseTypeColumnId }: EpiCaseTypeInfoCaseTypeColumnAccessRightsProps) => {
  const [t] = useTranslation();
  const caseTypeAbacContext = useEpiCaseTypeAbacContext();
  const [shouldShowMore, setShouldShowMore] = useState(false);

  const onShowMoreButtonClick = useCallback(() => {
    setShouldShowMore(true);
  }, []);

  const dataCollectionAccesses = useMemo<DataCollectionAccess[]>(() => {
    const x: DataCollectionAccess[] = [];
    caseTypeAbacContext.caseTypeAccessAbacs.forEach(caseTypeAccessAbac => {
      const dataCollection = caseTypeAbacContext.userDataCollectionsMap.get(caseTypeAccessAbac.data_collection_id);
      const hasWriteAccess = caseTypeAccessAbac.write_case_type_col_ids.includes(caseTypeColumnId);
      const hasReadAccess = caseTypeAccessAbac.read_case_type_col_ids.includes(caseTypeColumnId);
      if (hasWriteAccess || hasReadAccess) {
        x.push({
          dataCollectionId: dataCollection.id,
          dataCollectionName: dataCollection.name,
          hasWriteAccess,
          hasReadAccess,
        });
      }
    });
    return x;
  }, [caseTypeAbacContext.caseTypeAccessAbacs, caseTypeAbacContext.userDataCollectionsMap, caseTypeColumnId]);

  const canRead = caseTypeAbacContext.effectiveColumnAccessRights.get(caseTypeColumnId)?.read;
  const canWrite = caseTypeAbacContext.effectiveColumnAccessRights.get(caseTypeColumnId)?.write;
  let effectiveRightLabel;
  if (canRead && canWrite) {
    effectiveRightLabel = t`read/write`;
  } else if (canRead) {
    effectiveRightLabel = t`read`;
  } else if (canWrite) {
    effectiveRightLabel = t`write`;
  } else {
    effectiveRightLabel = t`no access`;
  }

  return (
    <Box>
      <Box marginBottom={1}>
        <Box>
          {t('Effective rights: {{effectiveRightLabel}}', { effectiveRightLabel })}
        </Box>
      </Box>
      <Box>
        {dataCollectionAccesses.slice(0, shouldShowMore ? undefined : MAX_ITEMS).map(dataCollectionAccess => {
          let element: ReactNode;
          if (dataCollectionAccess.hasWriteAccess && dataCollectionAccess.hasReadAccess) {
            element = (
              <>
                {t('{{dataCollectionName}}: read/write', { dataCollectionName: dataCollectionAccess.dataCollectionName })}
              </>
            );
          } else if (dataCollectionAccess.hasWriteAccess) {
            element = (
              <>
                {t('{{dataCollectionName}}: write', { dataCollectionName: dataCollectionAccess.dataCollectionName })}
              </>
            );
          } else if (dataCollectionAccess.hasReadAccess) {
            element = (
              <>
                {t('{{dataCollectionName}}: read', { dataCollectionName: dataCollectionAccess.dataCollectionName })}
              </>
            );
          }
          return (
            <Fragment key={dataCollectionAccess.dataCollectionId}>
              <Box>
                {element}
              </Box>
            </Fragment>
          );
        })}
        {dataCollectionAccesses.length > MAX_ITEMS && !shouldShowMore && (
          <Button
            size={'small'}
            variant={'text'}
            onClick={onShowMoreButtonClick}
          >
            {t('Show more')}
          </Button>
        )}
      </Box>
    </Box>
  );
};
