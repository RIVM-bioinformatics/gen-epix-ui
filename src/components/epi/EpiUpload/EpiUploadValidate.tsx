import {
  useCallback,
  useContext,
  useState,
} from 'react';
import { useStore } from 'zustand';

import { EpiCompletCaseTypeLoader } from '../EpiCompletCaseTypeLoader';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';

import { EpiUploadValidateContent } from './EpiUploadValidateContent';


export const EpiUploadValidate = () => {
  const store = useContext(EpiUploadStoreContext);
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
        <EpiUploadValidateContent />
      )}
    </EpiCompletCaseTypeLoader>
  );
};
