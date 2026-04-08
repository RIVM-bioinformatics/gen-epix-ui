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

import { useCaseTypeAbacContext } from '../../../context/caseTypeAbac';

export type EpiCaseTypeInfoColAccessRightsProps = {
  readonly colId: string;
};

type DataCollectionAccess = {
  readonly dataCollectionId: string;
  readonly dataCollectionName: string;
  readonly hasWriteAccess: boolean;
  readonly hasReadAccess: boolean;
};

const MAX_ITEMS = 5;

export const EpiCaseTypeInfoColAccessRights = ({ colId }: EpiCaseTypeInfoColAccessRightsProps) => {
  const { t } = useTranslation();
  const caseTypeAbacContext = useCaseTypeAbacContext();
  const [shouldShowMore, setShouldShowMore] = useState(false);

  const onShowMoreButtonClick = useCallback(() => {
    setShouldShowMore(true);
  }, []);

  const dataCollectionAccesses = useMemo<DataCollectionAccess[]>(() => {
    const x: DataCollectionAccess[] = [];
    caseTypeAbacContext.caseTypeAccessAbacs.forEach(caseTypeAccessAbac => {
      const dataCollection = caseTypeAbacContext.userDataCollectionsMap.get(caseTypeAccessAbac.data_collection_id);
      const hasWriteAccess = caseTypeAccessAbac.write_col_ids.includes(colId);
      const hasReadAccess = caseTypeAccessAbac.read_col_ids.includes(colId);
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
  }, [caseTypeAbacContext.caseTypeAccessAbacs, caseTypeAbacContext.userDataCollectionsMap, colId]);

  const canRead = caseTypeAbacContext.effectiveColumnAccessRights.get(colId)?.read;
  const canWrite = caseTypeAbacContext.effectiveColumnAccessRights.get(colId)?.write;
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
      <Box
        sx={{
          marginBottom: 1,
        }}
      >
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
