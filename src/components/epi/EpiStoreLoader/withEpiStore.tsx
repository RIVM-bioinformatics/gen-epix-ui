import type { ComponentType } from 'react';

import type { EpiStoreLoaderProps } from './EpiStoreLoader';
import { EpiStoreLoader } from './EpiStoreLoader';

export type WithEpiStoreProps = EpiStoreLoaderProps;

export const withEpiStore = <P extends WithEpiStoreProps>(WrappedComponent: ComponentType<P>): ComponentType<P> =>{
  return (props: WithEpiStoreProps) => (
    <EpiStoreLoader
      caseSet={props.caseSet}
      caseTypeId={props.caseTypeId}
    >
      <WrappedComponent
        {...props as P}
      />
    </EpiStoreLoader>
  );
};
