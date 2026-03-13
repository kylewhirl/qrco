// Database schema types
export interface QR {
  id: string
  code: string
  data: QRData
  customDomainId: string | null
  customHostname?: string | null
  publicUrl?: string
  createdAt: Date
  totalScans: number
  lastScanned: Date | null
}

export type CustomDomainStatus =
  | "pending_verification"
  | "pending_configuration"
  | "ready"
  | "failed"
  | "removing"

export interface DomainVerificationInstruction {
  type?: string
  domain?: string
  value?: string
  reason?: string
}

export interface DomainConfigurationTarget {
  rank: number
  value: string[] | string
}

export interface DomainConfiguration {
  configuredBy: "CNAME" | "A" | "http" | "dns-01" | null
  acceptedChallenges: Array<"dns-01" | "http-01"> | string[]
  recommendedIPv4: DomainConfigurationTarget[]
  recommendedCNAME: DomainConfigurationTarget[]
  misconfigured: boolean
}

export interface DomainConnectState {
  provider: "cloudflare" | null
  eligible: boolean
  enabled: boolean
  connectUrl: string | null
  reason: string | null
}

export interface CustomDomain {
  id: string
  userId: string
  hostname: string
  apexName: string
  status: CustomDomainStatus
  verification: DomainVerificationInstruction[] | null
  configuration: DomainConfiguration | null
  domainConnect?: DomainConnectState
  verifiedAt: Date | null
  lastCheckedAt: Date | null
  isPrimary: boolean
  createdAt: Date
}

export interface Scan {
  id: number
  qrId: string
  scannedAt: Date
  ip: string
  location: string | null
}

// Dashboard metrics types
export interface DashboardMetrics {
  totalScansLast7Days: number
  activeQRCodesCount: number
  topLocation: {
    location: string
    count: number
  } | null
  mostActiveQR: {
    code: string
    data: QRData
    scans: number
  } | null
}

export interface DailyScanCount {
  date: string
  count: number
}

export interface TopLocation {
  location: string
  count: number
}

export interface LatestScan {
  id: number
  code: string
  scannedAt: Date
  location: string | null
  data: QRData
}

export interface ApiKeyRecord {
  id: string
  userId: string
  name: string
  prefix: string
  keyHash: string
  lastUsedAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}

export interface ApiKeySummary {
  id: string
  name: string
  prefix: string
  lastUsedAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}

export interface QrStyleSettings {
  dotStyle?: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded"
  dotColorType?: "solid" | "gradient"
  dotColors?: string[]
  dotGradientType?: "linear" | "radial"
  dotRotation?: number
  eyeStyle?: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot"
  eyeColorType?: "solid" | "gradient"
  eyeColors?: string[]
  eyeGradientType?: "linear" | "radial"
  eyeRotation?: number
  innerEyeStyle?: "none" | "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot"
  innerEyeColorType?: "solid" | "gradient"
  innerEyeColors?: string[]
  innerEyeGradientType?: "linear" | "radial"
  innerEyeRotation?: number
  bgColorType?: "solid" | "gradient"
  bgColors?: string[]
  bgGradientType?: "linear" | "radial"
  bgRotation?: number
}

export interface QrLogoSettings {
  src: string
  size: number
  margin?: number
  hideBackgroundDots?: boolean
}

export interface QrBorderSettings {
  shape: "square" | "circle"
  colorType: "solid" | "gradient"
  colors: string[]
  gradientType: "linear" | "radial"
  rotation: number
  preset: string
  text: string
  textStyle?: string
}

export interface QrRenderConfig {
  errorLevel: "L" | "M" | "Q" | "H"
  width?: number
  height?: number
  margin?: number
  styleSettings?: QrStyleSettings | null
  logoSettings?: QrLogoSettings | null
  borderSettings?: QrBorderSettings | null
}

export interface BrandProfile {
  id: string
  userId: string
  brandName: string
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  backgroundColor: string
  defaultConfig: QrRenderConfig
  createdAt: Date
  updatedAt: Date
}

export interface StylePreset {
  id: string
  userId: string
  name: string
  description: string | null
  isDefault: boolean
  config: QrRenderConfig
  createdAt: Date
  updatedAt: Date
}


/** Discriminated union of all QR payload types */
export type QRData =
  | (URLData & QRMeta)
  | (FileData & QRMeta)
  | (TextData & QRMeta)
  | (EmailData & QRMeta)
  | (PhoneData & QRMeta)
  | (SMSData & QRMeta)
  | (WiFiData & QRMeta);

/** Common QR metadata fields */
export interface QRMeta {
  name?: string | null;
  description?: string | null;
}

export interface URLData {
  type: "url";
  url: string;
}

export interface FileData {
  type: "file";
  key: string; // R2 object key
}

export interface TextData {
  type: "text";
  text: string;
}

export interface EmailData {
  type: "email";
  to: string;
  subject: string;
  body: string;
}

export interface PhoneData {
  type: "phone";
  number: string;
}

export interface SMSData {
  type: "sms";
  number: string;
  message: string;
}

export interface WiFiData {
  type: "wifi";
  ssid: string;
  authenticationType: "WEP" | "WPA" | "nopass" | string;
  password?: string;
  hidden?: boolean;
}
