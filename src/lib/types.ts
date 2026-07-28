import type { DashboardMetrics, LatestScan } from "tqrco/shared";

export type {
  AnalyticsSummary,
  BrandProfile,
  ContactData,
  ContactFieldsData,
  ContactVCardData,
  DailyScanCount,
  DashboardMetrics,
  EmailData,
  FileData,
  Gs1DigitalLinkAttributes,
  LatestScan,
  PhoneData,
  QR,
  QRData,
  QRMeta,
  QrBorderSettings,
  QrLogoSettings,
  QrRenderConfig,
  QrStyleSettings,
  QrTypeDefaults,
  SMSData,
  StylePreset,
  StylePresetQrType,
  TextData,
  TopLocation,
  URLData,
  WiFiData,
} from "tqrco/shared";

export type CustomDomainStatus =
  | "pending_verification"
  | "pending_configuration"
  | "ready"
  | "failed"
  | "removing";

export interface DomainVerificationInstruction {
  type?: string;
  domain?: string;
  value?: string;
  reason?: string;
}

export interface DomainConfigurationTarget {
  rank: number;
  value: string[] | string;
}

export interface DomainConfiguration {
  configuredBy: "CNAME" | "A" | "http" | "dns-01" | null;
  acceptedChallenges: Array<"dns-01" | "http-01"> | string[];
  recommendedIPv4: DomainConfigurationTarget[];
  recommendedCNAME: DomainConfigurationTarget[];
  misconfigured: boolean;
}

export interface DomainConnectState {
  provider: "cloudflare" | null;
  eligible: boolean;
  enabled: boolean;
  connectUrl: string | null;
  reason: string | null;
}

export interface CustomDomain {
  id: string;
  userId: string;
  hostname: string;
  apexName: string;
  fallbackUrl: string | null;
  status: CustomDomainStatus;
  verification: DomainVerificationInstruction[] | null;
  configuration: DomainConfiguration | null;
  domainConnect?: DomainConnectState;
  verifiedAt: Date | null;
  lastCheckedAt: Date | null;
  isPrimary: boolean;
  createdAt: Date;
}

export interface Scan {
  id: number;
  qrId: string;
  scannedAt: Date;
  ip: string;
  location: string | null;
}

export type ApiAccessScope =
  | "qr:read"
  | "qr:write"
  | "analytics:read"
  | "brand:read"
  | "brand:write"
  | "styles:read"
  | "styles:write";

export type ApiTokenKind = "secret" | "publishable";

export interface ApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  keyHash: string;
  kind: ApiTokenKind;
  scopes: ApiAccessScope[];
  allowedOrigins: string[] | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  kind: ApiTokenKind;
  scopes: ApiAccessScope[];
  allowedOrigins: string[] | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyCreateResult {
  apiKey: string;
  record: ApiKeySummary;
}

export interface PublishableTokenCreateInput {
  name: string;
  scopes: ApiAccessScope[];
  allowedOrigins: string[];
}

export interface AnalyticsSummaryResponse {
  data: {
    metrics: DashboardMetrics;
    dailyScans: Array<{ date: string; count: number }>;
    topLocations: Array<{ location: string; count: number }>;
  };
}

export interface LatestScansResponse {
  data: LatestScan[];
}
