import {
  useCallback,
  useState,
} from 'react';

import {
  type EpiUploadSelectFileResult,
  type EpiUploadMappedColumn,
} from '../../../models/epiUpload';
import type {
  CompleteCaseType,
  ValidatedCase,
} from '../../../api';
import { EpiCompletCaseTypeLoader } from '../EpiCompletCaseTypeLoader';

import { EpiUploadValidateContent } from './EpiUploadValidateContent';

export type EpiUploadValidateProps = {
  readonly selectFileResult: EpiUploadSelectFileResult;
  readonly mappedColumns: EpiUploadMappedColumn[];
  readonly onProceed: (validatedCases: ValidatedCase[]) => void;
  readonly onGoBack: () => void;
  readonly completeCaseType: CompleteCaseType;
  readonly caseTypeId: string;
  readonly queryKey: string[];
};

export const EpiUploadValidate = ({
  selectFileResult,
  mappedColumns,
  onProceed,
  onGoBack,
  completeCaseType,
  queryKey,
}: EpiUploadValidateProps) => {
  const [isCompleteCaseTypeLoaded, setIsCompleteCaseTypeLoaded] = useState<boolean>(false);

  const onCompleteCaseTypeLoaded = useCallback(() => {
    setIsCompleteCaseTypeLoaded(true);
  }, []);

  return (
    <EpiCompletCaseTypeLoader
      caseTypeId={completeCaseType.id}
      onCompleteCaseTypeLoaded={onCompleteCaseTypeLoaded}
    >
      {isCompleteCaseTypeLoaded && (
        <EpiUploadValidateContent
          selectFileResult={selectFileResult}
          mappedColumns={mappedColumns}
          completeCaseType={completeCaseType}
          caseTypeId={selectFileResult.completeCaseType.id}
          queryKey={queryKey}
          onProceed={onProceed}
          onGoBack={onGoBack}
        />
      )}
    </EpiCompletCaseTypeLoader>
  );
};
