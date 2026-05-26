import {
  use,
  useCallback,
  useState,
} from 'react';
import { useStore } from 'zustand';

import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import { EpiCompletCaseTypeLoader } from '../EpiCompletCaseTypeLoader';

import { EpiUploadValidateInner } from './EpiUploadValidateInner';


export const EpiUploadValidate = () => {
  const store = use(EpiUploadStoreContext);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);

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
        <EpiUploadValidateInner />
      )}
    </EpiCompletCaseTypeLoader>
  );
};
