import { TqrcoError } from "./errors";
import type {
  AnalyticsSummary,
  BrandProfile,
  CustomDomainSummary,
  LatestScan,
  QR,
  QRData,
  StylePreset,
} from "./shared/contracts";

export interface CreateTqrcoClientOptions {
  token: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export interface RenderUrlOptions {
  format?: "svg" | "png";
  presetId?: string;
  width?: number;
  height?: number;
}

export interface ListScansOptions {
  qrId?: string;
  limit?: number;
}

export interface TqrcoClient {
  readonly token: string;
  readonly baseUrl: string;
  qr: {
    list(): Promise<QR[]>;
    get(id: string): Promise<QR>;
    create(input: QRData | { data: QRData; customDomainId?: string | null; customSlug?: string | null }): Promise<QR>;
    update(id: string, input: QRData | { data: QRData; customDomainId?: string | null; customSlug?: string | null }): Promise<QR>;
    delete(id: string): Promise<{ success: true }>;
    uploadImage(id: string, file: File): Promise<QR>;
    renderUrl(id: string, options?: RenderUrlOptions): string;
  };
  analytics: {
    getSummary(): Promise<AnalyticsSummary>;
    listScans(options?: ListScansOptions): Promise<LatestScan[]>;
  };
  domains: {
    list(): Promise<CustomDomainSummary[]>;
  };
  brand: {
    get(): Promise<BrandProfile>;
    update(input: Omit<BrandProfile, "id" | "userId" | "createdAt" | "updatedAt">): Promise<BrandProfile>;
  };
  styles: {
    list(): Promise<StylePreset[]>;
    get(id: string): Promise<StylePreset>;
    create(input: Omit<StylePreset, "id" | "userId" | "createdAt" | "updatedAt">): Promise<StylePreset>;
    update(id: string, input: Partial<Omit<StylePreset, "id" | "userId" | "createdAt" | "updatedAt">>): Promise<StylePreset>;
    delete(id: string): Promise<{ success: true }>;
  };
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function withSearch(path: string, search: URLSearchParams) {
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function createTqrcoClient(options: CreateTqrcoClientOptions): TqrcoClient {
  const baseUrl = trimTrailingSlash(options.baseUrl ?? "https://tqrco.de");
  const fetcher = options.fetch ?? globalThis.fetch;

  if (!fetcher) {
    throw new Error("A fetch implementation is required to create a tqrco client.");
  }

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const endpoint = `${baseUrl}${path}`;
    const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
    const response = await fetcher(endpoint, {
      ...init,
      headers: {
        Authorization: `Bearer ${options.token}`,
        ...(init?.body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = await response.text().catch(() => null);
      }

      const message =
        typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
          ? body.error
          : `Request failed with status ${response.status}`;

      throw new TqrcoError(message, {
        status: response.status,
        endpoint,
        body,
      });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  return {
    token: options.token,
    baseUrl,
    qr: {
      async list() {
        const response = await request<{ data: QR[] }>("/api/v1/qr-codes");
        return response.data;
      },
      async get(id) {
        const response = await request<{ data: QR }>(`/api/v1/qr-codes/${id}`);
        return response.data;
      },
      async create(input) {
        const response = await request<{ data: QR }>("/api/v1/qr-codes", {
          method: "POST",
          body: JSON.stringify(input),
        });
        return response.data;
      },
      async update(id, input) {
        const response = await request<{ data: QR }>(`/api/v1/qr-codes/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
        return response.data;
      },
      async delete(id) {
        return request<{ success: true }>(`/api/v1/qr-codes/${id}`, {
          method: "DELETE",
        });
      },
      async uploadImage(id, file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await request<{ data: QR }>(`/api/v1/qr-codes/${id}/image`, {
          method: "POST",
          body: formData,
        });
        return response.data;
      },
      renderUrl(id, options) {
        const search = new URLSearchParams();
        if (options?.format) {
          search.set("format", options.format);
        }
        if (options?.presetId) {
          search.set("presetId", options.presetId);
        }
        if (options?.width) {
          search.set("width", String(options.width));
        }
        if (options?.height) {
          search.set("height", String(options.height));
        }

        return `${baseUrl}${withSearch(`/api/v1/qr-codes/${id}/render`, search)}`;
      },
    },
    analytics: {
      async getSummary() {
        const response = await request<{ data: AnalyticsSummary }>("/api/v1/analytics/summary");
        return response.data;
      },
      async listScans(options) {
        const search = new URLSearchParams();
        if (options?.qrId) {
          search.set("qrId", options.qrId);
        }
        if (options?.limit) {
          search.set("limit", String(options.limit));
        }
        const response = await request<{ data: LatestScan[] }>(withSearch("/api/v1/analytics/scans", search));
        return response.data;
      },
    },
    domains: {
      async list() {
        const response = await request<{ data: CustomDomainSummary[] }>("/api/v1/domains");
        return response.data;
      },
    },
    brand: {
      async get() {
        const response = await request<{ data: BrandProfile }>("/api/v1/brand");
        return response.data;
      },
      async update(input) {
        const response = await request<{ data: BrandProfile }>("/api/v1/brand", {
          method: "PUT",
          body: JSON.stringify(input),
        });
        return response.data;
      },
    },
    styles: {
      async list() {
        const response = await request<{ data: StylePreset[] }>("/api/v1/styles");
        return response.data;
      },
      async get(id) {
        const response = await request<{ data: StylePreset }>(`/api/v1/styles/${id}`);
        return response.data;
      },
      async create(input) {
        const response = await request<{ data: StylePreset }>("/api/v1/styles", {
          method: "POST",
          body: JSON.stringify(input),
        });
        return response.data;
      },
      async update(id, input) {
        const response = await request<{ data: StylePreset }>(`/api/v1/styles/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
        return response.data;
      },
      async delete(id) {
        return request<{ success: true }>(`/api/v1/styles/${id}`, {
          method: "DELETE",
        });
      },
    },
  };
}
