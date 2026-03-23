import { setup } from '../setup/setup';

export const setupTestEnvironment = () => {
  setup();

  vi.setConfig({
    testTimeout: 10000,
  });
};
