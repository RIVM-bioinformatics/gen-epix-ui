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
  CompleteCaseType,
  Dim,
} from '@gen-epix/api-casedb';
import { ColType } from '@gen-epix/api-casedb';

import { EpiDataManager } from '../../../classes/managers/EpiDataManager';

import { EpiCaseTypeInfoColAccessRights } from './EpiCaseTypeInfoColAccessRights';

export type EpiCaseTypeInfoVariableDetailsProps = {
  readonly completeCaseType: CompleteCaseType;
  readonly dim: Dim;
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
            return refCol.col_type !== ColType.GENETIC_DISTANCE;
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
                    ColType.DECIMAL_0,
                    ColType.DECIMAL_1,
                    ColType.DECIMAL_2,
                    ColType.DECIMAL_3,
                    ColType.DECIMAL_4,
                    ColType.DECIMAL_5,
                    ColType.DECIMAL_6,
                  ] as ColType[]).includes(refCol.col_type) && (isNumber(col.min_value) || isNumber(col.max_value)) && (
                    <>
                      {t('min: {{min}}; max: {{max}}', { max: col.max_value, min: col.min_value })}
                    </>
                  )}
                  {([
                    ColType.TIME_DAY,
                    ColType.TIME_MONTH,
                    ColType.TIME_QUARTER,
                    ColType.TIME_WEEK,
                    ColType.TIME_YEAR,
                  ] as ColType[]).includes(refCol.col_type) && (col.min_datetime || col.max_datetime) && (
                    <>
                      {t('from: {{from}}; to: {{to}}', { from: col.min_datetime ?? '-', to: col.max_datetime ?? '-' })}
                    </>
                  )}
                  {refCol.col_type === ColType.TEXT && col.max_length && (
                    <>
                      {t('Max length: {{maxLength}}', { maxLength: col.max_length })}
                    </>
                  )}
                  {refCol.col_type === ColType.GEO_REGION && refCol.region_set_id && (
                    <>
                      {EpiDataManager.instance.data.regionSets[refCol.region_set_id].name}
                    </>
                  )}
                  {([ColType.NOMINAL, ColType.ORDINAL] as ColType[]).includes(refCol.col_type) && refCol.concept_set_id && EpiDataManager.instance.data.conceptsBySetId[refCol.concept_set_id] && (
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
                        {EpiDataManager.instance.data.conceptsBySetId[refCol.concept_set_id].map(concept => (
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
