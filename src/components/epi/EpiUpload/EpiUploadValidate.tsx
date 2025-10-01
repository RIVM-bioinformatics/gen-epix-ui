import {
  useCallback,
  useState,
} from 'react';

import { EpiCompletCaseTypeLoader } from '../EpiCompletCaseTypeLoader';

import type { EpiUploadValidateContentProps } from './EpiUploadValidateContent';
import { EpiUploadValidateContent } from './EpiUploadValidateContent';

export type EpiUploadValidateProps = EpiUploadValidateContentProps;


export const EpiUploadValidate = (props: EpiUploadValidateProps) => {
  const [isCompleteCaseTypeLoaded, setIsCompleteCaseTypeLoaded] = useState<boolean>(false);

  const onCompleteCaseTypeLoaded = useCallback(() => {
    setIsCompleteCaseTypeLoaded(true);
  }, []);

  return (
    <EpiCompletCaseTypeLoader
      caseTypeId={props.completeCaseType.id}
      onCompleteCaseTypeLoaded={onCompleteCaseTypeLoaded}
    >
      {isCompleteCaseTypeLoaded && (
        <EpiUploadValidateContent
          {...props}
        />
      )}
    </EpiCompletCaseTypeLoader>
  );
};
