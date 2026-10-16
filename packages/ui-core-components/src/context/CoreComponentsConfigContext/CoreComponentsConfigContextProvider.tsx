import type { PropsWithChildren } from 'react';

import type { CoreComponentsConfig } from './CoreComponentsConfigContext';
import { CoreComponentsConfigContext } from './CoreComponentsConfigContext';


export type CoreComponentsContextProviderProps = PropsWithChildren<{
  readonly config: CoreComponentsConfig;
}>;

export const CoreComponentsContextProvider = (
  props: CoreComponentsContextProviderProps,
) => {
  const { children, config } = props;
  return (
    <CoreComponentsConfigContext value={config}>
      {children}
    </CoreComponentsConfigContext>
  );
};
