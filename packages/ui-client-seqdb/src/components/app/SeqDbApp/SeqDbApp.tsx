import { App } from '@gen-epix/ui-client-common/components/app/App';
import type { DependencyContainer } from 'tsyringe';

export type SeqDbAppProps = {
  readonly container: DependencyContainer;
};

export const SeqDbApp = ({ container }: SeqDbAppProps) => {
  return (
    <App container={container} />
  );
};
