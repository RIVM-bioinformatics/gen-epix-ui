import { setupI18next } from './i18next';
import { setupYup } from './yup';

export const setup = () => {
  setupYup();
  setupI18next();
};
