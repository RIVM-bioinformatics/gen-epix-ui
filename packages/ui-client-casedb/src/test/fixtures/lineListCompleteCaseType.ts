import {
  CaseDbColType,
  CaseDbConceptSetType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbConcept,
  CaseDbConceptSet,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';

import {
  COMPLETE_CASE_TYPE_DATA_COLLECTION_ID,
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_TEXT_COL_ID,
  createCompleteCaseType,
} from './completeCaseType';

export const LINE_LIST_DIM_OTHER_ID = 'dim-other';
export const LINE_LIST_DIM_DISTANCE_ID = 'dim-distance';
export const LINE_LIST_DIM_SEX_ID = 'dim-sex';
export const SEX_COL_ID = 'col-sex';
export const ORGANIZATION_COL_ID = 'col-organization';
export const SEQUENCE_COL_ID = 'col-sequence';
export const DISTANCE_COL_ID = 'col-distance';
export const DECIMAL_COL_ID = 'col-decimal';
export const CONCEPT_SET_SEX_ID = 'concept-set-sex';

const REF_DIM_OTHER_ID = 'ref-dim-other';
const REF_DIM_DISTANCE_ID = 'ref-dim-distance';
const REF_DIM_SEX_ID = 'ref-dim-sex';
const REF_COL_SEX_ID = 'ref-col-sex';
const REF_COL_ORGANIZATION_ID = 'ref-col-organization';
const REF_COL_SEQUENCE_ID = 'ref-col-sequence';
const REF_COL_DISTANCE_ID = 'ref-col-distance';
const REF_COL_DECIMAL_ID = 'ref-col-decimal';

export const LINE_LIST_CONCEPT_SETS: CaseDbConceptSet[] = [
  { code: CONCEPT_SET_SEX_ID, id: CONCEPT_SET_SEX_ID, name: 'Sex set', type: CaseDbConceptSetType.NOMINAL },
];
export const LINE_LIST_CONCEPTS: CaseDbConcept[] = [
  { code: 'MALE', concept_set_id: CONCEPT_SET_SEX_ID, id: 'concept-male', name: 'Male' },
  { code: 'FEMALE', concept_set_id: CONCEPT_SET_SEX_ID, id: 'concept-female', name: 'Female' },
];

export const createLineListCompleteCaseType = (): CaseDbCompleteCaseType => {
  const baseCompleteCaseType = createCompleteCaseType();
  const textCol = baseCompleteCaseType.cols[COMPLETE_CASE_TYPE_TEXT_COL_ID];
  const textRefCol = baseCompleteCaseType.ref_cols['ref-col-text'];
  const baseAccess = baseCompleteCaseType.case_type_access_abacs[COMPLETE_CASE_TYPE_DATA_COLLECTION_ID];
  const refDimOther = baseCompleteCaseType.ref_dims['ref-dim-other'];

  // Genetic distance lives in its own dimension, as in real case types. Sharing a dimension with other columns would make
  // FilterUtil skip the dimension while still creating filters for its sibling columns.
  const dims: Record<string, CaseDbDim> = {
    ...baseCompleteCaseType.dims,
    [LINE_LIST_DIM_DISTANCE_ID]: { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'distance', id: LINE_LIST_DIM_DISTANCE_ID, label: 'Distance', rank: 2, ref_dim_id: REF_DIM_DISTANCE_ID },
    // Concept based columns only become multi-select filters in TEXT dimensions, as in real case types.
    [LINE_LIST_DIM_SEX_ID]: { case_type_id: COMPLETE_CASE_TYPE_ID, code: 'sex', id: LINE_LIST_DIM_SEX_ID, label: 'Sex', rank: 3, ref_dim_id: REF_DIM_SEX_ID },
  };
  const refDims: Record<string, CaseDbRefDim> = {
    ...baseCompleteCaseType.ref_dims,
    [REF_DIM_DISTANCE_ID]: { code: 'distance', dim_type: CaseDbDimType.OTHER, id: REF_DIM_DISTANCE_ID, label: 'Distance' },
    [REF_DIM_OTHER_ID]: refDimOther ?? { code: 'other', dim_type: CaseDbDimType.OTHER, id: REF_DIM_OTHER_ID, label: 'Other' },
    [REF_DIM_SEX_ID]: { code: 'sex', dim_type: CaseDbDimType.TEXT, id: REF_DIM_SEX_ID, label: 'Sex' },
  };
  const cols: Record<string, CaseDbCol> = {
    [COMPLETE_CASE_TYPE_TEXT_COL_ID]: textCol,
    [DECIMAL_COL_ID]: { ...textCol, code: 'decimal', dim_id: LINE_LIST_DIM_OTHER_ID, id: DECIMAL_COL_ID, label: 'Decimal', rank: 5, ref_col_id: REF_COL_DECIMAL_ID },
    [DISTANCE_COL_ID]: { ...textCol, code: 'distance', dim_id: LINE_LIST_DIM_DISTANCE_ID, id: DISTANCE_COL_ID, label: 'Distance', rank: 1, ref_col_id: REF_COL_DISTANCE_ID },
    [ORGANIZATION_COL_ID]: { ...textCol, code: 'organization', dim_id: LINE_LIST_DIM_OTHER_ID, id: ORGANIZATION_COL_ID, label: 'Organization', rank: 2, ref_col_id: REF_COL_ORGANIZATION_ID },
    [SEQUENCE_COL_ID]: { ...textCol, code: 'sequence', dim_id: LINE_LIST_DIM_OTHER_ID, id: SEQUENCE_COL_ID, label: 'Sequence', rank: 3, ref_col_id: REF_COL_SEQUENCE_ID },
    [SEX_COL_ID]: { ...textCol, code: 'sex', dim_id: LINE_LIST_DIM_SEX_ID, id: SEX_COL_ID, label: 'Sex', rank: 1, ref_col_id: REF_COL_SEX_ID },
  };
  const refCols: Record<string, CaseDbRefCol> = {
    ...baseCompleteCaseType.ref_cols,
    [REF_COL_DECIMAL_ID]: { ...textRefCol, code: 'decimal', col_type: CaseDbColType.DECIMAL_1, ref_dim_id: REF_DIM_OTHER_ID },
    [REF_COL_DISTANCE_ID]: { ...textRefCol, code: 'distance', col_type: CaseDbColType.GENETIC_DISTANCE, ref_dim_id: REF_DIM_DISTANCE_ID },
    [REF_COL_ORGANIZATION_ID]: { ...textRefCol, code: 'organization', col_type: CaseDbColType.ORGANIZATION, ref_dim_id: REF_DIM_OTHER_ID },
    [REF_COL_SEQUENCE_ID]: { ...textRefCol, code: 'sequence', col_type: CaseDbColType.GENETIC_SEQUENCE, ref_dim_id: REF_DIM_OTHER_ID },
    [REF_COL_SEX_ID]: { ...textRefCol, code: 'sex', col_type: CaseDbColType.NOMINAL, concept_set_id: CONCEPT_SET_SEX_ID, ref_dim_id: REF_DIM_SEX_ID },
  };
  const lineListColIds = [SEX_COL_ID, ORGANIZATION_COL_ID, SEQUENCE_COL_ID, DECIMAL_COL_ID];

  return createCompleteCaseType({
    case_type_access_abacs: {
      [COMPLETE_CASE_TYPE_DATA_COLLECTION_ID]: { ...baseAccess, read_col_ids: [COMPLETE_CASE_TYPE_TEXT_COL_ID, ...lineListColIds, DISTANCE_COL_ID] },
    },
    cols,
    dims,
    ordered_col_ids: [COMPLETE_CASE_TYPE_TEXT_COL_ID, ...lineListColIds, DISTANCE_COL_ID],
    ordered_col_ids_by_dim: {
      [LINE_LIST_DIM_DISTANCE_ID]: [DISTANCE_COL_ID],
      [LINE_LIST_DIM_OTHER_ID]: [COMPLETE_CASE_TYPE_TEXT_COL_ID, ORGANIZATION_COL_ID, SEQUENCE_COL_ID, DECIMAL_COL_ID],
      [LINE_LIST_DIM_SEX_ID]: [SEX_COL_ID],
    },
    ordered_dim_ids: [LINE_LIST_DIM_OTHER_ID, LINE_LIST_DIM_SEX_ID, LINE_LIST_DIM_DISTANCE_ID],
    ref_cols: refCols,
    ref_dims: refDims,
  });
};
