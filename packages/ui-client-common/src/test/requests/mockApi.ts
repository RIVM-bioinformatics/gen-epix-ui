import { BatchInterceptor } from '@mswjs/interceptors';
import { FetchInterceptor } from '@mswjs/interceptors/fetch';
import { XMLHttpRequestInterceptor } from '@mswjs/interceptors/XMLHttpRequest';

export const TEST_API_ORIGIN = 'https://api.test.invalid';

type Method = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
type Responder = (request: Request) => Promise<Response> | Response;
const handlers = new Map<string, Responder>();

export const mockApiRequest = (method: Method, pathname: string, respond: Responder) => {
  handlers.set(`${method} ${pathname}`, respond);
};

export const startTestApi = () => {
  const unexpected: string[] = [];
  const transport = new BatchInterceptor({
    interceptors: [new FetchInterceptor(), new XMLHttpRequestInterceptor()],
    name: 'component-test-api',
  });
  transport.on('request', async ({ controller, request }) => {
    const url = new URL(request.url);
    const isSameOrigin = url.origin === globalThis.location.origin;
    if (url.origin !== TEST_API_ORIGIN && !isSameOrigin) {
      return;
    }
    const key = `${request.method} ${url.pathname}`;
    const respond = handlers.get(key);
    if (!respond) {
      // Same-origin requests without a registered handler reach the dev server, e.g. Vite module requests.
      if (isSameOrigin) {
        return;
      }
      unexpected.push(key);
      controller.respondWith(Response.json({ detail: `Unhandled test request: ${key}` }, { status: 501 }));
      return;
    }
    controller.respondWith(await respond(request));
  });
  transport.apply();
  return () => {
    transport.dispose();
    handlers.clear();
    if (unexpected.length) {
      throw new Error(`Missing component-test API handlers: ${unexpected.join(', ')}`);
    }
  };
};
