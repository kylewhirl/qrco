import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { createTqrcoClient, type CreateTqrcoClientOptions, type ListScansOptions, type TqrcoClient } from "./client";
import type { AnalyticsSummary, BrandProfile, CustomDomainSummary, LatestScan, QR, QRData, StylePreset } from "./shared/contracts";

type AsyncState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  reload: () => Promise<void>;
};

type MutationState<TArgs extends unknown[], TResult> = {
  mutate: (...args: TArgs) => Promise<TResult>;
  data: TResult | null;
  error: Error | null;
  isLoading: boolean;
};

const TqrcoContext = createContext<TqrcoClient | null>(null);

export function TqrcoProvider({
  client,
  options,
  children,
}: PropsWithChildren<{ client?: TqrcoClient; options?: CreateTqrcoClientOptions }>) {
  const value = useMemo(() => {
    if (client) {
      return client;
    }

    if (!options) {
      return null;
    }

    return createTqrcoClient(options);
  }, [client, options]);

  if (!value) {
    throw new Error("TqrcoProvider requires either a client or createTqrcoClient options.");
  }

  return <TqrcoContext.Provider value={value}>{children}</TqrcoContext.Provider>;
}

export function useTqrcoClient() {
  const client = useContext(TqrcoContext);
  if (!client) {
    throw new Error("useTqrcoClient must be used inside a TqrcoProvider.");
  }

  return client;
}

export function useOptionalTqrcoClient() {
  return useContext(TqrcoContext);
}

function useAsyncResource<T>(loader: () => Promise<T>, deps: React.DependencyList): AsyncState<T> {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function reload() {
    setIsLoading(true);
    try {
      const nextData = await loaderRef.current();
      setData(nextData);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error("Request failed"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, deps);

  return { data, error, isLoading, reload };
}

function useMutation<TArgs extends unknown[], TResult>(action: (...args: TArgs) => Promise<TResult>): MutationState<TArgs, TResult> {
  const actionRef = useRef(action);
  actionRef.current = action;
  const [data, setData] = useState<TResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function mutate(...args: TArgs) {
    setIsLoading(true);
    try {
      const result = await actionRef.current(...args);
      setData(result);
      setError(null);
      return result;
    } catch (nextError) {
      const errorValue = nextError instanceof Error ? nextError : new Error("Request failed");
      setError(errorValue);
      throw errorValue;
    } finally {
      setIsLoading(false);
    }
  }

  return { mutate, data, error, isLoading };
}

export function useQRCodes() {
  const client = useTqrcoClient();
  return useAsyncResource<QR[]>(() => client.qr.list(), [client]);
}

export function useQRCode(qrId: string | null | undefined) {
  const client = useTqrcoClient();
  return useAsyncResource<QR | null>(
    async () => (qrId ? client.qr.get(qrId) : null),
    [client, qrId],
  );
}

export function useCreateQRCode() {
  const client = useTqrcoClient();
  return useMutation((input: QRData | { data: QRData; customDomainId?: string | null; customSlug?: string | null }) => client.qr.create(input));
}

export function useUpdateQRCode() {
  const client = useTqrcoClient();
  return useMutation((id: string, input: QRData | { data: QRData; customDomainId?: string | null; customSlug?: string | null }) => client.qr.update(id, input));
}

export function useDeleteQRCode() {
  const client = useTqrcoClient();
  return useMutation((id: string) => client.qr.delete(id));
}

export function useUploadQRCodeImage() {
  const client = useTqrcoClient();
  return useMutation((id: string, file: File) => client.qr.uploadImage(id, file));
}

export function useAnalyticsSummary() {
  const client = useTqrcoClient();
  return useAsyncResource<AnalyticsSummary>(() => client.analytics.getSummary(), [client]);
}

export function useScans(options?: ListScansOptions) {
  const client = useTqrcoClient();
  return useAsyncResource<LatestScan[]>(
    () => client.analytics.listScans(options),
    [client, options?.qrId, options?.limit],
  );
}

export function useBrand() {
  const client = useTqrcoClient();
  return useAsyncResource<BrandProfile>(() => client.brand.get(), [client]);
}

export function useDomains() {
  const client = useTqrcoClient();
  return useAsyncResource<CustomDomainSummary[]>(() => client.domains.list(), [client]);
}

export function useUpdateBrand() {
  const client = useTqrcoClient();
  return useMutation((input: Omit<BrandProfile, "id" | "userId" | "createdAt" | "updatedAt">) => client.brand.update(input));
}

export function useStylePresets() {
  const client = useTqrcoClient();
  return useAsyncResource<StylePreset[]>(() => client.styles.list(), [client]);
}

export function useStylePreset(styleId: string | null | undefined) {
  const client = useTqrcoClient();
  return useAsyncResource<StylePreset | null>(
    async () => (styleId ? client.styles.get(styleId) : null),
    [client, styleId],
  );
}

export function useCreateStylePreset() {
  const client = useTqrcoClient();
  return useMutation((input: Omit<StylePreset, "id" | "userId" | "createdAt" | "updatedAt">) => client.styles.create(input));
}

export function useUpdateStylePreset() {
  const client = useTqrcoClient();
  return useMutation((id: string, input: Partial<Omit<StylePreset, "id" | "userId" | "createdAt" | "updatedAt">>) => client.styles.update(id, input));
}

export function useDeleteStylePreset() {
  const client = useTqrcoClient();
  return useMutation((id: string) => client.styles.delete(id));
}
