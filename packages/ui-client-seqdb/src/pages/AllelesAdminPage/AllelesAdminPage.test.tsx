import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbAllele } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbPermissionType,
  SeqDbSeqFormat,
} from '@gen-epix/api-seqdb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { AllelesAdminPage } from './AllelesAdminPage';

type AlleleFixture = { readonly id: string } & SeqDbAllele;

const ALLELES_PATH = '/v1/alleles';
const LOCI_PATH = '/v1/loci';
const ROUTE_PATH = '/management/alleles';
const URL = '/management/alleles';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const ALLELE_PERMISSIONS = [
  { command_name: SeqDbCommandName.AlleleCrudCommand, permission_type: SeqDbPermissionType.CREATE },
] as unknown as CommonDbApiPermission[];

const alleleAlphaFixture: AlleleFixture = {
  id: 'allele-alpha',
  length: 4,
  locus_id: 'locus-1',
  seq: 'ACGT',
  seq_format: SeqDbSeqFormat.STR_DNA,
};

const alleleBetaFixture: AlleleFixture = {
  id: 'allele-beta',
  locus_id: 'locus-2',
  seq: 'GGCC',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockLoci = () => {
  mockApiRequest('GET', LOCI_PATH, () => Response.json([
    { code: 'A', id: 'locus-1', name: 'Alpha' },
    { code: 'B', id: 'locus-2' },
  ]));
};

const renderPage = async (initialItems: AlleleFixture[] = [alleleAlphaFixture, alleleBetaFixture], permissions = ALLELE_PERMISSIONS) => {
  mockLoci();
  const mock = mockCrudApi(ALLELES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <AllelesAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

/**
 * Overrides the POST handler of mockCrudApi so that the response can be shaped per test.
 */
const mockAllelePost = (responseBody: (body: Partial<SeqDbAllele>) => unknown) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', ALLELES_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbAllele>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

describe('AllelesAdminPage', () => {
  it('lists the alleles with their option labels and length', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ACGT' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'GGCC' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'DNA sequence' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'A - Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'B' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '4' })).toBeInTheDocument();
  });

  it('creates an allele via the alleles endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockAllelePost(body => ({ ...body, id: 'created-allele' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new allele', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Locus' }).click();
    await screen.getByRole('option', { exact: true, name: 'A - Alpha' }).click();
    await screen.getByRole('textbox', { name: 'Sequence' }).fill('TTAA');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ locus_id: 'locus-1', seq: 'TTAA' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('TTAA')]));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('shows an error notification when the created allele has no ID', async () => {
    const { screen } = await renderPage();
    mockAllelePost(body => body);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Locus' }).click();
    await screen.getByRole('option', { exact: true, name: 'B' }).click();
    await screen.getByRole('textbox', { name: 'Sequence' }).fill('TTAA');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([alleleAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ACGT' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('fails to load the alleles when an allele has an empty ID', async () => {
    mockLoci();
    mockApiRequest('GET', ALLELES_PATH, () => Response.json([{ id: '', locus_id: 'locus-1', seq: 'ACGT' }]));
    const screen = await renderRoutedPage(
      <AllelesAdminPage />, {
        path: ROUTE_PATH,
        permissions: ALLELE_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ACGT' })).not.toBeInTheDocument();
  });

  it('names an allele by its ID when its sequence is empty', async () => {
    mockLoci();
    mockApiRequest('GET', ALLELES_PATH, () => Response.json([{ id: 'allele-gamma', locus_id: 'locus-1', seq: '' }]));
    const screen = await renderRoutedPage(
      <AllelesAdminPage />, {
        path: ROUTE_PATH,
        permissions: ALLELE_PERMISSIONS,
        url: URL,
      },
    );

    await screen.getByRole('cell', { exact: true, name: 'A - Alpha' }).click();
    await expect.element(screen.getByText('Edit item: allele-gamma', { exact: true })).toBeVisible();
  });

  it('fails to load the alleles when an allele has no ID', async () => {
    mockLoci();
    mockApiRequest('GET', ALLELES_PATH, () => Response.json([{ id: null, locus_id: 'locus-1', seq: 'ACGT' }]));
    const screen = await renderRoutedPage(
      <AllelesAdminPage />, {
        path: ROUTE_PATH,
        permissions: ALLELE_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ACGT' })).not.toBeInTheDocument();
  });
});
