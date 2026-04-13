import { setup } from '../setup/setup';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  setup();

  vi.setConfig({
    testTimeout: 10000,
  });
};
