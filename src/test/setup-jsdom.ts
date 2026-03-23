import { setupTestEnvironment } from './setup';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

setupTestEnvironment();
