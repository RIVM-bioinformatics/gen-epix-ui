import { useMemo } from 'react';
import type {
  PropsWithChildren,
  ReactNode,
} from 'react';
import type { CircularProgressProps } from '@mui/material';

import { Spinner } from '../Spinner';
import { GenericErrorMessage } from '../GenericErrorMessage';
import type { Loadable } from '../../../models/dataHooks';
import { LoadableUtil } from '../../../utils/LoadableUtil';

export type ResponseHandlerProps = PropsWithChildren<{
  readonly enabled?: boolean;
  readonly error?: unknown;
  readonly inlineSpinner?: boolean;
  readonly isLoading?: boolean;
  readonly loadables?: Loadable | Loadable[];
  readonly loadingContent?: ReactNode;
  readonly loadingMessage?: string;
  readonly shouldHideActionButtons?: boolean;
  readonly spinnerSize?: CircularProgressProps['size'];
  readonly takingLongerTimeoutMs?: number;
}>;

export const ResponseHandler = ({
  children,
  enabled,
  error: userError,
  inlineSpinner,
  isLoading: userIsLoading,
  loadables,
  loadingContent,
  loadingMessage,
  shouldHideActionButtons,
  spinnerSize,
  takingLongerTimeoutMs,
}: ResponseHandlerProps): ReactNode => {
  const loadablesArray = useMemo(() => {
    if (!loadables) {
      return [];
    }
    if (Array.isArray(loadables)) {
      return loadables;
    }
    return [loadables];
  }, [loadables]);
  if (enabled === false) {
    return children;
  }

  const error = userError || LoadableUtil.findFirstError(loadablesArray);
  const isLoading = userIsLoading || LoadableUtil.isSomeLoading(loadablesArray);

  return (
    <>
      {error && (
        <GenericErrorMessage
          error={error}
          shouldHideActionButtons={shouldHideActionButtons}
        />
      )}
      {isLoading && !error && (
        <>
          {!!loadingContent && loadingContent}
          {!loadingContent && (
            <Spinner
              inline={inlineSpinner}
              label={loadingMessage}
              size={spinnerSize}
              takingLongerTimeoutMs={takingLongerTimeoutMs}
            />
          )}
        </>

      )}
      {!isLoading && !error && children}
    </>
  );
};
