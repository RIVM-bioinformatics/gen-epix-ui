import { App } from '@gen-epix/ui-client-common/components/app/App';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { useMemo } from 'react';

import type { CaseDbConfig } from '../../../models/config.models';
import { createUserProfileStore } from '../../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';

export const CaseDbApp = () => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const userProfileStore = useMemo(() => createUserProfileStore(config), [config]);
  return (
    <UserProfileStoreContext value={userProfileStore}>
      <App />
    </UserProfileStoreContext>
  );
};
