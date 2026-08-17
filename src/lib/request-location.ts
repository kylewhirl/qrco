import "server-only";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function decodeHeader(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value).trim() || null;
  } catch {
    return value.trim() || null;
  }
}

export function getLocationFromHeaders(headers: Headers): string | null {
  const city = decodeHeader(headers.get("x-vercel-ip-city"));
  const countryCode = decodeHeader(headers.get("x-vercel-ip-country"));
  const country = countryCode
    ? regionNames.of(countryCode.toUpperCase()) ?? countryCode.toUpperCase()
    : null;

  if (city && country) {
    return `${city}, ${country}`;
  }

  return city ?? country;
}
