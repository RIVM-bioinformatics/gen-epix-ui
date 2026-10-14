import { App } from '@gen-epix/ui-client-common/components/app/App';
import type { UiClientCommonContainer } from '@gen-epix/ui-client-common/classes/containers/UiClientCommonContainer';

export type OmopDbAppProps = {
  readonly container: UiClientCommonContainer;
};

export const OmopDbApp = ({ container }: OmopDbAppProps) => {
  return (
    <App container={container} />
  );
};
