import {
  useCallback,
  useState,
} from 'react';
import type { ComponentType } from 'react';

import type { CompletCaseTypeLoaderProps } from './CompletCaseTypeLoader';
import { CompletCaseTypeLoader } from './CompletCaseTypeLoader';

export type WithEpiCompleteCaseTypeLoaderProps = CompletCaseTypeLoaderProps;

export const withEpiCompleteCaseTypeLoader = <P extends WithEpiCompleteCaseTypeLoaderProps>(WrappedComponent: ComponentType<P>): ComponentType<P> => {
  return (props: WithEpiCompleteCaseTypeLoaderProps) => {
    const [isCompleteCaseTypeLoaded, setIsCompleteCaseTypeLoaded] = useState<boolean>(false);

    const onCompleteCaseTypeLoaded = useCallback(() => {
      setIsCompleteCaseTypeLoaded(true);
    }, []);

    return (
      <CompletCaseTypeLoader
        caseTypeId={props.caseTypeId}
        onCompleteCaseTypeLoaded={onCompleteCaseTypeLoaded}
      >
        {isCompleteCaseTypeLoaded && (
          <WrappedComponent
            {...props as P}
          />
        )}
      </CompletCaseTypeLoader>
    );
  };
};
