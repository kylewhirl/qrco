"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FileSpreadsheet, Loader2, Package, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { RetailDigitalLinkBuilder } from "@/components/dashboard/retail-digital-link-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { validateGtin } from "@/lib/gs1-digital-link";
import type { CustomDomain, Product, ProductImportError } from "@/lib/types";

type ProductWorkspaceProps = {
  initialProducts: Product[];
};

type ImportPreview = {
  headers: string[];
  rows: string[][];
  fileName: string;
};

function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  row.push(cell.trim());
  if (row.some((value) => value)) rows.push(row);
  return rows;
}

function suggestedColumn(headers: string[], patterns: RegExp[]): string {
  const index = headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)));
  return index >= 0 ? String(index) : "none";
}

function columnValue(row: string[], selection: string): string {
  return selection === "none" ? "" : row[Number(selection)]?.trim() ?? "";
}

export function ProductWorkspace({ initialProducts }: ProductWorkspaceProps) {
  const [products, setProducts] = useState(initialProducts);
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [identifierColumn, setIdentifierColumn] = useState("none");
  const [nameColumn, setNameColumn] = useState("none");
  const [destinationColumn, setDestinationColumn] = useState("none");
  const [descriptionColumn, setDescriptionColumn] = useState("none");
  const [imageColumn, setImageColumn] = useState("none");
  const [domainId, setDomainId] = useState("platform");
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<ProductImportError[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    void fetch("/api/dashboard/domains")
      .then(async (response) => response.ok ? response.json() as Promise<{ domains?: CustomDomain[] }> : { domains: [] })
      .then((result) => {
        if (!ignore) setDomains((result.domains ?? []).filter((domain) => domain.status === "ready"));
      })
      .catch(() => undefined);
    return () => { ignore = true; };
  }, []);

  const validPreviewRows = useMemo(() => {
    if (!preview || identifierColumn === "none") return 0;
    return preview.rows.filter((row) => validateGtin(columnValue(row, identifierColumn)).valid).length;
  }, [identifierColumn, preview]);

  const invalidPreviewRows = preview && identifierColumn !== "none" ? preview.rows.length - validPreviewRows : 0;

  function addProduct(product: Product) {
    setProducts((current) => [product, ...current.filter((item) => item.id !== product.id)]);
    setCreateDialogOpen(false);
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImportMessage("Catalog files must be 5 MB or smaller.");
      return;
    }
    const text = await file.text();
    const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
    const delimiter = firstLine.includes("\t") ? "\t" : ",";
    const parsed = parseDelimited(text, delimiter);
    const headers = parsed.shift() ?? [];
    if (headers.length < 2 || !parsed.length) {
      setImportMessage("Add a header row and at least one product row to the file.");
      return;
    }
    if (parsed.length > 500) {
      setImportMessage("Catalog imports support up to 500 product rows at a time.");
      return;
    }

    setPreview({ headers, rows: parsed, fileName: file.name });
    setIdentifierColumn(suggestedColumn(headers, [/gtin/i, /upc/i, /ean/i, /barcode/i, /product.?id/i]));
    setNameColumn(suggestedColumn(headers, [/product.?name/i, /description/i, /item.?name/i, /title/i]));
    setDestinationColumn(suggestedColumn(headers, [/destination/i, /url/i, /product.?page/i, /website/i]));
    setDescriptionColumn(suggestedColumn(headers, [/description/i, /product.?description/i, /details/i]));
    setImageColumn(suggestedColumn(headers, [/image/i, /photo/i, /picture/i]));
    setImportErrors([]);
    setImportMessage("");
  }

  async function handleImport() {
    if (!preview || identifierColumn === "none") {
      setImportMessage("Choose the column containing the UPC, EAN, or GTIN values first.");
      return;
    }

    setImporting(true);
    setImportMessage("");
    try {
      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customDomainId: domainId === "platform" ? null : domainId,
          rows: preview.rows.map((row, index) => {
            const destinationUrl = columnValue(row, destinationColumn);
            const description = columnValue(row, descriptionColumn);
            const imageUrl = columnValue(row, imageColumn);
            return {
              row: index + 2,
              name: columnValue(row, nameColumn) || `Imported product ${index + 1}`,
              identifierSubmitted: columnValue(row, identifierColumn),
              destinationUrl: destinationUrl || null,
              hostedExperience: !destinationUrl,
              content: {
                ...(description ? { description } : {}),
                ...(imageUrl ? { imageUrl } : {}),
              },
              qualifiers: {},
            };
          }),
        }),
      });
      const result = await response.json() as { created?: Product[]; errors?: ProductImportError[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Import failed");

      const created = result.created ?? [];
      setProducts((current) => [...created, ...current.filter((item) => !created.some((next) => next.id === item.id))]);
      setImportErrors(result.errors ?? []);
      setImportMessage(`${created.length} product${created.length === 1 ? "" : "s"} imported${result.errors?.length ? ` · ${result.errors.length} row${result.errors.length === 1 ? "" : "s"} need attention` : ""}.`);
      toast.success(`${created.length} product${created.length === 1 ? "" : "s"} imported`);
      if (!result.errors?.length) setImportDialogOpen(false);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const hostedCount = products.filter((product) => product.hostedExperience).length;
  const scanCount = products.reduce((total, product) => total + product.totalScans, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setImportDialogOpen(true)}>
          <FileSpreadsheet className="size-4" />Import catalog
        </Button>
        <Button type="button" className="rounded-xl" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="size-4" />Add product
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Products", products.length.toLocaleString(), "Total in catalog"],
          ["Hosted pages", hostedCount.toLocaleString(), "Managed product pages"],
          ["Scans", scanCount.toLocaleString(), "Times scanned"],
        ].map(([label, value, detail]) => (
          <Card key={label} className="rounded-2xl border-border/80">
            <CardContent className="p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-[-0.05em]">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="grid max-h-[calc(100dvh-1rem)] gap-0 overflow-y-auto border-none bg-transparent p-0 shadow-none sm:max-h-[calc(100dvh-2rem)] sm:max-w-6xl">
          <DialogHeader className="rounded-t-2xl border-x border-t bg-card px-5 pt-5 sm:px-6 sm:pt-6">
            <DialogTitle>Add product</DialogTitle>
            <DialogDescription>Create a product identity and QR code.</DialogDescription>
          </DialogHeader>
          <div className="rounded-b-2xl border-x border-b bg-card p-5 sm:p-6"><RetailDigitalLinkBuilder onProductCreated={addProduct} /></div>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open);
        if (!open) {
          setPreview(null);
          setImportErrors([]);
          setImportMessage("");
        }
      }}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import catalog</DialogTitle>
            <DialogDescription>Upload a CSV or TSV file and map its columns.</DialogDescription>
          </DialogHeader>
            <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><Upload className="size-4 text-[var(--brand-blue)]" /><p className="text-sm text-muted-foreground">Choose a CSV or TSV export.</p></div>
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-action)] px-4 text-sm font-bold text-white hover:opacity-90">Choose file<input type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" className="sr-only" onChange={handleFile} /></label>
            </div>

            {preview ? (
              <div className="space-y-4 rounded-xl border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold">{preview.fileName} <span className="font-normal text-muted-foreground">· {preview.rows.length} rows</span></p><Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => setPreview(null)}><X className="size-4" />Clear</Button></div>
                <div className="grid gap-3 md:grid-cols-4">
                  {[["Identifier column", identifierColumn, setIdentifierColumn], ["Product name", nameColumn, setNameColumn], ["Destination URL", destinationColumn, setDestinationColumn], ["Description", descriptionColumn, setDescriptionColumn], ["Image URL", imageColumn, setImageColumn]].map(([label, value, setter]) => (
                    <label key={label as string} className="space-y-1.5 text-xs font-bold">{label as string}<select value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"><option value="none">Not mapped</option>{preview.headers.map((header, index) => <option key={`${header}-${index}`} value={index}>{header || `Column ${index + 1}`}</option>)}</select></label>
                  ))}
                  <label className="space-y-1.5 text-xs font-bold">Resolver domain<Select value={domainId} onValueChange={setDomainId}><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="platform">Platform domain</SelectItem>{domains.map((domain) => <SelectItem key={domain.id} value={domain.id}>{domain.hostname}</SelectItem>)}</SelectContent></Select></label>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs"><p className="text-muted-foreground"><span className="font-bold text-emerald-600">{validPreviewRows} valid</span> · <span className="font-bold text-destructive">{invalidPreviewRows} need attention</span></p><Button type="button" className="rounded-xl" onClick={handleImport} disabled={importing || identifierColumn === "none"}>{importing ? <Loader2 className="size-4 animate-spin" /> : <Package className="size-4" />}Import valid products</Button></div>
              </div>
            ) : null}
            {importMessage ? <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-foreground/75">{importMessage}</p> : null}
            {importErrors.length ? <div className="rounded-xl border border-amber-500/25 bg-amber-500/7 p-4 text-sm"><p className="font-bold">Rows not imported</p><div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">{importErrors.slice(0, 12).map((item) => <p key={`${item.row}-${item.identifier}`}>Row {item.row} · {item.identifier || "blank"} — {item.reason}</p>)}</div></div> : null}
        </DialogContent>
      </Dialog>

      <Card className="rounded-2xl border-border/80">
        <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3"><CardTitle className="text-lg">All products</CardTitle></CardHeader>
        <CardContent className="p-0">
          {products.length ? (
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-y bg-muted/30 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-semibold">Product</th><th className="px-5 py-3 font-semibold">GTIN</th><th className="px-5 py-3 font-semibold">Destination</th><th className="px-5 py-3 font-semibold">Scans</th><th className="px-5 py-3 font-semibold">Domain</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y">{products.map((product) => <tr key={product.id} className="hover:bg-muted/20"><td className="px-5 py-4"><Link href={`/dashboard/products/${product.id}`} className="font-bold hover:underline">{product.name}</Link><p className="mt-1 text-xs text-muted-foreground">Submitted: {product.identifierSubmitted}</p></td><td className="px-5 py-4 font-mono text-xs">{product.gtin}</td><td className="max-w-[260px] px-5 py-4"><span className="block truncate text-xs" title={product.destinationUrl}>{product.hostedExperience ? "Hosted product page" : product.destinationUrl}</span><Badge variant="outline" className="mt-1 rounded-full text-[10px]">{product.hostedExperience ? "Hosted" : "External"}</Badge></td><td className="px-5 py-4 text-xs">{product.totalScans.toLocaleString()}</td><td className="px-5 py-4 text-xs text-muted-foreground">{product.customHostname ?? "Platform"}</td><td className="px-5 py-4 text-right"><Button asChild variant="outline" size="sm" className="rounded-lg"><Link href={`/dashboard/products/${product.id}`}>Edit <ArrowRight className="size-3.5" /></Link></Button></td></tr>)}</tbody></table></div>
          ) : (
            <div className="border-t border-dashed px-4 py-14 text-center text-sm text-muted-foreground">No products yet. Use Add product or Import catalog.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
