import type { ComponentType } from 'react';

import type { EpiDashboardStoreLoaderProps } from './EpiDashboardStoreLoader';
import { EpiDashboardStoreLoader } from './EpiDashboardStoreLoader';

export type WithEpiDashboardStoreProps = EpiDashboardStoreLoaderProps;

export const withEpiDashboardStore = <P extends WithEpiDashboardStoreProps>(WrappedComponent: ComponentType<P>): ComponentType<P> => {
  return (props: WithEpiDashboardStoreProps) => (
    <EpiDashboardStoreLoader
      caseSet={props.caseSet}
      caseTypeId={props.caseTypeId}
    >
      <WrappedComponent
        {...props as P}
      />
    </EpiDashboardStoreLoader>
  );
};
