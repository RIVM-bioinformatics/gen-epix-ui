/* eslint-disable @typescript-eslint/naming-convention */
import type { TFunction } from 'i18next';

import {
  CommandName,
  PermissionType,
} from '../api';
import { ADMIN_PAGE_CATEGORY } from '../models/admin';
import type { MyNonIndexRouteObject } from '../models/reactRouter';
import { CaseSetStatusAdminPage } from '../pages/CaseSetStatusAdminPage';
import { ColsAdminPage } from '../pages/ColsAdminPage';
import { ColSetsAdminPage } from '../pages/ColSetsAdminPage';
import { DimsAdminPage } from '../pages/DimsAdminPage';
import { CaseTypesAdminPage } from '../pages/CaseTypesAdminPage';
import { CaseTypeSetCategoriesAdminPage } from '../pages/CaseTypeSetCategoriesAdminPage';
import { CaseTypeSetsAdminPage } from '../pages/CaseTypeSetsAdminPage';
import { RefColsAdminPage } from '../pages/RefColsAdminPage';
import { ConceptRelationsAdminPage } from '../pages/ConceptRelationsAdminPage';
import { ConceptsAdminPage } from '../pages/ConceptsAdminPage';
import { ConceptSetsAdminPage } from '../pages/ConceptSetsAdminPage';
import { DataCollectionsAdminPage } from '../pages/DataCollectionsAdminPage';
import { DataCollectionSetsAdminPage } from '../pages/DataCollectionSetsAdminPage';
import { RefDimsAdminPage } from '../pages/RefDimsAdminPage';
import { DiseasesAdminPage } from '../pages/DiseasesAdminPage';
import { EtiologicalAgentsAdminPage } from '../pages/EtiologicalAgentsAdminPage';
import { EtiologiesAdminPage } from '../pages/EtiologiesAdminPage';
import { IdentifierIssuersAdminPage } from '../pages/IdentifierIssuersAdminPage';
import { OrganizationAccessCasePoliciesAdminPage } from '../pages/OrganizationAccessCasePoliciesAdminPage';
import { OrganizationAdminPoliciesAdminPage } from '../pages/OrganizationAdminPoliciesAdminPage';
import { OrganizationContactsAdminPage } from '../pages/OrganizationContactsAdminPage';
import { OrganizationsAdminPage } from '../pages/OrganizationsAdminPage';
import { OrganizationShareCasePoliciesAdminPage } from '../pages/OrganizationShareCasePoliciesAdminPage';
import { OrganizationSitesAdminPage } from '../pages/OrganizationSitesAdminPage';
import { OutagesAdminPage } from '../pages/OutagesAdminPage';
import { RegionRelationsAdminPage } from '../pages/RegionRelationsAdminPage';
import { RegionsAdminPage } from '../pages/RegionsAdminPage';
import { RegionSetsAdminPage } from '../pages/RegionSetsAdminPage';
import { RegionSetShapesAdminPage } from '../pages/RegionSetShapesAdminPage';
import { RouterErrorPage } from '../pages/RouterErrorPage';
import { UserAccessCasePoliciesAdminPage } from '../pages/UserAccessCasePoliciesAdminPage';
import { UserInvitationsAdminPage } from '../pages/UserInvitationsAdminPage';
import { UsersAdminPage } from '../pages/UsersAdminPage';
import { UserEffectiveRightsAdminPage } from '../pages/UserEffectiveRightsAdminPage';
import { UserEffectiveRightsTesterAdminPage } from '../pages/UserEffectiveRightsTesterAdminPage';
import { UserShareCasePoliciesAdminPage } from '../pages/UserShareCasePoliciesAdminPage';
import { CaseSetCategoryAdminPage } from '../pages/CaseSetCategoryAdminPage';
import { DataCollectionVisualizationPage } from '../pages/DataCollectionVisualizationPage';

export const createAdminRoutes = (t: TFunction<'translation', undefined>): MyNonIndexRouteObject[] => [
  // USERS_AND_ORGANIZATIONS

  {
    path: '/management/organizations',
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Organizations`,
      requiredPermissions: [],
      requiresUserProfile: true,
      requirePermissionForChildRoute: true,
    },
    children: [
      {
        index: true,
        path: '/management/organizations',
        Component: () => <OrganizationsAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Organizations`,
          subTitle: t`Manage your organizations`,
          requiredPermissions: [
            { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
        },
      },
      {
        path: '/management/organizations/:organizationId/sites',
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Organization sites`,
          requiredPermissions: [],
          requiresUserProfile: true,
          requirePermissionForChildRoute: true,
        },
        children: [
          {
            index: true,
            path: '/management/organizations/:organizationId/sites',
            Component: () => <OrganizationSitesAdminPage />,
            errorElement: <RouterErrorPage />,
            handle: {
              title: t`Organization sites`,
              requiredPermissions: [
                { command_name: CommandName.SiteCrudCommand, permission_type: PermissionType.READ },
              ],
              requiresUserProfile: true,
            },
          },
          {
            path: '/management/organizations/:organizationId/sites/:siteId/contacts',
            Component: () => <OrganizationContactsAdminPage />,
            errorElement: <RouterErrorPage />,
            handle: {
              title: t`Site contacts`,
              requiredPermissions: [
                { command_name: CommandName.SiteCrudCommand, permission_type: PermissionType.READ },
              ],
              requiresUserProfile: true,
            },
          },
        ],
      },
    ],
  },
  {
    path: '/management/users',
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Users`,
      requiredPermissions: [],
      requiresUserProfile: true,
      requirePermissionForChildRoute: true,
    },
    children: [
      {
        index: true,
        path: '/management/users',
        Component: () => <UsersAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Users`,
          subTitle: t`Manage users`,
          requiredPermissions: [
            { command_name: CommandName.UserCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
        },
      },
      {
        path: '/management/users/:userId/effective-rights',
        Component: () => <UserEffectiveRightsAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Effective rights`,
          requiredPermissions: [
            { command_name: CommandName.ColSetMemberCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.ColSetCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.CaseTypeSetMemberCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.OrganizationShareCasePolicyCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.UserAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.UserShareCasePolicyCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.ColCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
        },
      },
      {
        path: '/management/users/:userId/effective-rights-tester',
        Component: () => <UserEffectiveRightsTesterAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Effective rights test`,
          requiredPermissions: [
            { command_name: CommandName.ColSetMemberCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.ColSetCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.CaseTypeSetMemberCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.OrganizationShareCasePolicyCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.UserAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.UserShareCasePolicyCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.ColCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
        },
      },
    ],
  },
  {
    path: '/management/user-invitations',
    Component: () => <UserInvitationsAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`User invitations`,
      subTitle: t`Invite users to your organization`,
      requiredPermissions: [
        { command_name: CommandName.UserInvitationCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
    },
  },
  {
    path: '/management/organization-admin-policies',
    Component: () => <OrganizationAdminPoliciesAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Organization admin policies`,
      subTitle: t`Manage organization admin policies`,
      requiredPermissions: [
        { command_name: CommandName.OrganizationAdminPolicyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.UserCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
    },
  },
  {
    path: '/management/identifier-issuers',
    Component: () => <IdentifierIssuersAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Identifier issuers`,
      subTitle: t`Manage identifier issuers`,
      requiredPermissions: [
        { command_name: CommandName.IdentifierIssuerCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
    },
  },

  // ACCESS_RIGHTS

  {
    path: '/management/data-collections',
    Component: () => <DataCollectionsAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Data collections`,
      subTitle: t`Manage data collections`,
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      requiredPermissions: [
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
      ],
    },
  },
  {
    path: '/management/data-collection-sets',
    Component: () => <DataCollectionSetsAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Data collection sets`,
      subTitle: t`Manage data collection sets`,
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      requiredPermissions: [
        { command_name: CommandName.DataCollectionSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionSetMemberCrudCommand, permission_type: PermissionType.READ },
      ],
    },
  },
  {
    path: '/management/col-sets',
    Component: () => <ColSetsAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Column sets`,
      subTitle: t`Manage column sets`,
      requiredPermissions: [
        { command_name: CommandName.ColSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.ColSetMemberCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.ColCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.RefColCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
    },
  },
  {
    path: '/management/organization-access-case-policies',
    Component: () => <OrganizationAccessCasePoliciesAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Organization access case policies`,
      subTitle: t`Manage organization access case policies`,
      requiredPermissions: [
        { command_name: CommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.ColSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
    },
  },
  {
    path: '/management/organization-share-case-policies',
    Component: () => <OrganizationShareCasePoliciesAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Organization share case policies`,
      subTitle: t`Manage organization share case policies`,
      requiredPermissions: [
        { command_name: CommandName.OrganizationShareCasePolicyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
    },
  },
  {
    path: '/management/user-access-case-policies',
    Component: () => <UserAccessCasePoliciesAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`User access case policies`,
      subTitle: t`Manage user access case policies`,
      requiredPermissions: [
        { command_name: CommandName.UserAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.UserCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.ColSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
    },
  },
  {
    path: '/management/user-share-case-policies',
    Component: () => <UserShareCasePoliciesAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`User share case policies`,
      subTitle: t`Manage user share case policies`,
      requiredPermissions: [
        { command_name: CommandName.UserAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.UserCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
    },
  },


  // REFERENCE_DATA
  {
    path: '/management/reference-dimensions',
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Reference dimensions`,
      requiredPermissions: [],
      requiresUserProfile: true,
      requirePermissionForChildRoute: true,
    },
    children: [
      {
        index: true,
        path: '/management/reference-dimensions',
        Component: () => <RefDimsAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Reference dimensions`,
          subTitle: t`Manage reference dimensions`,
          requiredPermissions: [
            { command_name: CommandName.RefDimCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
        },
      },
      {
        path: '/management/reference-dimensions/:refDimId/reference-columns',
        Component: () => <RefColsAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Reference columns`,
          subTitle: t`Manage reference columns`,
          requiredPermissions: [
            { command_name: CommandName.RefColCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.RefDimCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.ConceptSetCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.RegionSetCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.GeneticDistanceProtocolCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
        },
      },
    ],
  },
  {
    path: '/management/concept-sets',
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Concept Sets`,
      requiredPermissions: [],
      requiresUserProfile: true,
      requirePermissionForChildRoute: true,
    },
    children: [
      {
        index: true,
        path: '/management/concept-sets',
        Component: () => <ConceptSetsAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Concept Sets`,
          subTitle: t`Manage concept sets`,
          requiredPermissions: [
            { command_name: CommandName.ConceptSetCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
        },
      },
      {
        path: '/management/concept-sets/:conceptSetId/concepts',
        Component: () => <ConceptsAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Concepts`,
          subTitle: t`Manage concepts`,
          requiredPermissions: [
            { command_name: CommandName.ConceptCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
        },
      },
    ],
  },
  {
    path: '/management/concept-relations',
    Component: () => <ConceptRelationsAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Concept Relations`,
      subTitle: t`Manage concept relations`,
      requiredPermissions: [
        { command_name: CommandName.ConceptRelationCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.ConceptCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/diseases',
    Component: () => <DiseasesAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Diseases`,
      subTitle: t`Manage diseases`,
      requiredPermissions: [
        { command_name: CommandName.DiseaseCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/etiological-agents',
    Component: () => <EtiologicalAgentsAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Etiological agents`,
      subTitle: t`Manage etiological agents`,
      requiredPermissions: [
        { command_name: CommandName.EtiologicalAgentCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/etiologies',
    Component: () => <EtiologiesAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Etiologies`,
      subTitle: t`Manage etiologies`,
      requiredPermissions: [
        { command_name: CommandName.EtiologyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DiseaseCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.EtiologicalAgentCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/case-set-statuses',
    Component: () => <CaseSetStatusAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Case set statuses`,
      subTitle: t`Manage case set statuses`,
      requiredPermissions: [
        { command_name: CommandName.CaseSetStatusCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/case-set-categories',
    Component: () => <CaseSetCategoryAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Case set categories`,
      subTitle: t`Manage case set categories`,
      requiredPermissions: [
        { command_name: CommandName.CaseSetCategoryCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/case-types',
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Case types`,
      requiredPermissions: [],
      requiresUserProfile: true,
      requirePermissionForChildRoute: true,
    },
    children: [
      {
        index: true,
        path: '/management/case-types',
        Component: () => <CaseTypesAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Case types`,
          subTitle: t`Manage case types`,
          requiredPermissions: [
            { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.DiseaseCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.EtiologicalAgentCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
        },
      },
      {
        path: '/management/case-types/:caseTypeId/dimensions',
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Dimensions`,
          requiredPermissions: [],
          requiresUserProfile: true,
          requirePermissionForChildRoute: true,
        },
        children: [
          {
            index: true,
            path: '/management/case-types/:caseTypeId/dimensions',
            Component: () => <DimsAdminPage />,
            errorElement: <RouterErrorPage />,
            handle: {
              title: t`Dimensions`,
              subTitle: t`Manage dimensions`,
              requiredPermissions: [
                { command_name: CommandName.DimCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.RefDimCrudCommand, permission_type: PermissionType.READ },
              ],
              requiresUserProfile: true,
              category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
            },
          },
          {
            path: '/management/case-types/:caseTypeId/dimensions/:dimId/columns',
            Component: () => <ColsAdminPage />,
            errorElement: <RouterErrorPage />,
            handle: {
              title: t`Columns`,
              subTitle: t`Manage columns`,
              requiredPermissions: [
                { command_name: CommandName.ColCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.RefColCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.TreeAlgorithmCrudCommand, permission_type: PermissionType.READ },
                { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
              ],
              requiresUserProfile: true,
              category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
            },
          },
        ],
      },
    ],
  },
  {
    path: '/management/case-type-sets',
    Component: () => <CaseTypeSetsAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Case types sets`,
      subTitle: t`Manage case types sets`,
      requiredPermissions: [
        { command_name: CommandName.CaseTypeSetMemberCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/case-type-set-categories',
    Component: () => <CaseTypeSetCategoriesAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Case types set categories`,
      subTitle: t`Manage case types set categories`,
      requiredPermissions: [
        { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },

  {
    path: '/management/region-sets',
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Region sets`,
      requiredPermissions: [],
      requiresUserProfile: true,
      requirePermissionForChildRoute: true,
    },
    children: [
      {
        index: true,
        path: '/management/region-sets',
        Component: () => <RegionSetsAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Region sets`,
          subTitle: t`Manage region sets`,
          requiredPermissions: [
            { command_name: CommandName.RegionSetCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
        },
      },
      {
        path: '/management/region-sets/:regionSetId/regions',
        Component: () => <RegionsAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Regions`,
          subTitle: t`Manage regions`,
          requiredPermissions: [
            { command_name: CommandName.RegionCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.RegionSetCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
        },
      },
      {
        path: '/management/region-sets/:regionSetId/shapes',
        Component: () => <RegionSetShapesAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Region set shapes`,
          subTitle: t`Manage region set shapes`,
          requiredPermissions: [
            { command_name: CommandName.RegionSetShapeCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
        },
      },
    ],
  },
  {
    path: '/management/region-relations',
    Component: () => <RegionRelationsAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Region Relations`,
      subTitle: t`Manage region relations`,
      requiredPermissions: [
        { command_name: CommandName.RegionRelationCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.RegionCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },

  // SYSTEM
  {
    path: '/management/outages',
    Component: () => <OutagesAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Outages`,
      subTitle: t`Manage outages`,
      requiredPermissions: [],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.SYSTEM,
    },
  },

  // HELPERS
  {
    path: '/management/reference-columns',
    Component: () => <RefColsAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Reference columns (all)`,
      subTitle: t`View all reference columns`,
      requiredPermissions: [
        { command_name: CommandName.RefColCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.RefDimCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.ConceptSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.RegionSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.GeneticDistanceProtocolCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.HELPERS,
    },
  },
  {
    path: '/management/dimensions',
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Dimensions (all)`,
      requiredPermissions: [],
      requiresUserProfile: true,
      requirePermissionForChildRoute: true,
    },
    children: [
      {
        index: true,
        path: '/management/dimensions',
        Component: () => <DimsAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Dimensions (all)`,
          subTitle: t`View all dimensions`,
          requiredPermissions: [
            { command_name: CommandName.DimCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.RefDimCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.HELPERS,
        },
      },
      {
        path: '/management/dimensions/:dimId/columns',
        Component: () => <ColsAdminPage />,
        errorElement: <RouterErrorPage />,
        handle: {
          title: t`Columns`,
          subTitle: t`Manage columns`,
          requiredPermissions: [
            { command_name: CommandName.ColCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.RefColCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.TreeAlgorithmCrudCommand, permission_type: PermissionType.READ },
            { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
          ],
          requiresUserProfile: true,
          category: ADMIN_PAGE_CATEGORY.HELPERS,
        },
      },
    ],
  },
  {
    path: '/management/columns',
    Component: () => <ColsAdminPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Columns (all)`,
      subTitle: t`View all columns`,
      requiredPermissions: [
        { command_name: CommandName.ColCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.RefColCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.TreeAlgorithmCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.HELPERS,
    },
  },


  {
    path: '/management/data-collection-visualization-page',
    Component: () => <DataCollectionVisualizationPage />,
    errorElement: <RouterErrorPage />,
    handle: {
      title: t`Data collection visualization`,
      subTitle: t`View data collection visualization`,
      requiredPermissions: [],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.HELPERS,
    },
  },
];
