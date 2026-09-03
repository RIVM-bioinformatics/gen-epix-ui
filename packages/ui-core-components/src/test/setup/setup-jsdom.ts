global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export const setupTestEnvironment = () => {

  vi.setConfig({
    testTimeout: 10000,
  });
};
