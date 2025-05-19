// Database schema types
export interface QR {
  id: string
  code: string
  data: QRData
  createdAt: Date
  totalScans: number
  lastScanned: Date | null
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
