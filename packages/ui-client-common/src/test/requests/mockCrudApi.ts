import { mockApiRequest } from './mockApi';

export type MockCrudApiCall = {
  body: unknown;
  method: string;
  pathname: string;
};

type CrudItem = {
  id: string;
};

const NO_CONTENT_STATUS = 204;
const CREATED_STATUS = 201;

/**
 * Mocks the GetAll, PostOne, PutOne and DeleteOne endpoints of a resource with an in-memory store.
 * Every request is recorded in the returned `calls` array.
 */
export const mockCrudApi = <TItem extends CrudItem>(basePath: string, initialItems: TItem[]) => {
  const items: TItem[] = [...initialItems];
  const calls: MockCrudApiCall[] = [];

  const mockItemEndpoints = (itemId: string) => {
    const itemPath = `${basePath}/${itemId}`;
    mockApiRequest('PUT', itemPath, async (request) => {
      const body = await request.json() as Partial<TItem>;
      calls.push({ body, method: 'PUT', pathname: itemPath });
      const index = items.findIndex((item) => item.id === itemId);
      const updated = { ...items[index], ...body, id: itemId };
      items[index] = updated;
      return Response.json(updated);
    });
    mockApiRequest('DELETE', itemPath, () => {
      calls.push({ body: null, method: 'DELETE', pathname: itemPath });
      const index = items.findIndex((item) => item.id === itemId);
      items.splice(index, 1);
      return new Response(null, { status: NO_CONTENT_STATUS });
    });
  };

  mockApiRequest('GET', basePath, () => Response.json(items));
  mockApiRequest('POST', basePath, async (request) => {
    const body = await request.json() as Omit<TItem, 'id'>;
    calls.push({ body, method: 'POST', pathname: basePath });
    const created = { ...body, id: `created-${items.length + 1}` } as TItem;
    items.push(created);
    mockItemEndpoints(created.id);
    return Response.json(created, { status: CREATED_STATUS });
  });
  initialItems.forEach((item) => {
    mockItemEndpoints(item.id);
  });

  return { calls, items };
};
