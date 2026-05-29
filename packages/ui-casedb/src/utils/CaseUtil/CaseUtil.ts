import { isValid } from 'date-fns';
import { t } from 'i18next';
import type { ObjectSchema } from 'yup';
import {
  object,
  string,
} from 'yup';
import type { UseQueryResult } from '@tanstack/react-query';
import difference from 'lodash/difference';
import intersection from 'lodash/intersection';
import type {
  CaseDbCase,
  CaseDbCaseDataCollectionLink,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbOrganization,
  CaseDbRefCol,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  FormFieldDefinition,
  FormGroupDefinition,
  FormGroupMessage,
} from '@gen-epix/ui';
import {
  ConfigManager,
  FORM_FIELD_DEFINITION_TYPE,
  NotificationManager,
  QueryClientManager,
} from '@gen-epix/ui';

import { CaseTypeUtil } from '../CaseTypeUtil';
import { AbacUtil } from '../AbacUtil';
import { EpiDataManager } from '../../classes/managers/EpiDataManager';
import type { CaseTypeRowValue } from '../../models/epi';
import { CASEDB_QUERY_KEY } from '../../data/query';
import type { CaseDbConfig } from '../../models/config';

export class CaseUtil {
  public static async applyDataCollectionLinks(kwArgs: { caseIds?: string[]; caseSetDataCollectionIds: string[]; caseSetId?: string; caseTypeId: string }): Promise<void> {
    const { caseIds, caseSetDataCollectionIds, caseSetId, caseTypeId } = kwArgs;

    if (!caseSetId && !caseIds) {
      throw new Error('Either caseSetId or caseIds must be provided');
    }

    const notificationKey = NotificationManager.getInstance().showNotification({
      isLoading: true,
      message: t('Applying sharing to the cases'),
      severity: 'info',
    });

    try {
      if (!caseSetDataCollectionIds.length) {
        NotificationManager.getInstance().fulfillNotification(notificationKey, t('Sharing has not been applied to the cases because the event is not shared.'), 'info');
      }

      let normalizedCaseIds: string[] = [];
      if (caseIds) {
        normalizedCaseIds = caseIds;
      } else {
        normalizedCaseIds = (await CaseDbCaseApi.getInstance().caseSetMembersPostQuery({
          invert: false,
          key: 'case_set_id',
          members: [caseSetId],
          type: 'UUID_SET',
        })).data.map(x => x.case_id);
      }

      if (!normalizedCaseIds.length) {
        NotificationManager.getInstance().fulfillNotification(notificationKey, t('Sharing has not been applied to the cases because there are no cases in the event.'), 'info');
      }

      const dataLinksToAdd: CaseDbCaseDataCollectionLink[] = [];
      const caseRights = (await CaseDbCaseApi.getInstance().retrieveCaseRights({
        case_ids: normalizedCaseIds,
        case_type_id: caseTypeId,
      })).data;

      caseRights.forEach((caseRight) => {
        const caseId = caseRight.case_id;
        const caseMissingDataCollectionIds = difference(caseSetDataCollectionIds, caseRight.shared_in_data_collection_ids);
        if (!caseMissingDataCollectionIds.length) {
          return;
        }

        (caseRight.is_full_access ? caseMissingDataCollectionIds : intersection(caseRight.add_data_collection_ids, caseSetDataCollectionIds)).forEach((dataCollectionId) => {
          const dataLink: CaseDbCaseDataCollectionLink = {
            case_id: caseId,
            data_collection_id: dataCollectionId,
          };
          dataLinksToAdd.push(dataLink);
        });
      });

      if (!dataLinksToAdd.length) {
        NotificationManager.getInstance().fulfillNotification(notificationKey, t('Sharing has not been applied to the cases because sharing has already been applied.'), 'info');
        return;
      }

      // Batch add the data collection links
      await CaseDbCaseApi.getInstance().caseDataCollectionLinksPostSome(dataLinksToAdd);
      await QueryClientManager.getInstance().invalidateQueryKeys(QueryClientManager.getInstance().getQueryKeyDependencies([CASEDB_QUERY_KEY.CASE_DATA_COLLECTION_LINKS], true));
      NotificationManager.getInstance().fulfillNotification(notificationKey, t('Sharing has been applied to the cases'), 'success');

    } catch (_error) {
      NotificationManager.getInstance().fulfillNotification(notificationKey, t('Sharing could not be applied to selected cases due to an error.'), 'error');
    }
  }

  public static createFormDefinitions(completeCaseType: CaseDbCompleteCaseType, organizationsQueryResult: UseQueryResult<CaseDbOrganization[]>, onClearGroupFields?: (fieldNames: string[]) => void, enabledColIds?: string[]): { fieldDefinitions: FormFieldDefinition<CaseDbCase['content']>[]; groupDefinitions: FormGroupDefinition[] } {
    const cols = CaseTypeUtil.getCols(completeCaseType);
    const dimensions = CaseTypeUtil.getDims(completeCaseType);
    const effectiveColumnAccessRights = AbacUtil.createEffectieveColumnAccessRights(Object.values(completeCaseType.case_type_access_abacs));
    const fieldDefinitions: FormFieldDefinition<CaseDbCase['content']>[] = cols.reduce((acc, col) => {
      const hasAccess = effectiveColumnAccessRights.get(col.id)?.write;
      if (!hasAccess) {
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
          if (EpiDataManager.getInstance().data.regionsByRegionSetId[refCol.region_set_id]) {
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
              disabled,
              label: col.label,
              name: col.id,
              options: EpiDataManager.getInstance().data.regionsByRegionSetId[refCol.region_set_id].map(region => ({
                label: EpiDataManager.getInstance().data.regionSets[refCol.region_set_id].region_code_as_label ? region.code : region.name,
                value: region.id,
              })),
            } as const satisfies FormFieldDefinition<CaseDbCase['content']>);
          }
          break;
        case CaseDbColType.INTERVAL:
        case CaseDbColType.NOMINAL:
        case CaseDbColType.ORDINAL:
          if (EpiDataManager.getInstance().data.conceptsBySetId[refCol.concept_set_id]) {
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
              disabled,
              label: col.label,
              name: col.id,
              options: EpiDataManager.getInstance().data.conceptsBySetId[refCol.concept_set_id].map(concept => ({
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
            loading: organizationsQueryResult.isLoading,
            name: col.id,
            options: (organizationsQueryResult.data ?? []).map(organization => ({
              label: organization.name,
              value: organization.id,
            })),
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

  public static createYupSchema(completeCaseType: CaseDbCompleteCaseType): ObjectSchema<{ [key: string]: string }> {
    const effectiveColumnAccessRights = AbacUtil.createEffectieveColumnAccessRights(Object.values(completeCaseType.case_type_access_abacs));

    return CaseTypeUtil.getCols(completeCaseType).reduce((s, col) => {
      const hasAccess = effectiveColumnAccessRights.get(col.id)?.write;
      if (!hasAccess) {
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

  public static getMappedValue(raw: string, col: CaseDbCol, completeCaseType: CaseDbCompleteCaseType, machineReadable = false): CaseTypeRowValue {
    if (!raw) {
      return CaseUtil.getMissingRowValue(raw, machineReadable);
    }

    const refCol = completeCaseType.ref_cols[col.ref_col_id];

    if (refCol.col_type === CaseDbColType.ORGANIZATION) {
      return CaseUtil.getOrganizationMappedValue(raw);
    } else if (refCol.region_set_id) {
      return CaseUtil.getRegionMappedValue(refCol, raw);
    } else if (refCol.concept_set_id) {
      return CaseUtil.getConceptMappedValue(raw);
    }
    return CaseUtil.getMissingRowValue(raw, machineReadable);
  }

  public static getMissingRowValue(raw: string, machineReadable = true): CaseTypeRowValue {
    const { DATA_MISSING_CHARACTER } = ConfigManager.getInstance<CaseDbConfig>().config.epi;
    const dataMissingCharacter = machineReadable ? '' : DATA_MISSING_CHARACTER;

    return {
      full: t('{{dataMissingCharacter}} (missing)', { dataMissingCharacter }),
      isMissing: true,
      long: dataMissingCharacter,
      raw,
      short: dataMissingCharacter,
    };
  }

  public static getRowValue(content: { [key: string]: string }, col: CaseDbCol, completeCaseType: CaseDbCompleteCaseType, machineReadable = false): CaseTypeRowValue {
    const refCol = completeCaseType.ref_cols[col.ref_col_id];
    const hasMappedValue = refCol.col_type === CaseDbColType.ORGANIZATION || refCol.region_set_id || refCol.concept_set_id;
    if (hasMappedValue) {
      return CaseUtil.getMappedValue(content[col.id], col, completeCaseType, machineReadable);
    }

    const { DATA_MISSING_CHARACTER } = ConfigManager.getInstance<CaseDbConfig>().config.epi;
    const dataMissingCharacter = machineReadable ? '' : DATA_MISSING_CHARACTER;

    const rowValue: CaseTypeRowValue = {
      full: content[col.id] ?? t('{{dataMissingCharacter}} (missing)', { dataMissingCharacter }),
      isMissing: !content[col.id],
      long: content[col.id] ?? dataMissingCharacter,
      raw: content?.[col.id],
      short: content[col.id] ?? dataMissingCharacter,
    };
    return rowValue;
  }

  private static getConceptMappedValue(raw: string): CaseTypeRowValue {
    const concept = EpiDataManager.getInstance().data.conceptsById?.[raw];
    if (!concept) {
      return CaseUtil.getMissingRowValue(raw);
    }
    return {
      full: `${concept.code} (${concept.name})`,
      isMissing: false,
      long: concept.name,
      raw,
      short: concept.code,
    };
  }

  private static getOrganizationMappedValue(raw: string): CaseTypeRowValue {
    const organization = EpiDataManager.getInstance().data?.organizationsById?.[raw];
    if (!organization) {
      return CaseUtil.getMissingRowValue(raw);
    }
    return {
      full: organization.name,
      isMissing: false,
      long: organization.name,
      raw,
      short: organization.name,
    };
  }

  private static getRegionMappedValue(refCol: CaseDbRefCol, raw: string): CaseTypeRowValue {
    const regionSet = EpiDataManager.getInstance().data.regionSets[refCol.region_set_id];
    const region = EpiDataManager.getInstance().data.regionsById?.[raw];
    if (!region) {
      return CaseUtil.getMissingRowValue(raw);
    }
    return {
      full: regionSet.region_code_as_label ? region.code : region.name,
      isMissing: false,
      long: regionSet.region_code_as_label ? region.code : region.name,
      raw,
      short: regionSet.region_code_as_label ? region.code : region.name,
    };
  }
}
