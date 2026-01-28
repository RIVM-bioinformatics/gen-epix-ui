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
  CaseTypeDim,
  CompleteCaseType,
} from '../../../api';
import { ColType } from '../../../api';
import { EpiDataManager } from '../../../classes/managers/EpiDataManager';

import { EpiCaseTypeInfoCaseTypeColumnAccessRights } from './EpiCaseTypeInfoCaseTypeColumnAccessRights';

export type EpiCaseTypeInfoVariableDetailsProps = {
  readonly caseTypeDimension: CaseTypeDim;
  readonly completeCaseType: CompleteCaseType;
};

export const EpiCaseTypeInfoVariableDetails = ({ caseTypeDimension, completeCaseType }: EpiCaseTypeInfoVariableDetailsProps) => {
  const [t] = useTranslation();
  const caseTypeCols = completeCaseType.ordered_case_type_col_ids_by_dim[caseTypeDimension.id].map(x => completeCaseType.case_type_cols[x]);

  return (
    <>
      <Typography
        component={'p'}
        marginBottom={2}
      >
        {caseTypeDimension.description}
      </Typography>
      <Table
        aria-label={t('Table describing columns inside {{dimensionCode}}', { dimensionCode: caseTypeDimension.code }).toString()}
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
          {caseTypeCols.filter(caseTypeCol => {
            // filter out columns that are of type GENETIC_DISTANCE
            const column = completeCaseType.cols[caseTypeCol.col_id];
            return column.col_type !== ColType.GENETIC_DISTANCE;
          }).map(caseTypeCol => {
            const column = completeCaseType.cols[caseTypeCol.col_id];
            return (
              <TableRow key={caseTypeCol.id}>
                <TableCell sx={{ width: '15%', verticalAlign: 'top' }}>
                  {caseTypeCol.code}
                </TableCell>
                <TableCell sx={{ width: '30%', verticalAlign: 'top' }}>
                  {column.description}
                </TableCell>
                <TableCell sx={{ width: '15%', verticalAlign: 'top' }}>
                  {column.col_type}
                </TableCell>
                <TableCell sx={{ width: '20%', verticalAlign: 'top' }}>
                  {([
                    ColType.DECIMAL_0,
                    ColType.DECIMAL_1,
                    ColType.DECIMAL_2,
                    ColType.DECIMAL_3,
                    ColType.DECIMAL_4,
                    ColType.DECIMAL_5,
                    ColType.DECIMAL_6,
                  ] as ColType[]).includes(column.col_type) && (isNumber(caseTypeCol.min_value) || isNumber(caseTypeCol.max_value)) && (
                    <>
                      {t('min: {{min}}; max: {{max}}', { min: caseTypeCol.min_value, max: caseTypeCol.max_value })}
                    </>
                  )}
                  {([
                    ColType.TIME_DAY,
                    ColType.TIME_MONTH,
                    ColType.TIME_QUARTER,
                    ColType.TIME_WEEK,
                    ColType.TIME_YEAR,
                  ] as ColType[]).includes(column.col_type) && (caseTypeCol.min_datetime || caseTypeCol.max_datetime) && (
                    <>
                      {t('from: {{from}}; to: {{to}}', { from: caseTypeCol.min_datetime ?? '-', to: caseTypeCol.max_datetime ?? '-' })}
                    </>
                  )}
                  {column.col_type === ColType.TEXT && caseTypeCol.max_length && (
                    <>
                      {t('Max length: {{maxLength}}', { maxLength: caseTypeCol.max_length })}
                    </>
                  )}
                  {column.col_type === ColType.GEO_REGION && column.region_set_id && (
                    <>
                      {EpiDataManager.instance.data.regionSets[column.region_set_id].name}
                    </>
                  )}
                  {([ColType.NOMINAL, ColType.ORDINAL] as ColType[]).includes(column.col_type) && column.concept_set_id && EpiDataManager.instance.data.conceptsBySetId[column.concept_set_id] && (
                    <Box
                      sx={{
                        maxWidth: '100%',
                      }}
                    >
                      <Stack
                        columnGap={1}
                        direction={'row'}
                        flexWrap={'wrap'}
                        rowGap={1}
                      >
                        {EpiDataManager.instance.data.conceptsBySetId[column.concept_set_id].map(concept => (
                          <Chip
                            key={concept.id}
                            label={`${concept.name} (${concept.code})`}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </TableCell>
                <TableCell sx={{ width: '20%', verticalAlign: 'top' }}>
                  <EpiCaseTypeInfoCaseTypeColumnAccessRights
                    caseTypeColumnId={caseTypeCol.id}
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
