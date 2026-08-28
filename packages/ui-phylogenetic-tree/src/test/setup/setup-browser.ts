export const setupTestEnvironment = () => {

  vi.setConfig({
    testTimeout: 10000,
  });
};
