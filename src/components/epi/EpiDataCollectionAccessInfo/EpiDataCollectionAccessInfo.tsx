import { useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useEpiCaseAbacContext } from '../../../context/epiCaseAbac';

export const EpiDataCollectionAccessInfo = () => {
  const [t] = useTranslation();

  const caseAbacContext = useEpiCaseAbacContext();

  const canRemoveItemFromDataCollection = useCallback((dataCollectionId: string) => {
    return caseAbacContext?.rights?.[0]?.remove_data_collection_ids?.includes(dataCollectionId);
  }, [caseAbacContext.rights]);

  if (!caseAbacContext.itemDataCollections || caseAbacContext.itemDataCollections?.length === 0) {
    return (
      <Box sx={{ fontStyle: 'italic' }}>{t`None`}</Box>
    );
  }

  return (
    <Table size={'small'}>
      <TableHead>
        <TableRow>
          <TableCell sx={{
            width: 'calc(100% * 1/3)',
          }}
          >
            {t`Data collection`}
          </TableCell>
          <TableCell sx={{
            width: 'calc(100% * 2/3)',
          }}
          >
            {t`Removable`}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {caseAbacContext.itemSharedInDataCollections[0].map((dataCollection) => (
          <TableRow key={dataCollection.id}>
            <TableCell>
              {dataCollection.name}
            </TableCell>
            <TableCell>
              {canRemoveItemFromDataCollection(dataCollection.id) ? t`Yes` : t`No`}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
