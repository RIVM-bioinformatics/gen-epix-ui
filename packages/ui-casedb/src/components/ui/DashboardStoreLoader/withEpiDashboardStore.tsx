import type { ComponentType } from 'react';

import type { DashboardStoreLoaderProps } from './DashboardStoreLoader';
import { DashboardStoreLoader } from './DashboardStoreLoader';

export type WithEpiDashboardStoreProps = DashboardStoreLoaderProps;

export const withEpiDashboardStore = <P extends WithEpiDashboardStoreProps>(WrappedComponent: ComponentType<P>): ComponentType<P> => {
  return (props: WithEpiDashboardStoreProps) => {
    return (
      <DashboardStoreLoader
        caseSet={props.caseSet}
        caseTypeId={props.caseTypeId}
      >
        <WrappedComponent
          {...props as P}
        />
      </DashboardStoreLoader>
    );
  };
};
