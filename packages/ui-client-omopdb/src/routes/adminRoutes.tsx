/* eslint-disable @typescript-eslint/naming-convention */
import type { OmopDbApiPermission } from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import { createAdminRoutes as createCommonAdminRoutes } from '@gen-epix/ui-client-common/routes';
import { ADMIN_PAGE_CATEGORY } from '@gen-epix/ui-client-common/models/admin.models';
import type { MyNonIndexRouteObject } from '@gen-epix/ui-client-common/models/react-router.models';
import { RouterErrorPage } from '@gen-epix/ui-client-common/pages/RouterErrorPage';
import { t } from 'i18next';

import { CareSitesAdminPage } from '../pages/CareSitesAdminPage';
import { CdmSourcesAdminPage } from '../pages/CdmSourcesAdminPage';
import { CohortsAdminPage } from '../pages/CohortsAdminPage';
import { CohortDefinitionsAdminPage } from '../pages/CohortDefinitionsAdminPage';
import { ConceptAncestorsAdminPage } from '../pages/ConceptAncestorsAdminPage';
import { ConceptClassesAdminPage } from '../pages/ConceptClassesAdminPage';
import { ConceptsAdminPage } from '../pages/ConceptsAdminPage';
import { ConceptRelationshipsAdminPage } from '../pages/ConceptRelationshipsAdminPage';
import { ConceptSynonymsAdminPage } from '../pages/ConceptSynonymsAdminPage';
import { ConditionErasAdminPage } from '../pages/ConditionErasAdminPage';
import { ConditionOccurrencesAdminPage } from '../pages/ConditionOccurrencesAdminPage';
import { ConditionOccurrenceIdentifiersAdminPage } from '../pages/ConditionOccurrenceIdentifiersAdminPage';
import { CostsAdminPage } from '../pages/CostsAdminPage';
import { DeathsAdminPage } from '../pages/DeathsAdminPage';
import { DeathIdentifiersAdminPage } from '../pages/DeathIdentifiersAdminPage';
import { DeviceExposuresAdminPage } from '../pages/DeviceExposuresAdminPage';
import { DeviceExposureIdentifiersAdminPage } from '../pages/DeviceExposureIdentifiersAdminPage';
import { DomainsAdminPage } from '../pages/DomainsAdminPage';
import { DoseErasAdminPage } from '../pages/DoseErasAdminPage';
import { DrugErasAdminPage } from '../pages/DrugErasAdminPage';
import { DrugExposuresAdminPage } from '../pages/DrugExposuresAdminPage';
import { DrugExposureIdentifiersAdminPage } from '../pages/DrugExposureIdentifiersAdminPage';
import { DrugStrengthsAdminPage } from '../pages/DrugStrengthsAdminPage';
import { EpisodesAdminPage } from '../pages/EpisodesAdminPage';
import { EpisodeEventsAdminPage } from '../pages/EpisodeEventsAdminPage';
import { FactRelationshipsAdminPage } from '../pages/FactRelationshipsAdminPage';
import { LocationsAdminPage } from '../pages/LocationsAdminPage';
import { MeasurementsAdminPage } from '../pages/MeasurementsAdminPage';
import { MeasurementIdentifiersAdminPage } from '../pages/MeasurementIdentifiersAdminPage';
import { MeasurementRelationsAdminPage } from '../pages/MeasurementRelationsAdminPage';
import { MeasurementRelationIdentifiersAdminPage } from '../pages/MeasurementRelationIdentifiersAdminPage';
import { MetadatasAdminPage } from '../pages/MetadatasAdminPage';
import { NotesAdminPage } from '../pages/NotesAdminPage';
import { NoteIdentifiersAdminPage } from '../pages/NoteIdentifiersAdminPage';
import { NoteNlpsAdminPage } from '../pages/NoteNlpsAdminPage';
import { NoteNlpIdentifiersAdminPage } from '../pages/NoteNlpIdentifiersAdminPage';
import { ObservationsAdminPage } from '../pages/ObservationsAdminPage';
import { ObservationIdentifiersAdminPage } from '../pages/ObservationIdentifiersAdminPage';
import { ObservationPeriodsAdminPage } from '../pages/ObservationPeriodsAdminPage';
import { ObservationPeriodIdentifiersAdminPage } from '../pages/ObservationPeriodIdentifiersAdminPage';
import { PayerPlanPeriodsAdminPage } from '../pages/PayerPlanPeriodsAdminPage';
import { PersonsAdminPage } from '../pages/PersonsAdminPage';
import { PersonIdentifiersAdminPage } from '../pages/PersonIdentifiersAdminPage';
import { ProcedureOccurrencesAdminPage } from '../pages/ProcedureOccurrencesAdminPage';
import { ProcedureOccurrenceIdentifiersAdminPage } from '../pages/ProcedureOccurrenceIdentifiersAdminPage';
import { ProvidersAdminPage } from '../pages/ProvidersAdminPage';
import { RelationshipsAdminPage } from '../pages/RelationshipsAdminPage';
import { SourceToConceptMapsAdminPage } from '../pages/SourceToConceptMapsAdminPage';
import { SpecimensAdminPage } from '../pages/SpecimensAdminPage';
import { SpecimenIdentifiersAdminPage } from '../pages/SpecimenIdentifiersAdminPage';
import { VisitDetailsAdminPage } from '../pages/VisitDetailsAdminPage';
import { VisitDetailIdentifiersAdminPage } from '../pages/VisitDetailIdentifiersAdminPage';
import { VisitOccurrencesAdminPage } from '../pages/VisitOccurrencesAdminPage';
import { VisitOccurrenceIdentifiersAdminPage } from '../pages/VisitOccurrenceIdentifiersAdminPage';
import { VocabulariesAdminPage } from '../pages/VocabulariesAdminPage';

type RoutePermission = CommonDbApiPermission | OmopDbApiPermission;

export const createAdminRoutes = (): MyNonIndexRouteObject<RoutePermission>[] => [
  ...createCommonAdminRoutes<OmopDbApiPermission>(),
  {
    Component: CareSitesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.SiteCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.CareSiteCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.LocationCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage care sites`,
      title: t`Care Sites`,
    },
    path: '/management/care-sites',
  },
  {
    Component: CdmSourcesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.CdmSourceCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage cdm sources`,
      title: t`CDM Sources`,
    },
    path: '/management/cdm-sources',
  },
  {
    Component: CohortsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.CohortCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.CohortDefinitionCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage cohorts`,
      title: t`Cohorts`,
    },
    path: '/management/cohorts',
  },
  {
    Component: CohortDefinitionsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.CohortDefinitionCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage cohort definitions`,
      title: t`Cohort Definitions`,
    },
    path: '/management/cohort-definitions',
  },
  {
    Component: ConceptAncestorsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptAncestorCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage concept ancestors`,
      title: t`Concept Ancestors`,
    },
    path: '/management/concept-ancestors',
  },
  {
    Component: ConceptClassesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptClassCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage concept classes`,
      title: t`Concept classes`,
    },
    path: '/management/concept-classes',
  },
  {
    Component: ConceptsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptClassCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DomainCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VocabularyCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage concepts`,
      title: t`Concepts`,
    },
    path: '/management/concepts',
  },
  {
    Component: ConceptRelationshipsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptRelationshipCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.RelationshipCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage concept relationships`,
      title: t`Concept Relationships`,
    },
    path: '/management/concept-relationships',
  },
  {
    Component: ConceptSynonymsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptSynonymCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage concept synonyms`,
      title: t`Concept Synonyms`,
    },
    path: '/management/concept-synonyms',
  },
  {
    Component: ConditionErasAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConditionEraCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage condition eras`,
      title: t`Condition Eras`,
    },
    path: '/management/condition-eras',
  },
  {
    Component: ConditionOccurrencesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConditionOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitDetailCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage condition occurrences`,
      title: t`Condition Occurrences`,
    },
    path: '/management/condition-occurrences',
  },
  {
    Component: ConditionOccurrenceIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConditionOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConditionOccurrenceIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage condition occurrence identifiers`,
      title: t`Condition Occurrence Identifiers`,
    },
    path: '/management/condition-occurrence-identifiers',
  },
  {
    Component: CostsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.CostCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DomainCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PayerPlanPeriodCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage costs`,
      title: t`Costs`,
    },
    path: '/management/costs',
  },
  {
    Component: DeathsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DeathCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage deaths`,
      title: t`Deaths`,
    },
    path: '/management/deaths',
  },
  {
    Component: DeathIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.DeathCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DeathIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage death identifiers`,
      title: t`Death Identifiers`,
    },
    path: '/management/death-identifiers',
  },
  {
    Component: DeviceExposuresAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DeviceExposureCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitDetailCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage device exposures`,
      title: t`Device Exposures`,
    },
    path: '/management/device-exposures',
  },
  {
    Component: DeviceExposureIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.DeviceExposureCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DeviceExposureIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage device exposure identifiers`,
      title: t`Device Exposure Identifiers`,
    },
    path: '/management/device-exposure-identifiers',
  },
  {
    Component: DomainsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DomainCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage domains`,
      title: t`Domains`,
    },
    path: '/management/domains',
  },
  {
    Component: DoseErasAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DoseEraCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage dose eras`,
      title: t`Dose Eras`,
    },
    path: '/management/dose-eras',
  },
  {
    Component: DrugErasAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DrugEraCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage drug eras`,
      title: t`Drug Eras`,
    },
    path: '/management/drug-eras',
  },
  {
    Component: DrugExposuresAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DrugExposureCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitDetailCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage drug exposures`,
      title: t`Drug Exposures`,
    },
    path: '/management/drug-exposures',
  },
  {
    Component: DrugExposureIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.DrugExposureCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DrugExposureIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage drug exposure identifiers`,
      title: t`Drug Exposure Identifiers`,
    },
    path: '/management/drug-exposure-identifiers',
  },
  {
    Component: DrugStrengthsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.DrugStrengthCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage drug strengths`,
      title: t`Drug Strengths`,
    },
    path: '/management/drug-strengths',
  },
  {
    Component: EpisodesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.EpisodeCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage episodes`,
      title: t`Episodes`,
    },
    path: '/management/episodes',
  },
  {
    Component: EpisodeEventsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.EpisodeCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.EpisodeEventCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage episode events`,
      title: t`Episode Events`,
    },
    path: '/management/episode-events',
  },
  {
    Component: FactRelationshipsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.FactRelationshipCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage fact relationships`,
      title: t`Fact Relationships`,
    },
    path: '/management/fact-relationships',
  },
  {
    Component: LocationsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.LocationCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage locations`,
      title: t`Locations`,
    },
    path: '/management/locations',
  },
  {
    Component: MeasurementsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.MeasurementCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.SpecimenCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitDetailCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage measurements`,
      title: t`Measurements`,
    },
    path: '/management/measurements',
  },
  {
    Component: MeasurementIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.MeasurementCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.MeasurementIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage measurement identifiers`,
      title: t`Measurement Identifiers`,
    },
    path: '/management/measurement-identifiers',
  },
  {
    Component: MeasurementRelationsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.MeasurementCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.MeasurementRelationCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage measurement relations`,
      title: t`Measurement Relations`,
    },
    path: '/management/measurement-relations',
  },
  {
    Component: MeasurementRelationIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.MeasurementRelationCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.MeasurementRelationIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage measurement relation identifiers`,
      title: t`Measurement Relation Identifiers`,
    },
    path: '/management/measurement-relation-identifiers',
  },
  {
    Component: MetadatasAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.MetadataCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage metadatas`,
      title: t`Metadatas`,
    },
    path: '/management/metadatas',
  },
  {
    Component: NotesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.NoteCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitDetailCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage notes`,
      title: t`Notes`,
    },
    path: '/management/notes',
  },
  {
    Component: NoteIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.NoteCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.NoteIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage note identifiers`,
      title: t`Note Identifiers`,
    },
    path: '/management/note-identifiers',
  },
  {
    Component: NoteNlpsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.NoteCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.NoteNlpCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage note nlps`,
      title: t`Note NLPs`,
    },
    path: '/management/note-nlps',
  },
  {
    Component: NoteNlpIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.NoteNlpCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.NoteNlpIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage note nlp identifiers`,
      title: t`Note NLP Identifiers`,
    },
    path: '/management/note-nlp-identifiers',
  },
  {
    Component: ObservationsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ObservationCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitDetailCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage observations`,
      title: t`Observations`,
    },
    path: '/management/observations',
  },
  {
    Component: ObservationIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ObservationCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ObservationIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage observation identifiers`,
      title: t`Observation Identifiers`,
    },
    path: '/management/observation-identifiers',
  },
  {
    Component: ObservationPeriodsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ObservationPeriodCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage observation periods`,
      title: t`Observation Periods`,
    },
    path: '/management/observation-periods',
  },
  {
    Component: ObservationPeriodIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ObservationPeriodCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ObservationPeriodIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage observation period identifiers`,
      title: t`Observation Period Identifiers`,
    },
    path: '/management/observation-period-identifiers',
  },
  {
    Component: PayerPlanPeriodsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PayerPlanPeriodCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage payer plan periods`,
      title: t`Payer Plan Periods`,
    },
    path: '/management/payer-plan-periods',
  },
  {
    Component: PersonsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.CareSiteCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.LocationCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage persons`,
      title: t`Persons`,
    },
    path: '/management/persons',
  },
  {
    Component: PersonIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage person identifiers`,
      title: t`Person Identifiers`,
    },
    path: '/management/person-identifiers',
  },
  {
    Component: ProcedureOccurrencesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProcedureOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitDetailCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage procedure occurrences`,
      title: t`Procedure Occurrences`,
    },
    path: '/management/procedure-occurrences',
  },
  {
    Component: ProcedureOccurrenceIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ProcedureOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProcedureOccurrenceIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage procedure occurrence identifiers`,
      title: t`Procedure Occurrence Identifiers`,
    },
    path: '/management/procedure-occurrence-identifiers',
  },
  {
    Component: ProvidersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.CareSiteCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage providers`,
      title: t`Providers`,
    },
    path: '/management/providers',
  },
  {
    Component: RelationshipsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.RelationshipCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage relationships`,
      title: t`Relationships`,
    },
    path: '/management/relationships',
  },
  {
    Component: SourceToConceptMapsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.SourceToConceptMapCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VocabularyCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage source to concept maps`,
      title: t`Source To Concept Maps`,
    },
    path: '/management/source-to-concept-maps',
  },
  {
    Component: SpecimensAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.SpecimenCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage specimens`,
      title: t`Specimens`,
    },
    path: '/management/specimens',
  },
  {
    Component: SpecimenIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.SpecimenCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.SpecimenIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage specimen identifiers`,
      title: t`Specimen Identifiers`,
    },
    path: '/management/specimen-identifiers',
  },
  {
    Component: VisitDetailsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.CareSiteCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitDetailCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage visit details`,
      title: t`Visit Details`,
    },
    path: '/management/visit-details',
  },
  {
    Component: VisitDetailIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitDetailCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitDetailIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage visit detail identifiers`,
      title: t`Visit Detail Identifiers`,
    },
    path: '/management/visit-detail-identifiers',
  },
  {
    Component: VisitOccurrencesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.CareSiteCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.ProviderCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage visit occurrences`,
      title: t`Visit Occurrences`,
    },
    path: '/management/visit-occurrences',
  },
  {
    Component: VisitOccurrenceIdentifiersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: CommonDbCommandName.IdentifierIssuerCrudCommand, permission_type: CommonDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitOccurrenceCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VisitOccurrenceIdentifierCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage visit occurrence identifiers`,
      title: t`Visit Occurrence Identifiers`,
    },
    path: '/management/visit-occurrence-identifiers',
  },
  {
    Component: VocabulariesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      requiredPermissions: [{ command_name: OmopDbCommandName.ConceptCrudCommand, permission_type: OmopDbPermissionType.READ }, { command_name: OmopDbCommandName.VocabularyCrudCommand, permission_type: OmopDbPermissionType.READ }],
      requiresUserProfile: true,
      subTitle: t`Manage vocabularies`,
      title: t`Vocabularies`,
    },
    path: '/management/vocabularies',
  },
];
