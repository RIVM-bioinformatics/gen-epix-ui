/* eslint-disable @typescript-eslint/naming-convention */
import type { TFunction } from 'i18next';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';

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
    children: [
      {
        Component: OrganizationsAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
          requiredPermissions: [
            { command_name: CaseDbCommandName.OrganizationCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage your organizations`,
          title: t`Organizations`,
        },
        index: true,
        path: '/management/organizations',
      },
      {
        children: [
          {
            Component: OrganizationSitesAdminPage,
            errorElement: <RouterErrorPage />,
            handle: {
              requiredPermissions: [
                { command_name: CaseDbCommandName.SiteCrudCommand, permission_type: CaseDbPermissionType.READ },
              ],
              requiresUserProfile: true,
              title: t`Organization sites`,
            },
            index: true,
            path: '/management/organizations/:organizationId/sites',
          },
          {
            Component: OrganizationContactsAdminPage,
            errorElement: <RouterErrorPage />,
            handle: {
              requiredPermissions: [
                { command_name: CaseDbCommandName.SiteCrudCommand, permission_type: CaseDbPermissionType.READ },
              ],
              requiresUserProfile: true,
              title: t`Site contacts`,
            },
            path: '/management/organizations/:organizationId/sites/:siteId/contacts',
          },
        ],
        errorElement: <RouterErrorPage />,
        handle: {
          requiredPermissions: [],
          requirePermissionForChildRoute: true,
          requiresUserProfile: true,
          title: t`Organization sites`,
        },
        path: '/management/organizations/:organizationId/sites',
      },
    ],
    errorElement: <RouterErrorPage />,
    handle: {
      requiredPermissions: [],
      requirePermissionForChildRoute: true,
      requiresUserProfile: true,
      title: t`Organizations`,
    },
    path: '/management/organizations',
  },
  {
    children: [
      {
        Component: UsersAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
          requiredPermissions: [
            { command_name: CaseDbCommandName.UserCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.OrganizationCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage users`,
          title: t`Users`,
        },
        index: true,
        path: '/management/users',
      },
      {
        Component: UserEffectiveRightsAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          requiredPermissions: [
            { command_name: CaseDbCommandName.ColSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.ColSetCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.CaseTypeSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.OrganizationShareCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.UserAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.UserShareCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          title: t`Effective rights`,
        },
        path: '/management/users/:userId/effective-rights',
      },
      {
        Component: UserEffectiveRightsTesterAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          requiredPermissions: [
            { command_name: CaseDbCommandName.ColSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.ColSetCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.CaseTypeSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.OrganizationShareCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.UserAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.UserShareCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          title: t`Effective rights test`,
        },
        path: '/management/users/:userId/effective-rights-tester',
      },
    ],
    errorElement: <RouterErrorPage />,
    handle: {
      requiredPermissions: [],
      requirePermissionForChildRoute: true,
      requiresUserProfile: true,
      title: t`Users`,
    },
    path: '/management/users',
  },
  {
    Component: UserInvitationsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.UserInvitationCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.OrganizationCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Invite users to your organization`,
      title: t`User invitations`,
    },
    path: '/management/user-invitations',
  },
  {
    Component: OrganizationAdminPoliciesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.OrganizationAdminPolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.UserCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.OrganizationCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage organization admin policies`,
      title: t`Organization admin policies`,
    },
    path: '/management/organization-admin-policies',
  },
  {
    Component: IdentifierIssuersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.IdentifierIssuerCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage identifier issuers`,
      title: t`Identifier issuers`,
    },
    path: '/management/identifier-issuers',
  },

  // ACCESS_RIGHTS

  {
    Component: DataCollectionsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage data collections`,
      title: t`Data collections`,
    },
    path: '/management/data-collections',
  },
  {
    Component: DataCollectionSetsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.DataCollectionSetCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.DataCollectionSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage data collection sets`,
      title: t`Data collection sets`,
    },
    path: '/management/data-collection-sets',
  },
  {
    Component: ColSetsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.ColSetCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.ColSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage column sets`,
      title: t`Column sets`,
    },
    path: '/management/col-sets',
  },
  {
    Component: OrganizationAccessCasePoliciesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.OrganizationCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.ColSetCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage organization access case policies`,
      title: t`Organization access case policies`,
    },
    path: '/management/organization-access-case-policies',
  },
  {
    Component: OrganizationShareCasePoliciesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.OrganizationShareCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.OrganizationCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage organization share case policies`,
      title: t`Organization share case policies`,
    },
    path: '/management/organization-share-case-policies',
  },
  {
    Component: UserAccessCasePoliciesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.UserAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.UserCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.ColSetCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage user access case policies`,
      title: t`User access case policies`,
    },
    path: '/management/user-access-case-policies',
  },
  {
    Component: UserShareCasePoliciesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.UserAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.UserCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage user share case policies`,
      title: t`User share case policies`,
    },
    path: '/management/user-share-case-policies',
  },


  // REFERENCE_DATA
  {
    children: [
      {
        Component: RefDimsAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
          requiredPermissions: [
            { command_name: CaseDbCommandName.RefDimCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage reference dimensions`,
          title: t`Reference dimensions`,
        },
        index: true,
        path: '/management/reference-dimensions',
      },
      {
        Component: RefColsAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
          requiredPermissions: [
            { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.RefDimCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.ConceptSetCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.RegionSetCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.GeneticDistanceProtocolCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage reference columns`,
          title: t`Reference columns`,
        },
        path: '/management/reference-dimensions/:refDimId/reference-columns',
      },
    ],
    errorElement: <RouterErrorPage />,
    handle: {
      requiredPermissions: [],
      requirePermissionForChildRoute: true,
      requiresUserProfile: true,
      title: t`Reference dimensions`,
    },
    path: '/management/reference-dimensions',
  },
  {
    children: [
      {
        Component: ConceptSetsAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
          requiredPermissions: [
            { command_name: CaseDbCommandName.ConceptSetCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage concept sets`,
          title: t`Concept Sets`,
        },
        index: true,
        path: '/management/concept-sets',
      },
      {
        Component: ConceptsAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
          requiredPermissions: [
            { command_name: CaseDbCommandName.ConceptCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage concepts`,
          title: t`Concepts`,
        },
        path: '/management/concept-sets/:conceptSetId/concepts',
      },
    ],
    errorElement: <RouterErrorPage />,
    handle: {
      requiredPermissions: [],
      requirePermissionForChildRoute: true,
      requiresUserProfile: true,
      title: t`Concept Sets`,
    },
    path: '/management/concept-sets',
  },
  {
    Component: ConceptRelationsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [
        { command_name: CaseDbCommandName.ConceptRelationCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.ConceptCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage concept relations`,
      title: t`Concept Relations`,
    },
    path: '/management/concept-relations',
  },
  {
    Component: DiseasesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [
        { command_name: CaseDbCommandName.DiseaseCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage diseases`,
      title: t`Diseases`,
    },
    path: '/management/diseases',
  },
  {
    Component: EtiologicalAgentsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [
        { command_name: CaseDbCommandName.EtiologicalAgentCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage etiological agents`,
      title: t`Etiological agents`,
    },
    path: '/management/etiological-agents',
  },
  {
    Component: EtiologiesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [
        { command_name: CaseDbCommandName.EtiologyCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.DiseaseCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.EtiologicalAgentCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage etiologies`,
      title: t`Etiologies`,
    },
    path: '/management/etiologies',
  },
  {
    Component: CaseSetStatusAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [
        { command_name: CaseDbCommandName.CaseSetStatusCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage case set statuses`,
      title: t`Case set statuses`,
    },
    path: '/management/case-set-statuses',
  },
  {
    Component: CaseSetCategoryAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [
        { command_name: CaseDbCommandName.CaseSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage case set categories`,
      title: t`Case set categories`,
    },
    path: '/management/case-set-categories',
  },
  {
    children: [
      {
        Component: CaseTypesAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
          requiredPermissions: [
            { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.DiseaseCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.EtiologicalAgentCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage case types`,
          title: t`Case types`,
        },
        index: true,
        path: '/management/case-types',
      },
      {
        children: [
          {
            Component: DimsAdminPage,
            errorElement: <RouterErrorPage />,
            handle: {
              category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
              requiredPermissions: [
                { command_name: CaseDbCommandName.DimCrudCommand, permission_type: CaseDbPermissionType.READ },
                { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
                { command_name: CaseDbCommandName.RefDimCrudCommand, permission_type: CaseDbPermissionType.READ },
              ],
              requiresUserProfile: true,
              subTitle: t`Manage dimensions`,
              title: t`Dimensions`,
            },
            index: true,
            path: '/management/case-types/:caseTypeId/dimensions',
          },
          {
            Component: ColsAdminPage,
            errorElement: <RouterErrorPage />,
            handle: {
              category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
              requiredPermissions: [
                { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
                { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.READ },
                { command_name: CaseDbCommandName.TreeAlgorithmCrudCommand, permission_type: CaseDbPermissionType.READ },
                { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
              ],
              requiresUserProfile: true,
              subTitle: t`Manage columns`,
              title: t`Columns`,
            },
            path: '/management/case-types/:caseTypeId/dimensions/:dimId/columns',
          },
        ],
        errorElement: <RouterErrorPage />,
        handle: {
          requiredPermissions: [],
          requirePermissionForChildRoute: true,
          requiresUserProfile: true,
          title: t`Dimensions`,
        },
        path: '/management/case-types/:caseTypeId/dimensions',
      },
    ],
    errorElement: <RouterErrorPage />,
    handle: {
      requiredPermissions: [],
      requirePermissionForChildRoute: true,
      requiresUserProfile: true,
      title: t`Case types`,
    },
    path: '/management/case-types',
  },
  {
    Component: CaseTypeSetsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [
        { command_name: CaseDbCommandName.CaseTypeSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage case types sets`,
      title: t`Case types sets`,
    },
    path: '/management/case-type-sets',
  },
  {
    Component: CaseTypeSetCategoriesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [
        { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage case types set categories`,
      title: t`Case types set categories`,
    },
    path: '/management/case-type-set-categories',
  },

  {
    children: [
      {
        Component: RegionSetsAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
          requiredPermissions: [
            { command_name: CaseDbCommandName.RegionSetCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage region sets`,
          title: t`Region sets`,
        },
        index: true,
        path: '/management/region-sets',
      },
      {
        Component: RegionsAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
          requiredPermissions: [
            { command_name: CaseDbCommandName.RegionCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.RegionSetCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage regions`,
          title: t`Regions`,
        },
        path: '/management/region-sets/:regionSetId/regions',
      },
      {
        Component: RegionSetShapesAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
          requiredPermissions: [
            { command_name: CaseDbCommandName.RegionSetShapeCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage region set shapes`,
          title: t`Region set shapes`,
        },
        path: '/management/region-sets/:regionSetId/shapes',
      },
    ],
    errorElement: <RouterErrorPage />,
    handle: {
      requiredPermissions: [],
      requirePermissionForChildRoute: true,
      requiresUserProfile: true,
      title: t`Region sets`,
    },
    path: '/management/region-sets',
  },
  {
    Component: RegionRelationsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [
        { command_name: CaseDbCommandName.RegionRelationCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.RegionCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage region relations`,
      title: t`Region Relations`,
    },
    path: '/management/region-relations',
  },

  // SYSTEM
  {
    Component: OutagesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.SYSTEM,
      requiredPermissions: [],
      requiresUserProfile: true,
      subTitle: t`Manage outages`,
      title: t`Outages`,
    },
    path: '/management/outages',
  },

  // HELPERS
  {
    Component: RefColsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.HELPERS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.RefDimCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.ConceptSetCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.RegionSetCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.GeneticDistanceProtocolCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`View all reference columns`,
      title: t`Reference columns (all)`,
    },
    path: '/management/reference-columns',
  },
  {
    children: [
      {
        Component: DimsAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.HELPERS,
          requiredPermissions: [
            { command_name: CaseDbCommandName.DimCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.RefDimCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`View all dimensions`,
          title: t`Dimensions (all)`,
        },
        index: true,
        path: '/management/dimensions',
      },
      {
        Component: ColsAdminPage,
        errorElement: <RouterErrorPage />,
        handle: {
          category: ADMIN_PAGE_CATEGORY.HELPERS,
          requiredPermissions: [
            { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.TreeAlgorithmCrudCommand, permission_type: CaseDbPermissionType.READ },
            { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
          ],
          requiresUserProfile: true,
          subTitle: t`Manage columns`,
          title: t`Columns`,
        },
        path: '/management/dimensions/:dimId/columns',
      },
    ],
    errorElement: <RouterErrorPage />,
    handle: {
      requiredPermissions: [],
      requirePermissionForChildRoute: true,
      requiresUserProfile: true,
      title: t`Dimensions (all)`,
    },
    path: '/management/dimensions',
  },
  {
    Component: ColsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.HELPERS,
      requiredPermissions: [
        { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.TreeAlgorithmCrudCommand, permission_type: CaseDbPermissionType.READ },
        { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`View all columns`,
      title: t`Columns (all)`,
    },
    path: '/management/columns',
  },


  {
    Component: DataCollectionVisualizationPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.HELPERS,
      requiredPermissions: [],
      requiresUserProfile: true,
      subTitle: t`View data collection visualization`,
      title: t`Data collection visualization`,
    },
    path: '/management/data-collection-visualization-page',
  },
];
