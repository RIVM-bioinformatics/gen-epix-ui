import { RouterProvider } from 'react-router-dom';

import { RouterService } from '../../../classes/services/RouterService';

export const AppRouterProvider = () => <RouterProvider router={RouterService.getInstance().router} />;
