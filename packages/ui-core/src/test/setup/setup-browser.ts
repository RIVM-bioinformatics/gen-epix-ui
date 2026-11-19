import 'reflect-metadata';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {
  vi.setConfig({
    testTimeout: 30000,
  });
};

setupTestEnvironment();
