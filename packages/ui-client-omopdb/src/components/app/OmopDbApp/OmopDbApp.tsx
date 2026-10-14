import { App } from '@gen-epix/ui-client-common/components/app/App';
import type { DependencyContainer } from 'tsyringe';

export type OmopDbAppProps = {
  readonly container: DependencyContainer;
};

export const OmopDbApp = ({ container }: OmopDbAppProps) => {
  return (
    <App container={container} />
  );
};
