import type { CommonDbOrganizationContacts } from '@gen-epix/api-commondb';
import { createRef } from 'react';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  mockApiRequest,
  renderComponent,
} from '../../../test/lib';

import { EpiContactDetailsDialog } from './EpiContactDetailsDialog';
import type { EpiContactDetailsDialogRefMethods } from './EpiContactDetailsDialog';

const ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001';
const ORGANIZATION_NAME = 'Example organization';
const SITE_WITH_CONTACTS_ID = '00000000-0000-4000-8000-000000000010';
const SITE_WITHOUT_CONTACTS_ID = '00000000-0000-4000-8000-000000000011';

const ORGANIZATION_CONTACTS: CommonDbOrganizationContacts = {
  contacts: [
    {
      email: 'alice@example.com',
      id: '00000000-0000-4000-8000-000000000100',
      name: 'Alice',
      phone: '+31 000 000 001',
      site_id: SITE_WITH_CONTACTS_ID,
    },
    {
      email: null,
      id: '00000000-0000-4000-8000-000000000101',
      name: 'Bob',
      phone: null,
      site_id: SITE_WITH_CONTACTS_ID,
    },
  ],
  organization: {
    code: 'EXAMPLE',
    id: ORGANIZATION_ID,
    name: ORGANIZATION_NAME,
  },
  sites: [
    {
      id: SITE_WITH_CONTACTS_ID,
      name: 'Site with contacts',
      organization_id: ORGANIZATION_ID,
    },
    {
      id: SITE_WITHOUT_CONTACTS_ID,
      name: 'Site without contacts',
      organization_id: ORGANIZATION_ID,
    },
  ],
};

const renderDialog = async (contacts: CommonDbOrganizationContacts) => {
  mockApiRequest('POST', '/v1/retrieve/organization_contacts', () => Response.json(contacts));
  const ref = createRef<EpiContactDetailsDialogRefMethods>();
  const screen = await renderComponent(
    <EpiContactDetailsDialog ref={ref} />,
  );
  ref.current?.open({
    organizationId: ORGANIZATION_ID,
    organizationName: ORGANIZATION_NAME,
  });
  return screen;
};

describe('EpiContactDetailsDialog', () => {
  it('shows the organization name in the title', async () => {
    const screen = await renderDialog(ORGANIZATION_CONTACTS);

    await expect.element(screen.getByRole('heading', { name: `${ORGANIZATION_NAME} contact details` })).toBeVisible();
  });

  it('shows a message when the organization has no contacts', async () => {
    const screen = await renderDialog({
      contacts: [],
      organization: ORGANIZATION_CONTACTS.organization,
      sites: [],
    });

    await expect.element(screen.getByText('No contact details found for this organization')).toBeVisible();
  });

  it('renders each site with its contacts, email links and phone numbers', async () => {
    const screen = await renderDialog(ORGANIZATION_CONTACTS);

    await expect.element(screen.getByRole('heading', { name: 'Site with contacts' })).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: 'Site without contacts' })).toBeVisible();
    await expect.element(screen.getByText('Alice')).toBeVisible();
    await expect.element(screen.getByRole('link', { name: 'alice@example.com' })).toHaveAttribute('href', 'mailto:alice@example.com');
    await expect.element(screen.getByText('+31 000 000 001')).toBeVisible();
    await expect.element(screen.getByText('Bob')).toBeVisible();
    await expect.element(screen.getByText('Email address: unknown')).toBeVisible();
    await expect.element(screen.getByText('Phone number: unknown')).toBeVisible();
    await expect.element(screen.getByText('No contact details found for this site')).toBeVisible();
    await expect.element(screen.getByText('No contact details found for this organization')).not.toBeInTheDocument();
  });
});
