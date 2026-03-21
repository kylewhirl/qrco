import type { ContactData, QRData } from "./shared/contracts";

function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function normalizeVCardText(vcard: string): string {
  return vcard
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line.length > 0 || (index > 0 && index < lines.length - 1))
    .join("\r\n")
    .trim();
}

export function serializeContactData(data: ContactData): string {
  if (data.source === "vcard") {
    return normalizeVCardText(data.vcard);
  }

  const firstName = data.firstName?.trim() ?? "";
  const lastName = data.lastName?.trim() ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || data.organization?.trim() || "Contact";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
    `FN:${escapeVCardValue(fullName)}`,
    data.organization ? `ORG:${escapeVCardValue(data.organization)}` : null,
    data.title ? `TITLE:${escapeVCardValue(data.title)}` : null,
    data.phone ? `TEL;TYPE=CELL:${escapeVCardValue(data.phone)}` : null,
    data.email ? `EMAIL:${escapeVCardValue(data.email)}` : null,
    data.website ? `URL:${escapeVCardValue(data.website)}` : null,
    data.address ? `ADR:;;${escapeVCardValue(data.address)};;;;` : null,
    data.note ? `NOTE:${escapeVCardValue(data.note)}` : null,
    "END:VCARD",
  ];

  return lines.filter((line): line is string => Boolean(line)).join("\r\n");
}

export function serializeQrData(data: QRData): string {
  switch (data.type) {
    case "url":
      return data.url;
    case "text":
      return data.text;
    case "email":
      return `mailto:${data.to}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
    case "phone":
      return `tel:${data.number}`;
    case "sms":
      return `sms:${data.number}?body=${encodeURIComponent(data.message)}`;
    case "contact":
      return serializeContactData(data);
    case "wifi":
      return `WIFI:S:${data.ssid};T:${data.authenticationType};P:${data.password ?? ""};${data.hidden ? "H:true;" : ""};`;
    case "file":
      return data.key;
  }
}
