import { App } from '@gen-epix/ui-client-common/components/app/App';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { useMemo } from 'react';
import type { DependencyContainer } from 'tsyringe';

import type { CaseDbConfig } from '../../../models/config.models';
import { createUserProfileStore } from '../../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';

export type CaseDbAppProps = {
  readonly container: DependencyContainer;
};

export const CaseDbApp = ({ container }: CaseDbAppProps) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>(container);
  const userProfileStore = useMemo(() => createUserProfileStore(config), [config]);
  return (
    <UserProfileStoreContext value={userProfileStore}>
      <App container={container} />
    </UserProfileStoreContext>
  );
};
