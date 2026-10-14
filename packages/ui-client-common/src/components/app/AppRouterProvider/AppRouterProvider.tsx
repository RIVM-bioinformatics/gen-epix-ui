import { container as rootContainer } from 'tsyringe';
import { RouterProvider } from 'react-router-dom';

import { RouterService } from '../../../classes/services/RouterService';

export const AppRouterProvider = () => <RouterProvider router={rootContainer.resolve(RouterService).router} />;
