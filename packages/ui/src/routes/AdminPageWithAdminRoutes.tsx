import { useTranslation } from 'react-i18next';

import { AdminPage } from '../pages/AdminPage';

import { createAdminRoutes } from './adminRoutes';

export const AdminPageWithAdminRoutes = () => {
  const { t } = useTranslation();
  const adminRoutes = createAdminRoutes(t);
  return (
    <AdminPage routes={adminRoutes} />
  );
};
