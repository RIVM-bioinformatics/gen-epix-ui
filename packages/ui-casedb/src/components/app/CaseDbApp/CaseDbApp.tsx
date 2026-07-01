import { App } from '@gen-epix/ui';
import { useMemo } from 'react';

import { createUserProfileStore } from '../../../stores/userProfileStore';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';

export const CaseDbApp = () => {
  const userProfileStore = useMemo(() => createUserProfileStore(), []);
  return (
    <UserProfileStoreContext value={userProfileStore}>
      <App />
    </UserProfileStoreContext>
  );
};
