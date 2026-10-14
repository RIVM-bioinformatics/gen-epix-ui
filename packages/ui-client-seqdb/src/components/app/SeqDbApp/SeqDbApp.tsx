import { App } from '@gen-epix/ui-client-common/components/app/App';
import type { UiClientCommonContainer } from '@gen-epix/ui-client-common/classes/containers/UiClientCommonContainer';

export type SeqDbAppProps = {
  readonly container: UiClientCommonContainer;
};

export const SeqDbApp = ({ container }: SeqDbAppProps) => {
  return (
    <App container={container} />
  );
};
