import path from 'path'
import { buildFigmaConfig } from '@payloadcms/figma'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { en as adminLanguage } from '@payloadcms/translations/languages/en'
import { fileURLToPath } from 'url'
import { Admins } from './collections/Admins'
import { Media } from './collections/Media'
import { Folders } from './collections/Folders'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Agencies } from './collections/Agencies'
import { Trips } from './collections/Trips'
import { AgentListings } from './collections/AgentListings'
import { BookingRequests } from './collections/BookingRequests'
import { AuthAccounts } from './collections/AuthAccounts'
import { AuthVerificationTokens } from './collections/AuthVerificationTokens'
import { AgencyMemberships } from './collections/AgencyMemberships'
import { Orders } from './collections/Orders'
import { AiProjects } from './collections/AiProjects'
import { Applications } from './collections/Applications'
import { Departures } from './collections/Departures'
import { SavedTrips } from './collections/SavedTrips'
import { Reviews } from './collections/Reviews'
import { SupportTickets } from './collections/SupportTickets'
import { AgentProfiles } from './collections/AgentProfiles'
import { ReservationHolds } from './collections/ReservationHolds'
import { Proposals } from './collections/Proposals'
import { Waitlists } from './collections/Waitlists'
import { OrderChanges } from './collections/OrderChanges'
import { TravelerProfiles } from './collections/TravelerProfiles'
import { TravelerFiles } from './collections/TravelerFiles'
import { Conversations } from './collections/Conversations'
import { Messages } from './collections/Messages'
import { Notifications } from './collections/Notifications'
import { FinanceRules } from './collections/FinanceRules'
import { PaymentAccounts } from './collections/PaymentAccounts'
import { LedgerEntries } from './collections/LedgerEntries'
import { Invoices } from './collections/Invoices'
import { RefundRequests } from './collections/RefundRequests'
import { BrandKits } from './collections/BrandKits'
import { AiUsage } from './collections/AiUsage'
import { LegalPolicies } from './collections/LegalPolicies'
import { Consents } from './collections/Consents'
import { DataRequests } from './collections/DataRequests'
import { AuditLogs } from './collections/AuditLogs'
import { SecurityEvents } from './collections/SecurityEvents'
import { RateLimits } from './collections/RateLimits'
import { PayoutStatements } from './collections/PayoutStatements'
import { Disputes } from './collections/Disputes'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildFigmaConfig({
  admin: {
    user: Admins.slug,
    constrainWidth: true,
    dashboard: {
      widgets: [],
      defaultLayout: [
        { widgetSlug: 'activity', width: 'full' },
        { widgetSlug: 'collections', width: 'full' },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { en: adminLanguage },
  },
  collections: [
    Admins,
    Users,
    Media,
    Folders,
    Tags,
    Agencies,
    Trips,
    AgentListings,
    BookingRequests,
    AuthAccounts,
    AuthVerificationTokens,
    AgencyMemberships,
    Orders,
    AiProjects,
    Applications,
    Departures,
    SavedTrips,
    Reviews,
    SupportTickets,
    AgentProfiles,
    ReservationHolds,
    Proposals,
    Waitlists,
    OrderChanges,
    TravelerProfiles,
    TravelerFiles,
    Conversations,
    Messages,
    Notifications,
    FinanceRules,
    PaymentAccounts,
    LedgerEntries,
    Invoices,
    RefundRequests,
    BrandKits,
    AiUsage,
    LegalPolicies,
    Consents,
    DataRequests,
    AuditLogs,
    SecurityEvents,
    RateLimits,
    PayoutStatements,
    Disputes,
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  localization: {
    locales: [{ code: 'en', label: 'English' }],
    fallback: true,
    defaultLocale: 'en',
  },
  plugins: [mcpPlugin({})],
  figma: {},
})
