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
  Case,
  CaseDataCollectionLink,
  Col,
  CompleteCaseType,
  Organization,
  RefCol,
} from '@gen-epix/api-casedb';
import {
  CaseApi,
  ColType,
} from '@gen-epix/api-casedb';

import { CaseTypeUtil } from '../CaseTypeUtil';
import { AbacUtil } from '../AbacUtil';
import { QueryUtil } from '../QueryUtil';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { NotificationManager } from '../../classes/managers/NotificationManager';
import type { CaseTypeRowValue } from '../../models/epi';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import { EpiDataManager } from '../../classes/managers/EpiDataManager';

export class CaseUtil {
  public static async applyDataCollectionLinks(kwArgs: { caseIds?: string[]; caseSetDataCollectionIds: string[]; caseSetId?: string; caseTypeId: string }): Promise<void> {
    const { caseIds, caseSetDataCollectionIds, caseSetId, caseTypeId } = kwArgs;

    if (!caseSetId && !caseIds) {
      throw new Error('Either caseSetId or caseIds must be provided');
    }

    const notificationKey = NotificationManager.instance.showNotification({
      isLoading: true,
      message: t('Applying sharing to the cases'),
      severity: 'info',
    });

    try {
      if (!caseSetDataCollectionIds.length) {
        NotificationManager.instance.fulfillNotification(notificationKey, t('Sharing has not been applied to the cases because the event is not shared.'), 'info');
      }

      let normalizedCaseIds: string[] = [];
      if (caseIds) {
        normalizedCaseIds = caseIds;
      } else {
        normalizedCaseIds = (await CaseApi.instance.caseSetMembersPostQuery({
          invert: false,
          key: 'case_set_id',
          members: [caseSetId],
          type: 'UUID_SET',
        })).data.map(x => x.case_id);
      }

      if (!normalizedCaseIds.length) {
        NotificationManager.instance.fulfillNotification(notificationKey, t('Sharing has not been applied to the cases because there are no cases in the event.'), 'info');
      }

      const dataLinksToAdd: CaseDataCollectionLink[] = [];
      const caseRights = (await CaseApi.instance.retrieveCaseRights({
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
          const dataLink: CaseDataCollectionLink = {
            case_id: caseId,
            data_collection_id: dataCollectionId,
          };
          dataLinksToAdd.push(dataLink);
        });
      });

      if (!dataLinksToAdd.length) {
        NotificationManager.instance.fulfillNotification(notificationKey, t('Sharing has not been applied to the cases because sharing has already been applied.'), 'info');
        return;
      }

      // Batch add the data collection links
      await CaseApi.instance.caseDataCollectionLinksPostSome(dataLinksToAdd);
      await QueryUtil.invalidateQueryKeys(QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASE_DATA_COLLECTION_LINKS], true));
      NotificationManager.instance.fulfillNotification(notificationKey, t('Sharing has been applied to the cases'), 'success');

    } catch (_error) {
      NotificationManager.instance.fulfillNotification(notificationKey, t('Sharing could not be applied to selected cases due to an error.'), 'error');
    }
  }

  public static createFormFieldDefinitions(completeCaseType: CompleteCaseType, organizationsQueryResult: UseQueryResult<Organization[]>): FormFieldDefinition<Case['content']>[] {
    const cols = CaseTypeUtil.getCols(completeCaseType);
    const effectiveColumnAccessRights = AbacUtil.createEffectieveColumnAccessRights(Object.values(completeCaseType.case_type_access_abacs));
    return cols.reduce((acc, col) => {
      const hasAccess = effectiveColumnAccessRights.get(col.id)?.write;
      if (!hasAccess) {
        return acc;
      }

      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      switch (refCol.col_type) {
        case ColType.DECIMAL_0:
        case ColType.DECIMAL_1:
        case ColType.DECIMAL_2:
        case ColType.DECIMAL_3:
        case ColType.DECIMAL_4:
        case ColType.DECIMAL_5:
        case ColType.DECIMAL_6:
        case ColType.ID_CASE:
        case ColType.ID_EVENT:
        case ColType.ID_GENETIC_SEQUENCE:
        case ColType.ID_PERSON:
        case ColType.ID_SAMPLE:
        case ColType.TEXT:
        case ColType.TIME_MONTH:
        case ColType.TIME_QUARTER:
        case ColType.TIME_WEEK:
        case ColType.TIME_YEAR:
          acc.push({
            definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
            label: col.label,
            name: col.id,
          } as const satisfies FormFieldDefinition<Case['content']>);
          break;
        case ColType.GEO_REGION:
          if (EpiDataManager.instance.data.regionsByRegionSetId[refCol.region_set_id]) {
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
              label: col.label,
              name: col.id,
              options: EpiDataManager.instance.data.regionsByRegionSetId[refCol.region_set_id].map(region => ({
                label: EpiDataManager.instance.data.regionSets[refCol.region_set_id].region_code_as_label ? region.code : region.name,
                value: region.id,
              })),
            } as const satisfies FormFieldDefinition<Case['content']>);
          }
          break;
        case ColType.INTERVAL:
        case ColType.NOMINAL:
        case ColType.ORDINAL:
          if (EpiDataManager.instance.data.conceptsBySetId[refCol.concept_set_id]) {
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
              label: col.label,
              name: col.id,
              options: EpiDataManager.instance.data.conceptsBySetId[refCol.concept_set_id].map(concept => ({
                label: concept.name,
                value: concept.id,
              })),
            } as const satisfies FormFieldDefinition<Case['content']>);
          }
          break;
        case ColType.ORGANIZATION:
          acc.push({
            definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
            label: col.label,
            loading: organizationsQueryResult.isLoading,
            name: col.id,
            options: (organizationsQueryResult.data ?? []).map(organization => ({
              label: organization.name,
              value: organization.id,
            })),
          } as const satisfies FormFieldDefinition<Case['content']>);
          break;
        case ColType.REGULAR_LANGUAGE:
          try {
            new RegExp(col.pattern);
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
              label: col.label,
              name: col.id,
            } as const satisfies FormFieldDefinition<Case['content']>);
          } catch (_error) {
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
              label: col.label,
              name: col.id,
              warningMessage: t`Unable to parse regular expression. You may enter text, but it's not guaranteed to be valid.`,
            } as const satisfies FormFieldDefinition<Case['content']>);
          }
          break;
        default:
          break;
      }

      return acc;
    }, [] as FormFieldDefinition<Case['content']>[]);
  }

  public static createYupSchema(completeCaseType: CompleteCaseType): ObjectSchema<{ [key: string]: string }> {
    const effectiveColumnAccessRights = AbacUtil.createEffectieveColumnAccessRights(Object.values(completeCaseType.case_type_access_abacs));

    return CaseTypeUtil.getCols(completeCaseType).reduce((s, col) => {
      const hasAccess = effectiveColumnAccessRights.get(col.id)?.write;
      if (!hasAccess) {
        return s;
      }

      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      switch (refCol.col_type) {
        case ColType.DECIMAL_0:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal0().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.DECIMAL_1:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal1().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.DECIMAL_2:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal2().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.DECIMAL_3:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal3().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.DECIMAL_4:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal4().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.DECIMAL_5:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal5().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.DECIMAL_6:
          return s.concat(object().shape({
            [col.id]: string().nullable().decimal6().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.GEO_LATLON:
          return s.concat(object().shape({
            [col.id]: string().nullable().latLong().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.GEO_REGION:
        case ColType.INTERVAL:
        case ColType.NOMINAL:
        case ColType.ORDINAL:
        case ColType.ORGANIZATION:
          return s.concat(object().shape({
            [col.id]: string().nullable().uuid4().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.ID_CASE:
        case ColType.ID_EVENT:
        case ColType.ID_GENETIC_SEQUENCE:
        case ColType.ID_PERSON:
        case ColType.ID_SAMPLE:
          return s.concat(object().shape({
            [col.id]: string().nullable().extendedAlphaNumeric().max(255).transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.REGULAR_LANGUAGE:
          try {
            return s.concat(object().shape({
              [col.id]: string().nullable().matches(new RegExp(col.pattern), t('Invalid value for pattern "{{pattern}}"', { pattern: col.pattern })),
            })).transform((_val: unknown, orig: string) => orig || null);
          } catch (_error) {
            return s.concat(object().shape({
              [col.id]: string().nullable().max(col.max_length ?? 65535),
            })).transform((_val: unknown, orig: string) => orig || null);
          }
        case ColType.GENETIC_DISTANCE:
        case ColType.GENETIC_SEQUENCE:
          return s;
        case ColType.TEXT:
          return s.concat(object().shape({
            [col.id]: string().nullable().extendedAlphaNumeric().max(65535).transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.TIME_DAY:
          return s.concat(object().shape({
            [col.id]: string().nullable().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : null),
          }));
        case ColType.TIME_MONTH:
          return s.concat(object().shape({
            [col.id]: string().nullable().timeMonth().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.TIME_QUARTER:
          return s.concat(object().shape({
            [col.id]: string().nullable().timeQuarter().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.TIME_WEEK:
          return s.concat(object().shape({
            [col.id]: string().nullable().timeWeek().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.TIME_YEAR:
          return s.concat(object().shape({
            [col.id]: string().nullable().timeYear().transform((_val: unknown, orig: string) => orig || null),
          }));
        default:
          console.error(`Unknown column type: ${refCol.col_type}`);
          return s;
      }
    }, object({}));
  }

  public static getMappedValue(raw: string, col: Col, completeCaseType: CompleteCaseType, machineReadable = false): CaseTypeRowValue {
    if (!raw) {
      return CaseUtil.getMissingRowValue(raw, machineReadable);
    }

    const refCol = completeCaseType.ref_cols[col.ref_col_id];

    if (refCol.col_type === ColType.ORGANIZATION) {
      return CaseUtil.getOrganizationMappedValue(raw);
    } else if (refCol.region_set_id) {
      return CaseUtil.getRegionMappedValue(refCol, raw);
    } else if (refCol.concept_set_id) {
      return CaseUtil.getConceptMappedValue(raw);
    }
    return CaseUtil.getMissingRowValue(raw, machineReadable);
  }

  public static getMissingRowValue(raw: string, machineReadable = true): CaseTypeRowValue {
    const { DATA_MISSING_CHARACTER } = ConfigManager.instance.config.epi;
    const dataMissingCharacter = machineReadable ? '' : DATA_MISSING_CHARACTER;

    return {
      full: t('{{dataMissingCharacter}} (missing)', { dataMissingCharacter }),
      isMissing: true,
      long: dataMissingCharacter,
      raw,
      short: dataMissingCharacter,
    };
  }

  public static getRowValue(content: { [key: string]: string }, col: Col, completeCaseType: CompleteCaseType, machineReadable = false): CaseTypeRowValue {
    const refCol = completeCaseType.ref_cols[col.ref_col_id];
    const hasMappedValue = refCol.col_type === ColType.ORGANIZATION || refCol.region_set_id || refCol.concept_set_id;
    if (hasMappedValue) {
      return CaseUtil.getMappedValue(content[col.id], col, completeCaseType, machineReadable);
    }

    const { DATA_MISSING_CHARACTER } = ConfigManager.instance.config.epi;
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
    const concept = EpiDataManager.instance.data.conceptsById?.[raw];
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
    const organization = EpiDataManager.instance.data?.organizationsById?.[raw];
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

  private static getRegionMappedValue(refCol: RefCol, raw: string): CaseTypeRowValue {
    const regionSet = EpiDataManager.instance.data.regionSets[refCol.region_set_id];
    const region = EpiDataManager.instance.data.regionsById?.[raw];
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
