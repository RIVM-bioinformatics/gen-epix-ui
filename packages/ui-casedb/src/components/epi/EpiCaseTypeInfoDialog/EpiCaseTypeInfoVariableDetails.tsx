import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import isNumber from 'lodash/isNumber';
import type {
  CaseDbCompleteCaseType,
  CaseDbDim,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';

import { EpiDataManager } from '../../../classes/managers/EpiDataManager';

import { EpiCaseTypeInfoColAccessRights } from './EpiCaseTypeInfoColAccessRights';

export type EpiCaseTypeInfoVariableDetailsProps = {
  readonly completeCaseType: CaseDbCompleteCaseType;
  readonly dim: CaseDbDim;
};

export const EpiCaseTypeInfoVariableDetails = ({ completeCaseType, dim }: EpiCaseTypeInfoVariableDetailsProps) => {
  const { t } = useTranslation();
  const cols = completeCaseType.ordered_col_ids_by_dim[dim.id].map(x => completeCaseType.cols[x]);

  return (
    <>
      <Typography
        component={'p'}
        sx={{
          marginBottom: 2,
        }}
      >
        {dim.description}
      </Typography>
      <Table
        aria-label={t('Table describing columns inside {{dimensionCode}}', { dimensionCode: dim.code }).toString()}
        size={'small'}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '15%' }}>
              {t`Column`}
            </TableCell>
            <TableCell sx={{ width: '30%' }}>
              {t`Description`}
            </TableCell>
            <TableCell sx={{ width: '15%' }}>
              {t`Type`}
            </TableCell>
            <TableCell sx={{ width: '20%' }}>
              {t`Constraints`}
            </TableCell>
            <TableCell sx={{ width: '20%' }}>
              {t`Access rights`}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cols.filter(col => {
            // filter out columns that are of type GENETIC_DISTANCE
            const refCol = completeCaseType.ref_cols[col.ref_col_id];
            return refCol.col_type !== CaseDbColType.GENETIC_DISTANCE;
          }).map(col => {
            const refCol = completeCaseType.ref_cols[col.ref_col_id];
            return (
              <TableRow key={col.id}>
                <TableCell sx={{ verticalAlign: 'top', width: '15%' }}>
                  {col.code}
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top', width: '30%' }}>
                  {refCol.description}
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top', width: '15%' }}>
                  {refCol.col_type}
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top', width: '20%' }}>
                  {([
                    CaseDbColType.DECIMAL_0,
                    CaseDbColType.DECIMAL_1,
                    CaseDbColType.DECIMAL_2,
                    CaseDbColType.DECIMAL_3,
                    CaseDbColType.DECIMAL_4,
                    CaseDbColType.DECIMAL_5,
                    CaseDbColType.DECIMAL_6,
                  ] as CaseDbColType[]).includes(refCol.col_type) && (isNumber(col.min_value) || isNumber(col.max_value)) && (
                    <>
                      {t('min: {{min}}; max: {{max}}', { max: col.max_value, min: col.min_value })}
                    </>
                  )}
                  {([
                    CaseDbColType.TIME_DAY,
                    CaseDbColType.TIME_MONTH,
                    CaseDbColType.TIME_QUARTER,
                    CaseDbColType.TIME_WEEK,
                    CaseDbColType.TIME_YEAR,
                  ] as CaseDbColType[]).includes(refCol.col_type) && (col.min_datetime || col.max_datetime) && (
                    <>
                      {t('from: {{from}}; to: {{to}}', { from: col.min_datetime ?? '-', to: col.max_datetime ?? '-' })}
                    </>
                  )}
                  {refCol.col_type === CaseDbColType.TEXT && col.max_length && (
                    <>
                      {t('Max length: {{maxLength}}', { maxLength: col.max_length })}
                    </>
                  )}
                  {refCol.col_type === CaseDbColType.GEO_REGION && refCol.region_set_id && (
                    <>
                      {EpiDataManager.getInstance().data.regionSets[refCol.region_set_id].name}
                    </>
                  )}
                  {([CaseDbColType.NOMINAL, CaseDbColType.ORDINAL] as CaseDbColType[]).includes(refCol.col_type) && refCol.concept_set_id && EpiDataManager.getInstance().data.conceptsBySetId[refCol.concept_set_id] && (
                    <Box
                      sx={{
                        maxWidth: '100%',
                      }}
                    >
                      <Stack
                        sx={{
                          columnGap: 1,
                          direction: 'row',
                          flexWrap: 'wrap',
                          rowGap: 1,
                        }}
                      >
                        {EpiDataManager.getInstance().data.conceptsBySetId[refCol.concept_set_id].map(concept => (
                          <Chip
                            key={concept.id}
                            label={`${concept.name} (${concept.code})`}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top', width: '20%' }}>
                  <EpiCaseTypeInfoColAccessRights
                    colId={col.id}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};
