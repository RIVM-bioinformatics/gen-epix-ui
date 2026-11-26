import {
  mockApiRequest,
  renderClientComponent,
} from '@gen-epix/ui-client-common/test/lib';

import type { CaseDbConfig } from '../../models/config.models';

export const renderComponent = renderClientComponent<CaseDbConfig>;

/**
 * Mocks the case upload job endpoint. A successful response of the responder is
 * returned as the result of a job that has already succeeded, so that no polling is
 * needed; an error response is returned as is.
 */
export const mockUploadCasesJobRequest = (respond: (request: Request) => Promise<Response> | Response) => {
  mockApiRequest('POST', '/v1/upload/cases/jobs', async (request) => {
    const response = await respond(request);
    if (!response.ok) {
      return response;
    }
    return Response.json({
      id: 'upload-job-1',
      result: await response.json() as unknown,
      status: 'SUCCEEDED',
      submitted_at: '2026-11-26T12:00:00Z',
    }, { status: 202 });
  });
};
