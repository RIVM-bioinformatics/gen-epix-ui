import type {
  CaseDbCase,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  FormFieldDefinition,
  FormGroupDefinition,
  FormGroupMessage,
} from '@gen-epix/ui';
import {
  FORM_FIELD_DEFINITION_TYPE,
  StringUtil,
} from '@gen-epix/ui';
import { isValid } from 'date-fns';
import { t } from 'i18next';
import type { ObjectSchema } from 'yup';
import {
  object,
  string,
} from 'yup';

import { DataService } from '../../classes/services/DataService';
import { AbacUtil } from '../AbacUtil';
import { CaseTypeUtil } from '../CaseTypeUtil';

export class CaseTypeFormUtil {

  public static createFormDefinitions(kwArgs: { completeCaseType: CaseDbCompleteCaseType; enabledColIds?: string[]; includedColIds?: string[]; onClearGroupFields?: (fieldNames: string[]) => void }): { fieldDefinitions: FormFieldDefinition<CaseDbCase['content']>[]; groupDefinitions: FormGroupDefinition[] } {
    const { completeCaseType, enabledColIds, includedColIds, onClearGroupFields } = kwArgs;
    const cols = CaseTypeUtil.getCols(completeCaseType);
    const dimensions = CaseTypeUtil.getDims(completeCaseType);
    const effectiveColumnAccessRights = AbacUtil.createEffectieveColumnAccessRights(Object.values(completeCaseType.case_type_access_abacs));
    const fieldDefinitions: FormFieldDefinition<CaseDbCase['content']>[] = cols.reduce((acc, col) => {
      const hasAccess = effectiveColumnAccessRights.get(col.id)?.write;
      if (!hasAccess) {
        return acc;
      }
      if (includedColIds && !includedColIds.includes(col.id)) {
        return acc;
      }
      const disabled = enabledColIds ? !enabledColIds.includes(col.id) : false;

      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      switch (refCol.col_type) {
        case CaseDbColType.DECIMAL_0:
        case CaseDbColType.DECIMAL_1:
        case CaseDbColType.DECIMAL_2:
        case CaseDbColType.DECIMAL_3:
        case CaseDbColType.DECIMAL_4:
        case CaseDbColType.DECIMAL_5:
        case CaseDbColType.DECIMAL_6:
        case CaseDbColType.ID_CASE:
        case CaseDbColType.ID_EVENT:
        case CaseDbColType.ID_GENETIC_SEQUENCE:
        case CaseDbColType.ID_PERSON:
        case CaseDbColType.ID_SAMPLE:
        case CaseDbColType.TEXT:
        case CaseDbColType.TIME_MONTH:
        case CaseDbColType.TIME_QUARTER:
        case CaseDbColType.TIME_WEEK:
        case CaseDbColType.TIME_YEAR:
          acc.push({
            definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
            disabled,
            label: col.label,
            name: col.id,
          } as const satisfies FormFieldDefinition<CaseDbCase['content']>);
          break;
        case CaseDbColType.GEO_REGION:
          if (DataService.getInstance().data.regionsByRegionSetId[refCol.region_set_id]) {
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
              disabled,
              label: col.label,
              name: col.id,
              options: DataService.getInstance().data.regionsByRegionSetId[refCol.region_set_id].map(region => ({
                label: DataService.getInstance().data.regionSets[refCol.region_set_id].region_code_as_label ? region.code : region.name,
                value: region.id,
              })),
            } as const satisfies FormFieldDefinition<CaseDbCase['content']>);
          }
          break;
        case CaseDbColType.INTERVAL:
        case CaseDbColType.NOMINAL:
        case CaseDbColType.ORDINAL:
          if (DataService.getInstance().data.conceptsBySetId[refCol.concept_set_id]) {
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
              disabled,
              label: col.label,
              name: col.id,
              options: DataService.getInstance().data.conceptsBySetId[refCol.concept_set_id].map(concept => ({
                label: concept.name,
                value: concept.id,
              })),
            } as const satisfies FormFieldDefinition<CaseDbCase['content']>);
          }
          break;
        case CaseDbColType.ORGANIZATION:
          acc.push({
            definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
            disabled,
            label: col.label,
            name: col.id,
            options: (DataService.getInstance().data.organizations ?? []).map(organization => ({
              label: organization.name,
              value: organization.id,
            })).sort((a, b) => StringUtil.advancedSortComperator(a.label, b.label)),
          } as const satisfies FormFieldDefinition<CaseDbCase['content']>);
          break;
        case CaseDbColType.REGULAR_LANGUAGE:
          try {
            new RegExp(col.pattern);
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
              disabled,
              label: col.label,
              name: col.id,
            } as const satisfies FormFieldDefinition<CaseDbCase['content']>);
          } catch (_error) {
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
              disabled,
              label: col.label,
              name: col.id,
              warningMessage: t`Unable to parse regular expression. You may enter text, but it's not guaranteed to be valid.`,
            } as const satisfies FormFieldDefinition<CaseDbCase['content']>);
          }
          break;
        case CaseDbColType.TIME_DAY:
          acc.push({
            definition: FORM_FIELD_DEFINITION_TYPE.DATE,
            disabled,
            label: col.label,
            name: col.id,
          } as const satisfies FormFieldDefinition<CaseDbCase['content']>);
          break;
        default:
          break;
      }

      return acc;
    }, [] as FormFieldDefinition<CaseDbCase['content']>[]);

    dimensions.forEach(dim => {
      const colIds = CaseTypeUtil.getCols(completeCaseType, dim.id).map(col => col.id);
      fieldDefinitions.forEach(definition => {
        if (colIds.includes(definition.name)) {
          definition.groupKey = dim.id;
        }
      });
    });

    const groupDefinitions: FormGroupDefinition[] = [];

    dimensions.forEach(dim => {
      const colsInDim = CaseTypeUtil.getCols(completeCaseType, dim.id);
      const refDim = completeCaseType.ref_dims[dim.ref_dim_id];
      const messages: FormGroupMessage[] = [];

      if (refDim.dim_type === CaseDbDimType.GEO) {
        messages.push({ message: t`This dimension contains geographical regions. When making updates, first clear all values and only fill in the highest known resolution(s) of the geographical regions.`, severity: 'info' });
      }
      if (refDim.dim_type === CaseDbDimType.TIME) {
        messages.push({ message: t`This dimension contains time-related data. When making updates, first clear all values and only fill in the highest known resolution(s) of the time-related data.`, severity: 'info' });
      }
      const DECIMAL_COL_TYPES = [CaseDbColType.DECIMAL_0, CaseDbColType.DECIMAL_1, CaseDbColType.DECIMAL_2, CaseDbColType.DECIMAL_3, CaseDbColType.DECIMAL_4, CaseDbColType.DECIMAL_5, CaseDbColType.DECIMAL_6] as const;
      if (
        (colsInDim.some(col => completeCaseType.ref_cols[col.ref_col_id].col_type === CaseDbColType.ORDINAL) || colsInDim.some(col => completeCaseType.ref_cols[col.ref_col_id].col_type === CaseDbColType.INTERVAL)) &&
        colsInDim.some(col => (DECIMAL_COL_TYPES as readonly string[]).includes(completeCaseType.ref_cols[col.ref_col_id].col_type))
      ) {
        messages.push({ message: t`This dimension contains a mix of ordinal/interval and decimal columns. When making updates, first clear all values and only fill in the highest known resolution(s) of the data (typically the decimal data).`, severity: 'info' });
      }

      const groupFieldNames = fieldDefinitions.filter(f => f.groupKey === dim.id).map(f => f.name);
      groupDefinitions.push({
        groupKey: dim.id,
        label: dim.label,
        messages: onClearGroupFields
          ? messages.map(msg => ({
            ...msg,
            buttonLabel: t('Clear all {{dimension}} fields', { dimension: dim.label }),
            onButtonClick: () => onClearGroupFields(groupFieldNames),
          }))
          : messages,
      });
    });

    return { fieldDefinitions, groupDefinitions };
  }

  public static createYupSchema(kwArgs: { completeCaseType: CaseDbCompleteCaseType; includedColIds?: string[] }): ObjectSchema<{ [key: string]: string }> {
    const { completeCaseType, includedColIds } = kwArgs;
    const effectiveColumnAccessRights = AbacUtil.createEffectieveColumnAccessRights(Object.values(completeCaseType.case_type_access_abacs));

    return CaseTypeUtil.getCols(completeCaseType).reduce((s, col) => {
      const hasAccess = effectiveColumnAccessRights.get(col.id)?.write;
      if (!hasAccess) {
        return s;
      }
      if (includedColIds && !includedColIds.includes(col.id)) {
        return s;
      }

      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      switch (refCol.col_type) {
        case CaseDbColType.DECIMAL_0:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal0().transform((_val: unknown, orig: string) => orig || null),
          }));
        case CaseDbColType.DECIMAL_1:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal1().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case CaseDbColType.DECIMAL_2:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal2().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case CaseDbColType.DECIMAL_3:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal3().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case CaseDbColType.DECIMAL_4:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal4().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case CaseDbColType.DECIMAL_5:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal5().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case CaseDbColType.DECIMAL_6:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal6().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case CaseDbColType.GENETIC_DISTANCE:
        case CaseDbColType.GENETIC_READS:
        case CaseDbColType.GENETIC_SEQUENCE:
          return s;
        case CaseDbColType.GEO_LATLON:
          return s.concat(object().shape({
            [col.id]: string().nullable().latLong().transform((_val: unknown, orig: string) => orig || null),
          }));
        case CaseDbColType.GEO_REGION:
        case CaseDbColType.INTERVAL:
        case CaseDbColType.NOMINAL:
        case CaseDbColType.ORDINAL:
        case CaseDbColType.ORGANIZATION:
          return s.concat(object().shape({
            [col.id]: string().nullable().uuid4().transform((_val: unknown, orig: string) => orig || null),
          }));
        case CaseDbColType.ID_CASE:
        case CaseDbColType.ID_EVENT:
        case CaseDbColType.ID_GENETIC_SEQUENCE:
        case CaseDbColType.ID_PERSON:
        case CaseDbColType.ID_SAMPLE:
          return s.concat(object().shape({
            [col.id]: string().nullable().extendedAlphaNumeric().max(255).transform((_val: unknown, orig: string) => orig || null),
          }));
        case CaseDbColType.REGULAR_LANGUAGE:
          try {
            return s.concat(object().shape({
              [col.id]: string().nullable().matches(new RegExp(col.pattern), t('Invalid value for pattern "{{pattern}}"', { pattern: col.pattern })),
            })).transform((_val: unknown, orig: string) => orig || null);
          } catch (_error) {
            return s.concat(object().shape({
              [col.id]: string().nullable().max(col.max_length ?? 65535),
            })).transform((_val: unknown, orig: string) => orig || null);
          }
        case CaseDbColType.TEXT:
          return s.concat(object().shape({
            [col.id]: string().nullable().extendedAlphaNumeric().max(65535).transform((_val: unknown, orig: string) => orig || null),
          }));
        case CaseDbColType.TIME_DAY:
          return s.concat(object().shape({
            [col.id]: string().nullable().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : null),
          }));
        case CaseDbColType.TIME_MONTH:
          return s.concat(object().shape({
            [col.id]: string().nullable().timeMonth().transform((_val: unknown, orig: string) => orig || null),
          }));
        case CaseDbColType.TIME_QUARTER:
          return s.concat(object().shape({
            [col.id]: string().nullable().timeQuarter().transform((_val: unknown, orig: string) => orig || null),
          }));
        case CaseDbColType.TIME_WEEK:
          return s.concat(object().shape({
            [col.id]: string().nullable().timeWeek().transform((_val: unknown, orig: string) => orig || null),
          }));
        case CaseDbColType.TIME_YEAR:
          return s.concat(object().shape({
            [col.id]: string().nullable().timeYear().transform((_val: unknown, orig: string) => orig || null),
          }));
        default:
          console.warn(`Unknown column type: ${refCol.col_type}`);
          return s;
      }
    }, object({}));
  }
}
