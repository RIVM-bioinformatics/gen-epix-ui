import { t } from 'i18next';
import difference from 'lodash/difference';
import intersection from 'lodash/intersection';
import type {
  CaseDbCaseDataCollectionLink,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbRefCol,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbColType,
} from '@gen-epix/api-casedb';
import {
  ConfigManager,
  NotificationManager,
  QueryClientManager,
} from '@gen-epix/ui';

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
