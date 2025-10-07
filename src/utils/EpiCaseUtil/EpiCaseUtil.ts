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

import { EpiCaseTypeUtil } from '../EpiCaseTypeUtil';
import { EpiAbacUtil } from '../EpiAbacUtil';
import { QueryUtil } from '../QueryUtil';
import type {
  CaseDataCollectionLink,
  CompleteCaseType,
  Organization,
  Case,
  CaseTypeCol,
  Col,
} from '../../api';
import {
  CaseApi,
  ColType,
} from '../../api';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { NotificationManager } from '../../classes/managers/NotificationManager';
import type { CaseTypeRowValue } from '../../models/epi';
import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import { QUERY_KEY } from '../../models/query';
import { EpiDataUtil } from '../EpiDataUtil';

export class EpiCaseUtil {
  public static async applyDataCollectionLinks(kwArgs: { caseSetId?: string; caseSetDataCollectionIds: string[]; caseIds?: string[] }): Promise<void> {
    const { caseSetId, caseSetDataCollectionIds, caseIds } = kwArgs;

    if (!caseSetId && !caseIds) {
      throw new Error('Either caseSetId or caseIds must be provided');
    }

    const notificationKey = NotificationManager.instance.showNotification({
      message: t('Applying sharing to the cases'),
      isLoading: true,
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
        normalizedCaseIds = (await CaseApi.getInstance().caseSetMembersPostQuery({
          invert: false,
          key: 'case_set_id',
          type: 'UUID_SET',
          members: [caseSetId],
        })).data.map(x => x.case_id);
      }

      if (!normalizedCaseIds.length) {
        NotificationManager.instance.fulfillNotification(notificationKey, t('Sharing has not been applied to the cases because there are no cases in the event.'), 'info');
      }

      const dataLinksToAdd: CaseDataCollectionLink[] = [];
      const caseRights = (await CaseApi.getInstance().retrieveCaseRights(normalizedCaseIds)).data;

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
      await CaseApi.getInstance().caseDataCollectionLinksPostSome(dataLinksToAdd);
      await QueryUtil.invalidateQueryKeys(QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASE_DATA_COLLECTION_LINKS], true));
      NotificationManager.instance.fulfillNotification(notificationKey, t('Sharing has been applied to the cases'), 'success');

    } catch (_error) {
      NotificationManager.instance.fulfillNotification(notificationKey, t('Sharing could not be applied to selected cases due to an error.'), 'error');
    }
  }

  public static createFormFieldDefinitions(completeCaseType: CompleteCaseType, organizationsQueryResult: UseQueryResult<Organization[]>): FormFieldDefinition<Case['content']>[] {
    const caseTypeColumns = EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType);
    const effectiveColumnAccessRights = EpiAbacUtil.createEffectieveColumnAccessRights(Object.values(completeCaseType.case_type_access_abacs));
    return caseTypeColumns.reduce((acc, caseTypeColumn) => {
      const hasAccess = effectiveColumnAccessRights.get(caseTypeColumn.id)?.write;
      if (!hasAccess) {
        return acc;
      }

      const column = completeCaseType.cols[caseTypeColumn.col_id];
      switch (column.col_type) {
        case ColType.TEXT:
        case ColType.ID_DIRECT:
        case ColType.ID_PSEUDONYMISED:
        case ColType.ID_ANONYMISED:
        case ColType.TIME_WEEK:
        case ColType.TIME_MONTH:
        case ColType.TIME_QUARTER:
        case ColType.TIME_YEAR:
        case ColType.DECIMAL_0:
        case ColType.DECIMAL_1:
        case ColType.DECIMAL_2:
        case ColType.DECIMAL_3:
        case ColType.DECIMAL_4:
        case ColType.DECIMAL_5:
        case ColType.DECIMAL_6:
          acc.push({
            definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
            name: caseTypeColumn.id,
            label: caseTypeColumn.label,
          } as const satisfies FormFieldDefinition<Case['content']>);
          break;
        case ColType.REGULAR_LANGUAGE:
          try {
            new RegExp(caseTypeColumn.pattern);
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
              name: caseTypeColumn.id,
              label: caseTypeColumn.label,
            } as const satisfies FormFieldDefinition<Case['content']>);
          } catch (_error) {
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD,
              name: caseTypeColumn.id,
              label: caseTypeColumn.label,
              warningMessage: t`Unable to parse regular expression. You may enter text, but it's not guaranteed to be valid.`,
            } as const satisfies FormFieldDefinition<Case['content']>);
          }
          break;
        case ColType.NOMINAL:
        case ColType.ORDINAL:
        case ColType.INTERVAL:
          if (EpiDataUtil.data.conceptsBySetId[column.concept_set_id]) {
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
              name: caseTypeColumn.id,
              label: caseTypeColumn.label,
              options: EpiDataUtil.data.conceptsBySetId[column.concept_set_id].map(concept => ({
                value: concept.id,
                label: concept.name,
              })),
            } as const satisfies FormFieldDefinition<Case['content']>);
          }
          break;
        case ColType.GEO_REGION:
          if (EpiDataUtil.data.regionsByRegionSetId[column.region_set_id]) {
            acc.push({
              definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
              name: caseTypeColumn.id,
              label: caseTypeColumn.label,
              options: EpiDataUtil.data.regionsByRegionSetId[column.region_set_id].map(region => ({
                value: region.id,
                label: EpiDataUtil.data.regionSets[column.region_set_id].region_code_as_label ? region.code : region.name,
              })),
            } as const satisfies FormFieldDefinition<Case['content']>);
          }
          break;
        case ColType.ORGANIZATION:
          acc.push({
            definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
            name: caseTypeColumn.id,
            label: caseTypeColumn.label,
            loading: organizationsQueryResult.isLoading,
            options: (organizationsQueryResult.data ?? []).map(organization => ({
              value: organization.id,
              label: organization.name,
            })),
          } as const satisfies FormFieldDefinition<Case['content']>);
          break;
        default:
          break;
      }

      return acc;
    }, [] as FormFieldDefinition<Case['content']>[]);
  }

  public static createYupSchema(completeCaseType: CompleteCaseType): ObjectSchema<{ [key: string]: string }> {
    const effectiveColumnAccessRights = EpiAbacUtil.createEffectieveColumnAccessRights(Object.values(completeCaseType.case_type_access_abacs));

    return EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType).reduce((s, caseTypeColumn) => {
      const hasAccess = effectiveColumnAccessRights.get(caseTypeColumn.id)?.write;
      if (!hasAccess) {
        return s;
      }

      const column = completeCaseType.cols[caseTypeColumn.col_id];
      switch (column.col_type) {
        case ColType.TEXT:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().extendedAlphaNumeric().max(65535).transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.ID_DIRECT:
        case ColType.ID_PSEUDONYMISED:
        case ColType.ID_ANONYMISED:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().extendedAlphaNumeric().max(255).transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.NOMINAL:
        case ColType.ORDINAL:
        case ColType.INTERVAL:
        case ColType.GEO_REGION:
        case ColType.ORGANIZATION:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().uuid4().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.GEO_LATLON:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().latLong().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.DECIMAL_0:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().decimal0().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.DECIMAL_1:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().decimal1().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.DECIMAL_2:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().decimal2().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.DECIMAL_3:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().decimal3().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.DECIMAL_4:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().decimal4().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.DECIMAL_5:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().decimal5().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.DECIMAL_6:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().decimal6().transform((_val: unknown, orig: string) => orig ?? null),
          }));
        case ColType.TIME_DAY:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : null),
          }));
        case ColType.TIME_WEEK:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().timeWeek().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.TIME_MONTH:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().timeMonth().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.TIME_QUARTER:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().timeQuarter().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.TIME_YEAR:
          return s.concat(object().shape({
            [caseTypeColumn.id]: string().nullable().timeYear().transform((_val: unknown, orig: string) => orig || null),
          }));
        case ColType.REGULAR_LANGUAGE:
          try {
            return s.concat(object().shape({
              [caseTypeColumn.id]: string().nullable().matches(new RegExp(caseTypeColumn.pattern), t('Invalid value for pattern "{{pattern}}"', { pattern: caseTypeColumn.pattern })),
            })).transform((_val: unknown, orig: string) => orig || null);
          } catch (_error) {
            return s.concat(object().shape({
              [caseTypeColumn.id]: string().nullable().max(caseTypeColumn.max_length ?? 65535),
            })).transform((_val: unknown, orig: string) => orig || null);
          }
        case ColType.GENETIC_SEQUENCE:
        case ColType.GENETIC_DISTANCE:
          return s;
        default:
          console.error(`Unknown column type: ${column.col_type}`);
          return s;
      }
    }, object({}));
  }

  public static getRowValue(row: Case, caseTypeColumn: CaseTypeCol, completeCaseType: CompleteCaseType, machineReadable = false): CaseTypeRowValue {
    const column = completeCaseType.cols[caseTypeColumn.col_id];
    const hasMappedValue = column.col_type === ColType.ORGANIZATION || column.region_set_id || column.concept_set_id;
    if (hasMappedValue) {
      return EpiCaseUtil.getMappedValue(row.content[caseTypeColumn.id], caseTypeColumn, completeCaseType, machineReadable);
    }

    const { DATA_MISSING_CHARACTER } = ConfigManager.instance.config.epi;
    const dataMissingCharacter = machineReadable ? '' : DATA_MISSING_CHARACTER;

    const rowValue: CaseTypeRowValue = {
      raw: row.content?.[caseTypeColumn.id],
      isMissing: !row.content[caseTypeColumn.id],
      short: row.content[caseTypeColumn.id] ?? dataMissingCharacter,
      long: row.content[caseTypeColumn.id] ?? dataMissingCharacter,
      full: row.content[caseTypeColumn.id] ?? t(`${dataMissingCharacter} (missing)`),
    };
    return rowValue;
  }

  public static getMissingRowValue(raw: string, machineReadable = true): CaseTypeRowValue {
    const { DATA_MISSING_CHARACTER } = ConfigManager.instance.config.epi;
    const dataMissingCharacter = machineReadable ? '' : DATA_MISSING_CHARACTER;

    return {
      raw,
      isMissing: true,
      full: t(`${dataMissingCharacter} (missing)`),
      long: dataMissingCharacter,
      short: dataMissingCharacter,
    };
  }

  public static getMappedValue(raw: string, caseTypeColumn: CaseTypeCol, completeCaseType: CompleteCaseType, machineReadable = false): CaseTypeRowValue {
    if (!raw) {
      return EpiCaseUtil.getMissingRowValue(raw, machineReadable);
    }

    const column = completeCaseType.cols[caseTypeColumn.col_id];

    if (column.col_type === ColType.ORGANIZATION) {
      return EpiCaseUtil.getOrganizationMappedValue(raw);
    } else if (column.region_set_id) {
      return EpiCaseUtil.getRegionMappedValue(column, raw);
    } else if (column.concept_set_id) {
      return EpiCaseUtil.getConceptMappedValue(raw);
    }
    return EpiCaseUtil.getMissingRowValue(raw, machineReadable);
  }

  private static getOrganizationMappedValue(raw: string): CaseTypeRowValue {
    const organization = EpiDataUtil.data?.organizationsById?.[raw];
    if (!organization) {
      return EpiCaseUtil.getMissingRowValue(raw);
    }
    return {
      raw,
      isMissing: false,
      short: organization.name,
      long: organization.name,
      full: organization.name,
    };
  }

  private static getRegionMappedValue(column: Col, raw: string): CaseTypeRowValue {
    const regionSet = EpiDataUtil.data.regionSets[column.region_set_id];
    const region = EpiDataUtil.data.regionsById?.[raw];
    if (!region) {
      return EpiCaseUtil.getMissingRowValue(raw);
    }
    return {
      raw,
      isMissing: false,
      full: regionSet.region_code_as_label ? region.code : region.name,
      long: regionSet.region_code_as_label ? region.code : region.name,
      short: regionSet.region_code_as_label ? region.code : region.name,
    };
  }

  private static getConceptMappedValue(raw: string): CaseTypeRowValue {
    const concept = EpiDataUtil.data.conceptsById?.[raw];
    if (!concept) {
      return EpiCaseUtil.getMissingRowValue(raw);
    }
    return {
      raw,
      isMissing: false,
      full: `${concept.code} (${concept.name})`,
      short: concept.code,
      long: concept.name,
    };
  }
}
