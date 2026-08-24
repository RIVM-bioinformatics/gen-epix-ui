import type { CaseDbCompleteCaseType } from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';

import type { TreeConfiguration } from '../../models/dashboard';
import { DataService } from '../../classes/services/DataService';

export class TreeWidgetUtil {
  public static getTreeConfigurationId(treeConfiguration: Omit<TreeConfiguration, 'computedId'>): string {
    return `${treeConfiguration.col.id}_${treeConfiguration.refCol.id}_${treeConfiguration.geneticDistanceProtocol.id}_${treeConfiguration.treeAlgorithm.id}`;
  }

  public static getTreeConfigurationLabel(config: TreeConfiguration): string {
    return `${config.geneticDistanceProtocol.name} - ${config.treeAlgorithm.name}`;
  }

  public static getTreeConfigurations(completeCaseType: CaseDbCompleteCaseType): TreeConfiguration[] {
    const treeConfigurations: TreeConfiguration[] = [];

    const geneticDistanceCols = Object.values(completeCaseType.cols).filter(col => {
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      return refCol.col_type === CaseDbColType.GENETIC_DISTANCE;
    });

    const sortedTreeAlgorithmCodes = DataService.getInstance().data.treeAlgorithms.map(x => x.code);

    geneticDistanceCols.forEach(col => {
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      const geneticDistanceProtocol = completeCaseType.genetic_distance_protocols[refCol.genetic_distance_protocol_id];
      const treeAlgorithms = [...col.tree_algorithm_codes].sort((a, b) => {
        return sortedTreeAlgorithmCodes.indexOf(a) - sortedTreeAlgorithmCodes.indexOf(b);
      }).map(treeAlgorithmCode => completeCaseType.tree_algorithms[treeAlgorithmCode]);

      treeAlgorithms.forEach(treeAlgorithm => {
        treeConfigurations.push({
          col,
          computedId: TreeWidgetUtil.getTreeConfigurationId({ col, geneticDistanceProtocol, refCol, treeAlgorithm }),
          geneticDistanceProtocol,
          refCol,
          treeAlgorithm,
        });
      });
    });

    return treeConfigurations;
  }
}
