/* eslint-disable @typescript-eslint/naming-convention */
import type { SeqDbApiPermission } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbPermissionType,
} from '@gen-epix/api-seqdb';
import { createAdminRoutes as createCommonAdminRoutes } from '@gen-epix/ui-client-common/routes';
import { ADMIN_PAGE_CATEGORY } from '@gen-epix/ui-client-common/models/admin.models';
import { RouterErrorPage } from '@gen-epix/ui-client-common/pages/RouterErrorPage';
import type { MyNonIndexRouteObject } from '@gen-epix/ui-client-common/models/react-router.models';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { ComponentType } from 'react';
import { t } from 'i18next';

import { AstMeasurementsAdminPage } from '../pages/AstMeasurementsAdminPage';
import { AstPredictionsAdminPage } from '../pages/AstPredictionsAdminPage';
import { AllelesAdminPage } from '../pages/AllelesAdminPage';
import { FilesAdminPage } from '../pages/FilesAdminPage';
import { LocusCodeMapsAdminPage } from '../pages/LocusCodeMapsAdminPage';
import { LociAdminPage } from '../pages/LociAdminPage';
import { LocusSetsAdminPage } from '../pages/LocusSetsAdminPage';
import { PcrMeasurementsAdminPage } from '../pages/PcrMeasurementsAdminPage';
import { ProtocolsAdminPage } from '../pages/ProtocolsAdminPage';
import { ProtocolSetMembersAdminPage } from '../pages/ProtocolSetMembersAdminPage';
import { ProtocolSetsAdminPage } from '../pages/ProtocolSetsAdminPage';
import { ReadSetIdentifiersAdminPage } from '../pages/ReadSetIdentifiersAdminPage';
import { ReadSetsAdminPage } from '../pages/ReadSetsAdminPage';
import { RefAllelesAdminPage } from '../pages/RefAllelesAdminPage';
import { RefSeqsAdminPage } from '../pages/RefSeqsAdminPage';
import { SampleDataCollectionLinksAdminPage } from '../pages/SampleDataCollectionLinksAdminPage';
import { SampleIdentifiersAdminPage } from '../pages/SampleIdentifiersAdminPage';
import { SamplesAdminPage } from '../pages/SamplesAdminPage';
import { SeqCategoriesAdminPage } from '../pages/SeqCategoriesAdminPage';
import { SeqCategorySetsAdminPage } from '../pages/SeqCategorySetsAdminPage';
import { SeqClassificationsAdminPage } from '../pages/SeqClassificationsAdminPage';
import { SeqDistancesAdminPage } from '../pages/SeqDistancesAdminPage';
import { SeqIdentifiersAdminPage } from '../pages/SeqIdentifiersAdminPage';
import { SeqProfileIdentifiersAdminPage } from '../pages/SeqProfileIdentifiersAdminPage';
import { SeqProfilesAdminPage } from '../pages/SeqProfilesAdminPage';
import { SeqTaxonomiesAdminPage } from '../pages/SeqTaxonomiesAdminPage';
import { SeqsAdminPage } from '../pages/SeqsAdminPage';
import { TaxaAdminPage } from '../pages/TaxaAdminPage';
import { TaxonSetMembersAdminPage } from '../pages/TaxonSetMembersAdminPage';
import { TaxonSetsAdminPage } from '../pages/TaxonSetsAdminPage';
import { TreeAlgorithmClassesAdminPage } from '../pages/TreeAlgorithmClassesAdminPage';
import { TreeAlgorithmsAdminPage } from '../pages/TreeAlgorithmsAdminPage';

type RoutePermission = CommonDbApiPermission | SeqDbApiPermission;

const createSeqDbReadPermission = (command_name: SeqDbCommandName): SeqDbApiPermission => ({
  command_name,
  permission_type: SeqDbPermissionType.READ,
});

const createCommonDbReadPermission = (command_name: CommonDbCommandName): CommonDbApiPermission => ({
  command_name,
  permission_type: CommonDbPermissionType.READ,
});

type SeqDbAdminRouteConfig = {
  commandName: SeqDbCommandName;
  Component: ComponentType;
  path: string;
  requiredPermissions?: RoutePermission[];
  subTitle: string;
  title: string;
};

const createSeqDbAdminRoute = ({
  commandName,
  Component,
  path,
  requiredPermissions = [],
  subTitle,
  title,
}: SeqDbAdminRouteConfig): MyNonIndexRouteObject<RoutePermission> => ({
  Component,
  errorElement: <RouterErrorPage />,
  handle: {
    category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    requiredPermissions: [
      { command_name: commandName, permission_type: SeqDbPermissionType.READ },
      ...requiredPermissions,
    ],
    requiresUserProfile: true,
    subTitle,
    title,
  },
  path,
});

export const createAdminRoutes = (): MyNonIndexRouteObject<RoutePermission>[] => [
  ...createCommonAdminRoutes<SeqDbApiPermission>(),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.AstMeasurementCrudCommand,
    Component: AstMeasurementsAdminPage,
    path: '/management/ast-measurements',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SampleCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.ProtocolCrudCommand),
    ],
    subTitle: t`Manage AST measurements`,
    title: t`AST measurements`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.AstPredictionCrudCommand,
    Component: AstPredictionsAdminPage,
    path: '/management/ast-predictions',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SampleCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.ProtocolCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.SeqCrudCommand),
    ],
    subTitle: t`Manage AST predictions`,
    title: t`AST predictions`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.FileCrudCommand,
    Component: FilesAdminPage,
    path: '/management/files',
    subTitle: t`Manage files`,
    title: t`Files`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.LocusCodeMapCrudCommand,
    Component: LocusCodeMapsAdminPage,
    path: '/management/locus-code-maps',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.LocusCrudCommand),
    ],
    subTitle: t`Manage locus code maps`,
    title: t`Locus code maps`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.LocusCrudCommand,
    Component: LociAdminPage,
    path: '/management/loci',
    subTitle: t`Manage loci`,
    title: t`Loci`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.LocusSetCrudCommand,
    Component: LocusSetsAdminPage,
    path: '/management/locus-sets',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.LocusCrudCommand),
    ],
    subTitle: t`Manage locus sets`,
    title: t`Locus sets`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.PcrMeasurementCrudCommand,
    Component: PcrMeasurementsAdminPage,
    path: '/management/pcr-measurements',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SampleCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.ProtocolCrudCommand),
    ],
    subTitle: t`Manage PCR measurements`,
    title: t`PCR measurements`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.ProtocolCrudCommand,
    Component: ProtocolsAdminPage,
    path: '/management/protocols',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.RefSeqCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.LocusSetCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.SeqCategorySetCrudCommand),
    ],
    subTitle: t`Manage protocols`,
    title: t`Protocols`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.ProtocolSetMemberCrudCommand,
    Component: ProtocolSetMembersAdminPage,
    path: '/management/protocol-set-members',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.ProtocolCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.ProtocolSetCrudCommand),
    ],
    subTitle: t`Manage protocol set members`,
    title: t`Protocol set members`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.ProtocolSetCrudCommand,
    Component: ProtocolSetsAdminPage,
    path: '/management/protocol-sets',
    subTitle: t`Manage protocol sets`,
    title: t`Protocol sets`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.ReadSetIdentifierCrudCommand,
    Component: ReadSetIdentifiersAdminPage,
    path: '/management/read-set-identifiers',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.ReadSetCrudCommand),
      createCommonDbReadPermission(CommonDbCommandName.IdentifierIssuerCrudCommand),
    ],
    subTitle: t`Manage read set identifiers`,
    title: t`Read set identifiers`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.ReadSetCrudCommand,
    Component: ReadSetsAdminPage,
    path: '/management/read-sets',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SampleCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.ProtocolCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.FileCrudCommand),
    ],
    subTitle: t`Manage read sets`,
    title: t`Read sets`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.RefAlleleCrudCommand,
    Component: RefAllelesAdminPage,
    path: '/management/ref-alleles',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.LocusCrudCommand),
    ],
    subTitle: t`Manage reference alleles`,
    title: t`Reference alleles`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.RefSeqCrudCommand,
    Component: RefSeqsAdminPage,
    path: '/management/ref-seqs',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.TaxonCrudCommand),
    ],
    subTitle: t`Manage reference sequences`,
    title: t`Reference sequences`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SampleDataCollectionLinkCrudCommand,
    Component: SampleDataCollectionLinksAdminPage,
    path: '/management/sample-data-collection-links',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SampleCrudCommand),
      createCommonDbReadPermission(CommonDbCommandName.DataCollectionCrudCommand),
    ],
    subTitle: t`Manage sample data collection links`,
    title: t`Sample data collection links`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SampleIdentifierCrudCommand,
    Component: SampleIdentifiersAdminPage,
    path: '/management/sample-identifiers',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SampleCrudCommand),
      createCommonDbReadPermission(CommonDbCommandName.IdentifierIssuerCrudCommand),
    ],
    subTitle: t`Manage sample identifiers`,
    title: t`Sample identifiers`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SampleCrudCommand,
    Component: SamplesAdminPage,
    path: '/management/samples',
    requiredPermissions: [
      createCommonDbReadPermission(CommonDbCommandName.DataCollectionCrudCommand),
    ],
    subTitle: t`Manage samples`,
    title: t`Samples`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SeqCategoryCrudCommand,
    Component: SeqCategoriesAdminPage,
    path: '/management/seq-categories',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SeqCategorySetCrudCommand),
    ],
    subTitle: t`Manage sequence categories`,
    title: t`Sequence categories`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SeqCategorySetCrudCommand,
    Component: SeqCategorySetsAdminPage,
    path: '/management/seq-category-sets',
    subTitle: t`Manage sequence category sets`,
    title: t`Sequence category sets`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SeqClassificationCrudCommand,
    Component: SeqClassificationsAdminPage,
    path: '/management/seq-classifications',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SampleCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.ProtocolCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.SeqCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.SeqCategoryCrudCommand),
    ],
    subTitle: t`Manage sequence classifications`,
    title: t`Sequence classifications`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SeqDistanceCrudCommand,
    Component: SeqDistancesAdminPage,
    path: '/management/seq-distances',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SampleCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.ProtocolCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.SeqProfileCrudCommand),
    ],
    subTitle: t`Manage sequence distances`,
    title: t`Sequence distances`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SeqIdentifierCrudCommand,
    Component: SeqIdentifiersAdminPage,
    path: '/management/seq-identifiers',
    requiredPermissions: [
      createCommonDbReadPermission(CommonDbCommandName.IdentifierIssuerCrudCommand),
    ],
    subTitle: t`Manage sequence identifiers`,
    title: t`Sequence identifiers`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SeqProfileCrudCommand,
    Component: SeqProfilesAdminPage,
    path: '/management/seq-profiles',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SampleCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.ProtocolCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.SeqCrudCommand),
    ],
    subTitle: t`Manage sequence profiles`,
    title: t`Sequence profiles`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SeqProfileIdentifierCrudCommand,
    Component: SeqProfileIdentifiersAdminPage,
    path: '/management/seq-profile-identifiers',
    requiredPermissions: [
      createCommonDbReadPermission(CommonDbCommandName.IdentifierIssuerCrudCommand),
    ],
    subTitle: t`Manage sequence profile identifiers`,
    title: t`Sequence profile identifiers`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SeqTaxonomyCrudCommand,
    Component: SeqTaxonomiesAdminPage,
    path: '/management/seq-taxonomies',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SampleCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.ProtocolCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.SeqCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.TaxonCrudCommand),
    ],
    subTitle: t`Manage sequence taxonomies`,
    title: t`Sequence taxonomies`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.SeqCrudCommand,
    Component: SeqsAdminPage,
    path: '/management/seqs',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.SampleCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.FileCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.ReadSetCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.ProtocolCrudCommand),
    ],
    subTitle: t`Manage sequences`,
    title: t`Sequences`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.TaxonCrudCommand,
    Component: TaxaAdminPage,
    path: '/management/taxa',
    subTitle: t`Manage taxa`,
    title: t`Taxa`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.TaxonSetMemberCrudCommand,
    Component: TaxonSetMembersAdminPage,
    path: '/management/taxon-set-members',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.TaxonCrudCommand),
      createSeqDbReadPermission(SeqDbCommandName.TaxonSetCrudCommand),
    ],
    subTitle: t`Manage taxon set members`,
    title: t`Taxon set members`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.TaxonSetCrudCommand,
    Component: TaxonSetsAdminPage,
    path: '/management/taxon-sets',
    subTitle: t`Manage taxon sets`,
    title: t`Taxon sets`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.TreeAlgorithmClassCrudCommand,
    Component: TreeAlgorithmClassesAdminPage,
    path: '/management/tree-algorithm-classes',
    subTitle: t`Manage tree algorithm classes`,
    title: t`Tree algorithm classes`,
  }),
  createSeqDbAdminRoute({
    commandName: SeqDbCommandName.TreeAlgorithmCrudCommand,
    Component: TreeAlgorithmsAdminPage,
    path: '/management/tree-algorithms',
    requiredPermissions: [
      createSeqDbReadPermission(SeqDbCommandName.TreeAlgorithmClassCrudCommand),
    ],
    subTitle: t`Manage tree algorithms`,
    title: t`Tree algorithms`,
  }),
  {
    Component: AllelesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [
        { command_name: SeqDbCommandName.AlleleCrudCommand, permission_type: SeqDbPermissionType.READ },
        { command_name: SeqDbCommandName.LocusCrudCommand, permission_type: SeqDbPermissionType.READ },
      ],
      requiresUserProfile: true,
      subTitle: t`Manage alleles`,
      title: t`Alleles`,
    },
    path: '/management/alleles',
  },
];
