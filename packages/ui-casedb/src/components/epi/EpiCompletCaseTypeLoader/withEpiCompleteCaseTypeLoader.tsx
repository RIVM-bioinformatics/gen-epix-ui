import {
  useCallback,
  useState,
} from 'react';
import type { ComponentType } from 'react';

import type { EpiCompletCaseTypeLoaderProps } from './EpiCompletCaseTypeLoader';
import { EpiCompletCaseTypeLoader } from './EpiCompletCaseTypeLoader';

export type WithEpiCompleteCaseTypeLoaderProps = EpiCompletCaseTypeLoaderProps;

export const withEpiCompleteCaseTypeLoader = <P extends WithEpiCompleteCaseTypeLoaderProps>(WrappedComponent: ComponentType<P>): ComponentType<P> => {
  return (props: WithEpiCompleteCaseTypeLoaderProps) => {
    const [isCompleteCaseTypeLoaded, setIsCompleteCaseTypeLoaded] = useState<boolean>(false);

    const onCompleteCaseTypeLoaded = useCallback(() => {
      setIsCompleteCaseTypeLoaded(true);
    }, []);

    return (
      <EpiCompletCaseTypeLoader
        caseTypeId={props.caseTypeId}
        onCompleteCaseTypeLoaded={onCompleteCaseTypeLoaded}
      >
        {isCompleteCaseTypeLoaded && (
          <WrappedComponent
            {...props as P}
          />
        )}
      </EpiCompletCaseTypeLoader>
    );
  };
};
