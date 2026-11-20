import 'reflect-metadata';

export const setupTestEnvironment = () => {
  vi.setConfig({
    testTimeout: 30000,
  });
};

setupTestEnvironment();
