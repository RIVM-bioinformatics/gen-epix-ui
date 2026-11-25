import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom';
import { container } from 'tsyringe';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { PageEventBusService } from '../../../classes/services/PageEventBusService';
import type {
  ApplicationHeaderProps,
  ConfigBase,
  FooterConfig,
} from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';

import { PageContainer } from './PageContainer';
import type { PageContainerProps } from './PageContainer';

const FOOTER_LABEL = 'Footer contact';
const CONTENT_TEXT = 'Page content';
const HEADER_TEST_ID = 'ApplicationHeaderStub';
const FOOTER_CONFIG: FooterConfig = {
  sections: [
    {
      header: 'Contact',
      items: [
        {
          href: 'mailto:ids-bioinformatics@rivm.nl',
          label: FOOTER_LABEL,
        },
      ],
    },
  ],
};

const ApplicationHeaderStub = (props: ApplicationHeaderProps) => (
  <div
    data-full-height={String(Boolean(props.fullHeight))}
    data-full-width={String(Boolean(props.fullWidth))}
    data-single-action={String(Boolean(props.singleAction))}
    {...TestIdUtil.createAttributes(HEADER_TEST_ID)}
  >
    {'Application header'}
  </div>
);

const renderPage = async (
  props: Partial<PageContainerProps> = {},
  options: { enablePageEvents?: boolean; pageTestId?: string } = {},
) => {
  const { enablePageEvents = false, pageTestId } = options;
  return renderComponent(
    <PageContainer
      testIdAttributes={pageTestId ? TestIdUtil.createAttributes(pageTestId) : {}}
      title={'Test page'}
      {...props}
    >
      <p>
        {CONTENT_TEXT}
      </p>
    </PageContainer>,
    {
      configure: (config: ConfigBase) => {
        config.ApplicationHeader = ApplicationHeaderStub;
        config.createFooter = () => FOOTER_CONFIG;
        config.enablePageEvents = enablePageEvents;
      },
    },
  );
};

describe('PageContainer', () => {
  const removeListeners: (() => void)[] = [];

  afterEach(() => {
    for (const removeListener of removeListeners.splice(0)) {
      removeListener();
    }
  });

  const renderBreadcrumbPage = async (props: Partial<PageContainerProps>) => {
    const router = createMemoryRouter(
      [
        {
          element: (
            <PageContainer
              showBreadcrumbs
              testIdAttributes={{}}
              title={'Breadcrumb page'}
              {...props}
            >
              <p>
                {CONTENT_TEXT}
              </p>
            </PageContainer>
          ),
          handle: {
            requiredPermissions: [],
            requiresUserProfile: false,
            title: 'Home',
          },
          path: '/',
        },
      ],
      { initialEntries: ['/'] },
    );

    return renderComponent(
      <RouterProvider router={router} />,
      {
        configure: (config: ConfigBase) => {
          config.ApplicationHeader = ApplicationHeaderStub;
          config.createFooter = () => FOOTER_CONFIG;
          config.enablePageEvents = false;
        },
      },
    );
  };

  const collectChangePageNames = () => {
    const pageNames: string[] = [];
    removeListeners.push(
      container.resolve(PageEventBusService).addEventListener('changePage', (payload) => {
        pageNames.push(payload.pageName);
      }),
    );
    return pageNames;
  };

  it('sets the document title and renders the children, the header and the footer', async () => {
    const screen = await renderPage({ title: 'Overview' });

    expect(document.title).toContain('Overview');
    await expect.element(screen.getByText(CONTENT_TEXT)).toBeVisible();
    await expect.element(screen.getByTestId(HEADER_TEST_ID)).toBeVisible();
    await expect.element(screen.getByText(FOOTER_LABEL)).toBeVisible();
  });

  it('renders a skip link to the main content', async () => {
    const screen = await renderPage();

    await expect.element(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content');
  });

  it('renders a string content header as a heading', async () => {
    const screen = await renderPage({ contentHeader: 'Cases' });

    await expect.element(screen.getByRole('heading', { level: 2, name: 'Cases' })).toBeVisible();
  });

  it('renders an element content header as given', async () => {
    const screen = await renderPage({
      contentHeader: (
        <h3>
          {'Custom header'}
        </h3>
      ),
    });

    await expect.element(screen.getByRole('heading', { level: 3, name: 'Custom header' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Cases' }).elements()).toHaveLength(0);
  });

  it('renders the content actions next to the content header', async () => {
    const screen = await renderPage({
      contentActions: (
        <button type={'button'}>
          {'Add case'}
        </button>
      ),
      contentHeader: 'Cases',
    });

    await expect.element(screen.getByRole('heading', { level: 2, name: 'Cases' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Add case' })).toBeVisible();
  });

  it('renders content actions without a content header', async () => {
    const screen = await renderPage({
      contentActions: (
        <button type={'button'}>
          {'Add case'}
        </button>
      ),
    });

    await expect.element(screen.getByRole('button', { name: 'Add case' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Cases' }).elements()).toHaveLength(0);
  });

  it('renders no content header area when no header or actions are given', async () => {
    const screen = await renderPage();

    await expect.element(screen.getByText(CONTENT_TEXT)).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Cases' }).elements()).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Add case' }).elements()).toHaveLength(0);
  });

  it('hides the footer and shows the content as a single action', async () => {
    const screen = await renderPage({ singleAction: true });

    await expect.element(screen.getByText(CONTENT_TEXT)).toBeVisible();
    await expect.element(screen.getByTestId(HEADER_TEST_ID)).toHaveAttribute('data-single-action', 'true');
    expect(screen.getByText(FOOTER_LABEL).elements()).toHaveLength(0);
  });

  it('hides the footer for a full height page', async () => {
    const screen = await renderPage({ fullHeight: true });

    await expect.element(screen.getByText(CONTENT_TEXT)).toBeVisible();
    await expect.element(screen.getByTestId(HEADER_TEST_ID)).toHaveAttribute('data-full-height', 'true');
    expect(screen.getByText(FOOTER_LABEL).elements()).toHaveLength(0);
  });

  it('passes the full width flag to the header and footer', async () => {
    const screen = await renderPage({ fullWidth: true });

    await expect.element(screen.getByTestId(HEADER_TEST_ID)).toHaveAttribute('data-full-width', 'true');
    await expect.element(screen.getByText(FOOTER_LABEL)).toBeVisible();
  });

  it('renders breadcrumbs when requested', async () => {
    const screen = await renderBreadcrumbPage({});

    await expect.element(screen.getByRole('navigation', { name: 'breadcrumbs' })).toBeVisible();
    await expect.element(screen.getByText(CONTENT_TEXT)).toBeVisible();
  });

  it('renders breadcrumbs at full width when requested', async () => {
    const screen = await renderBreadcrumbPage({ fullWidth: true });

    await expect.element(screen.getByRole('navigation', { name: 'breadcrumbs' })).toBeVisible();
    await expect.element(screen.getByTestId(HEADER_TEST_ID)).toHaveAttribute('data-full-width', 'true');
  });

  it('does not render breadcrumbs by default', async () => {
    const screen = await renderPage();

    await expect.element(screen.getByText(CONTENT_TEXT)).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'breadcrumbs' }).elements()).toHaveLength(0);
  });

  it('emits a change page event with the test id when page events are enabled', async () => {
    const pageNames = collectChangePageNames();
    await renderPage({}, { enablePageEvents: true, pageTestId: 'PageContainer-enabled' });

    expect(pageNames).toContain('PageContainer-enabled');
  });

  it('does not emit a change page event when page events are disabled', async () => {
    const pageNames = collectChangePageNames();
    await renderPage({}, { enablePageEvents: false, pageTestId: 'PageContainer-disabled' });

    expect(pageNames).not.toContain('PageContainer-disabled');
  });

  it('does not emit a change page event when the page event is ignored', async () => {
    const pageNames = collectChangePageNames();
    await renderPage(
      { ignorePageEvent: true },
      { enablePageEvents: true, pageTestId: 'PageContainer-ignored' },
    );

    expect(pageNames).not.toContain('PageContainer-ignored');
  });

  it('does not emit a change page event when the page has no test id', async () => {
    const pageNames = collectChangePageNames();
    await renderPage({}, { enablePageEvents: true });

    expect(pageNames).toHaveLength(0);
  });
});
