"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CustomDomain, QR } from "@/lib/types"
import { formatDate, isValidURL, isValidEmail, isValidPhone, truncateText } from "@/lib/utils"
import { Edit, Trash2, Plus, PaintbrushVertical, QrCode } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label";
import { Textarea } from "./ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GlobeIcon,
  TypeIcon,
  MailIcon,
  UserIcon,
  PhoneIcon,
  MessageSquareIcon,
  WifiIcon,
  FileIcon,
} from "lucide-react";
// And import your input subcomponents:
import WebsiteInput from "./qr/inputs/website";
import TextInput from "./qr/inputs/text";
import EmailInput from "./qr/inputs/email";
import ContactInput from "./qr/inputs/contact";
import PhoneInput from "./qr/inputs/phone";
import SmsInput from "./qr/inputs/sms";
import WifiInput from "./qr/inputs/wifi";
import FileInput from "./qr/inputs/file";
import { QRImageSquare } from "./qr-image-square";
import { BrandProfile, QRData, StylePreset } from "@/lib/types"
import QrPreview from "./qr-preview"
import { buildPublicQrUrl } from "@/lib/qr-url"
import { buildGs1DigitalLinkUrl } from "@/lib/gs1-digital-link"
import { QrDesignDialog } from "./dashboard/qr-design-dialog";
import { flattenAndDownloadSvg, prepareSvgForExport } from "@/lib/flatten-svg";

interface QRMutationInput {
  data: QRData
  customDomainId: string | null
  customSlug?: string | null
}

interface QRCodeListProps {
  qrCodes: QR[]
  onCreateQR: (payload: QRMutationInput) => Promise<QR>
  onUpdateQR: (id: string, payload: QRMutationInput) => Promise<void>
  onDeleteQR: (id: string) => Promise<void>
  onImageUploaded: (qr: QR) => void
}

type QuickCreateType = Exclude<QRData["type"], "file">;

const MODAL_FRAME_CLASS_NAME = "grid max-h-[calc(100dvh-1rem)] grid-rows-[auto,minmax(0,1fr),auto] gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)]"
const MODAL_HEADER_CLASS_NAME = "px-4 pb-3 pt-4 sm:px-6 sm:pt-6"
const MODAL_BODY_CLASS_NAME = "min-h-0 overflow-y-auto px-4 py-4 sm:px-6"
const MODAL_FOOTER_CLASS_NAME = "border-t bg-background/95 px-4 py-3 sm:px-6 [&_[data-slot=button]]:w-full sm:[&_[data-slot=button]]:w-auto"

const QUICK_CREATE_OPTIONS: Array<{
  value: QuickCreateType;
  label: string;
  icon: typeof GlobeIcon;
}> = [
  { value: "url", label: "Website", icon: GlobeIcon },
  { value: "text", label: "Text", icon: TypeIcon },
  { value: "email", label: "Email", icon: MailIcon },
  { value: "contact", label: "Contact", icon: UserIcon },
  { value: "phone", label: "Phone", icon: PhoneIcon },
  { value: "sms", label: "SMS", icon: MessageSquareIcon },
  { value: "wifi", label: "WiFi", icon: WifiIcon },
]

function createDefaultQuickCreateData(type: QuickCreateType): QRData {
  switch (type) {
    case "url":
      return { type: "url", url: "" }
    case "text":
      return { type: "text", text: "" }
    case "email":
      return { type: "email", to: "", subject: "", body: "" }
    case "contact":
      return { type: "contact", source: "fields" }
    case "phone":
      return { type: "phone", number: "" }
    case "sms":
      return { type: "sms", number: "", message: "" }
    case "wifi":
      return { type: "wifi", ssid: "", authenticationType: "WPA", password: "", hidden: false }
  }
}

function mergeRenderConfig(
  base: NonNullable<BrandProfile["defaultConfig"]>,
  override?: BrandProfile["defaultConfig"] | null,
) {
  if (!override) {
    return base
  }

  const borderSettings =
    override.borderSettings === undefined
      ? base.borderSettings
      : override.borderSettings === null
        ? null
        : {
            ...(base.borderSettings ?? {}),
            ...override.borderSettings,
          }

  return {
    ...base,
    ...override,
    styleSettings: {
      ...(base.styleSettings ?? {}),
      ...(override.styleSettings ?? {}),
    },
    logoSettings: override.logoSettings === undefined ? base.logoSettings : override.logoSettings,
    borderSettings,
  }
}

export function QRCodeList({ qrCodes, onCreateQR, onUpdateQR, onDeleteQR, onImageUploaded }: QRCodeListProps) {
  const [newData, setNewData] = useState<QRData>(createDefaultQuickCreateData("url"))
  const [newCustomDomainId, setNewCustomDomainId] = useState<string | null>(null)
  const [newCustomSlug, setNewCustomSlug] = useState("")
  const [editingQR, setEditingQR] = useState<QR | null>(null)
  const [editData, setEditData] = useState<QRData | null>(null)
  const [designData, setDesignData] = useState<QRData | null>(null)
  const [editCustomDomainId, setEditCustomDomainId] = useState<string | null>(null)
  const [editCustomSlug, setEditCustomSlug] = useState("")
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [brand, setBrand] = useState<BrandProfile | null>(null)
  const [stylePresets, setStylePresets] = useState<StylePreset[]>([])
  const [domainsLoading, setDomainsLoading] = useState(true)
  const [domainsLocked, setDomainsLocked] = useState(false)
  const [stylesLoading, setStylesLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSavingDesign, setIsSavingDesign] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [designDialogOpen, setDesignDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const viewPreviewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void loadDomains()
    void loadStyles()
  }, [])

  async function loadDomains() {
    setDomainsLoading(true)
    try {
      const response = await fetch("/api/dashboard/domains")
      if (response.status === 402) {
        setDomains([])
        setDomainsLocked(true)
        return
      }

      if (!response.ok) {
        throw new Error("Failed to load domains")
      }

      const data = await response.json() as { domains?: CustomDomain[] }
      setDomainsLocked(false)
      setDomains((data.domains ?? []).filter((domain) => domain.status === "ready"))
    } catch (error) {
      console.error("Failed to load domains:", error)
      toast.error("Failed to load custom domains")
    } finally {
      setDomainsLoading(false)
    }
  }

  async function loadStyles() {
    setStylesLoading(true)
    try {
      const [brandResponse, presetsResponse] = await Promise.all([
        fetch("/api/dashboard/brand"),
        fetch("/api/dashboard/styles"),
      ])

      if (!brandResponse.ok || !presetsResponse.ok) {
        throw new Error("Failed to load styles")
      }

      const brandData = await brandResponse.json() as { brand?: BrandProfile }
      const presetsData = await presetsResponse.json() as { presets?: StylePreset[] }
      setBrand(brandData.brand ?? null)
      setStylePresets(presetsData.presets ?? [])
    } catch (error) {
      console.error("Failed to load design styles:", error)
      toast.error("Failed to load saved styles")
    } finally {
      setStylesLoading(false)
    }
  }

  function ClientFormattedDate({ date }: { date: string | Date | null }) {
    const [formatted, setFormatted] = useState("")

    useEffect(() => {
      if (!date) {
        setFormatted("Never")
      } else {
        setFormatted(formatDate(date))
      }
    }, [date])

    return <span>{formatted}</span>
  }

  function validateQrData(data: QRData): string | null {
    switch (data.type) {
      case "url":
        return !data.url || !isValidURL(data.url) ? "Please enter a valid URL" : null
      case "text":
        return !data.text ? "Text content cannot be empty" : null
      case "email":
        return !data.to || !data.subject || !data.body || !isValidEmail(data.to)
          ? "Please fill out a valid email, subject, and body"
          : null
      case "phone":
        return !data.number || !isValidPhone(data.number) ? "Please enter a valid phone number" : null
      case "contact":
        if (data.source === "fields") {
          return !data.firstName &&
            !data.lastName &&
            !data.organization &&
            !data.phone &&
            !data.email &&
            !data.website &&
            !data.address &&
            !data.note
            ? "Please enter at least one contact field"
            : null
        }
        return !data.vcard.trim() ? "Please upload or paste a valid VCARD payload" : null
      case "sms":
        return !data.number || !data.message || !isValidPhone(data.number)
          ? "Please enter a valid number and message"
          : null
      case "wifi":
        return !data.ssid ? "SSID cannot be empty" : null
      case "file":
        return !data.key ? "File key cannot be empty" : null
    }
  }

  const handleCreate = async () => {
    const validationError = validateQrData(newData)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsCreating(true)
    try {
      const createdQR = await onCreateQR({
        data: newData,
        customDomainId: newCustomDomainId,
        customSlug: newCustomDomainId ? newCustomSlug : null,
      })
      setNewData(createDefaultQuickCreateData("url"))
      setNewCustomDomainId(null)
      setNewCustomSlug("")
      setCreateDialogOpen(false)
      setEditingQR(createdQR)
      setEditData(createdQR.data)
      setEditCustomDomainId(createdQR.customDomainId ?? null)
      setEditCustomSlug(createdQR.data.gs1 ? "" : createdQR.code)
      setViewDialogOpen(true)
      toast.success("QR code created successfully")
    } catch (error) {
      console.error("Error creating QR code:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create QR code")
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingQR || !editData) return;

    const validationError = validateQrData(editData)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsUpdating(true);
    try {
      await onUpdateQR(editingQR.id, {
        data: editData,
        customDomainId: editCustomDomainId,
        customSlug: editCustomDomainId && !editData.gs1 ? editCustomSlug : null,
      });
      setEditingQR(null);
      setEditData(null);
      setEditCustomDomainId(null);
      setEditCustomSlug("");
      setEditDialogOpen(false);
      toast.success("QR code updated successfully");
    } catch (error) {
      console.error("Error updating QR code:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update QR code");
    } finally {
      setIsUpdating(false);
    }
  }

  const handleDownloadViewedSvg = async () => {
    const svg = viewPreviewRef.current?.querySelector("svg")
    if (!svg) {
      toast.error("Preview is not ready yet")
      return
    }

    await flattenAndDownloadSvg(svg)
  }

  const handleDownloadViewedPng = async () => {
    const svg = viewPreviewRef.current?.querySelector("svg")
    if (!svg) {
      toast.error("Preview is not ready yet")
      return
    }

    const svgData = await prepareSvgForExport(svg)
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)
    const img = new window.Image()

    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = svg.width.baseVal.value || 512
      canvas.height = svg.height.baseVal.value || 512
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            const anchor = document.createElement("a")
            anchor.href = URL.createObjectURL(blob)
            anchor.download = `${editingQR?.code ?? "qr-code"}.png`
            document.body.appendChild(anchor)
            anchor.click()
            document.body.removeChild(anchor)
            URL.revokeObjectURL(anchor.href)
          }
          URL.revokeObjectURL(url)
        }, "image/png")
      } else {
        URL.revokeObjectURL(url)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      toast.error("Failed to export PNG")
    }

    img.src = url
  }

  const handleDelete = async () => {
    if (!editingQR) return

    setIsDeleting(true)
    try {
      await onDeleteQR(editingQR.id)
      setEditingQR(null)
      setDeleteDialogOpen(false)
      toast.success("QR code deleted successfully")
    } catch (error) {
      console.error("Error deleting QR code:", error)
      toast.error("Failed to delete QR code")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDesignSave = async () => {
    if (!editingQR || !designData) return

    setIsSavingDesign(true)
    try {
      await onUpdateQR(editingQR.id, {
        data: designData,
        customDomainId: editingQR.customDomainId ?? null,
      })
      setDesignDialogOpen(false)
      setEditingQR(null)
      setDesignData(null)
      toast.success("QR design updated successfully")
    } catch (error) {
      console.error("Error updating QR design:", error)
      toast.error("Failed to update QR design")
    } finally {
      setIsSavingDesign(false)
    }
  }

  const getPublicUrl = (qr: QR) => qr.publicUrl || buildPublicQrUrl(qr.code, qr.customHostname ?? null)
  const mergeQrMeta = (previous: QRData | null, next: QRData): QRData => ({
    ...next,
    name: previous?.name,
    description: previous?.description,
    imageKey: previous?.imageKey,
    errorLevel: previous?.errorLevel,
    styleSettings: previous?.styleSettings,
    logoSettings: previous?.logoSettings,
    borderSettings: previous?.borderSettings,
  })
  const getViewPreviewConfig = (qr: QR | null) => {
    if (!qr) {
      return {
        errorLevel: "M" as const,
        styleSettings: undefined,
        logoSettings: undefined,
        borderSettings: undefined,
      }
    }

    const brandConfig = brand?.defaultConfig
    const typeConfig = brand?.typeDefaults?.[qr.data.type]
    const mergedBrandConfig = brandConfig
      ? mergeRenderConfig(mergeRenderConfig(brandConfig, typeConfig), {
          errorLevel: qr.data.errorLevel ?? brandConfig.errorLevel,
          styleSettings: qr.data.styleSettings,
          logoSettings: qr.data.logoSettings,
          borderSettings: qr.data.borderSettings,
        })
      : null

    return {
      errorLevel: mergedBrandConfig?.errorLevel ?? qr.data.errorLevel ?? "M",
      styleSettings: mergedBrandConfig?.styleSettings ?? qr.data.styleSettings ?? undefined,
      logoSettings: mergedBrandConfig?.logoSettings ?? qr.data.logoSettings ?? undefined,
      borderSettings: mergedBrandConfig?.borderSettings ?? qr.data.borderSettings ?? undefined,
    }
  }


  
  return (
    <Card className="col-span-4 min-w-0 gap-0 overflow-hidden border border-border bg-card py-0">
      <CardHeader className="flex flex-col items-start justify-between gap-3 px-5 pt-5 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="font-display text-lg">QR codes</CardTitle>
          <CardDescription className="text-xs">Manage your QR codes</CardDescription>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full rounded-xl bg-[var(--brand-action)] font-bold text-white shadow-[0_10px_24px_-16px_var(--brand-action)] hover:bg-[var(--brand-action)]/90 sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Quick Create
            </Button>
          </DialogTrigger>
          <DialogContent className={MODAL_FRAME_CLASS_NAME}>
            <DialogHeader className={MODAL_HEADER_CLASS_NAME}>
              <DialogTitle>Create QR Code</DialogTitle>
              <DialogDescription>Choose a QR type and enter the content to create it quickly.</DialogDescription>
            </DialogHeader>
            <div className={MODAL_BODY_CLASS_NAME}>
              <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quick-create-type">QR type</Label>
                <Select
                  value={newData.type}
                  onValueChange={(value) => setNewData(createDefaultQuickCreateData(value as QuickCreateType))}
                >
                  <SelectTrigger id="quick-create-type" className="w-full">
                    <SelectValue placeholder="Select QR type" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUICK_CREATE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <option.icon className="mr-2 h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newData.type === "url" ? (
                <WebsiteInput value={newData} onChange={setNewData} />
              ) : null}
              {newData.type === "text" ? (
                <TextInput
                  value={newData.text}
                  onChange={(text) => setNewData({ type: "text", text })}
                />
              ) : null}
              {newData.type === "email" ? (
                <EmailInput value={newData} onChange={setNewData} />
              ) : null}
              {newData.type === "contact" ? (
                <ContactInput value={newData} onChange={setNewData} />
              ) : null}
              {newData.type === "phone" ? (
                <PhoneInput value={newData} onChange={setNewData} />
              ) : null}
              {newData.type === "sms" ? (
                <SmsInput value={newData} onChange={setNewData} />
              ) : null}
              {newData.type === "wifi" ? (
                <WifiInput value={newData} onChange={setNewData} />
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="custom-domain">Custom domain</Label>
                <Select
                  value={newCustomDomainId ?? "default"}
                  onValueChange={(value) => {
                    setNewCustomDomainId(value === "default" ? null : value)
                    if (value === "default") {
                      setNewCustomSlug("")
                    }
                  }}
                  disabled={domainsLoading || domainsLocked}
                >
                  <SelectTrigger id="custom-domain" className="w-full">
                    <SelectValue placeholder={domainsLoading ? "Loading domains..." : domainsLocked ? "Upgrade required" : "Use default domain"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Use default domain</SelectItem>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.hostname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {domainsLocked ? (
                  <p className="text-xs text-muted-foreground">Upgrade to Creator to assign custom domains.</p>
                ) : null}
              </div>
              {newCustomDomainId ? (
                <div className="grid gap-2">
                  <Label htmlFor="custom-slug">Custom slug</Label>
                  <Input
                    id="custom-slug"
                    value={newCustomSlug}
                    onChange={(event) => setNewCustomSlug(event.target.value)}
                    placeholder="spring-campaign"
                  />
                </div>
              ) : null}
              </div>
            </div>
            <DialogFooter className={MODAL_FOOTER_CLASS_NAME}>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="min-w-0 overflow-x-auto px-3 pb-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-[0.64rem] font-black uppercase tracking-[0.08em]">Image</TableHead>
              <TableHead className="h-8 text-[0.64rem] font-black uppercase tracking-[0.08em]">Code</TableHead>
              <TableHead className="h-8 text-[0.64rem] font-black uppercase tracking-[0.08em]">Public URL</TableHead>
              <TableHead className="h-8 text-[0.64rem] font-black uppercase tracking-[0.08em]">Type</TableHead>
              <TableHead className="h-8 text-[0.64rem] font-black uppercase tracking-[0.08em]">Total Scans</TableHead>
              <TableHead className="h-8 text-[0.64rem] font-black uppercase tracking-[0.08em]">Last Scanned</TableHead>
              <TableHead className="h-8 text-[0.64rem] font-black uppercase tracking-[0.08em]">Created</TableHead>
              <TableHead className="h-8 text-right text-[0.64rem] font-black uppercase tracking-[0.08em]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No QR codes found
                </TableCell>
              </TableRow>
            ) : (
              qrCodes.map((qr) => (
                <TableRow key={qr.id}>
                  <TableCell>
                    <QRImageSquare
                      qr={qr}
                      editable
                      className="h-12 w-12"
                      onUploaded={onImageUploaded}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{qr.data?.name ? qr.data.name : qr.code}</TableCell>
                  <TableCell className="max-w-[240px] font-mono text-xs text-muted-foreground">
                    {truncateText(getPublicUrl(qr), 42)}
                  </TableCell>
                  <TableCell>
                    {qr.data.type === "url"
                      ? "Website"
                      : qr.data.type === "sms"
                      ? "SMS"
                      : qr.data.type.charAt(0).toUpperCase() + qr.data.type.slice(1)}
                    </TableCell>
                  <TableCell>{qr.totalScans}</TableCell>
                  <TableCell><ClientFormattedDate date={qr.lastScanned} /></TableCell>
                  <TableCell><ClientFormattedDate date={qr.createdAt} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Dialog
                        open={viewDialogOpen && editingQR?.id === qr.id}
                        onOpenChange={(open) => {
                          setViewDialogOpen(open)
                          if (!open) {
                            setViewDialogOpen(false)
                            setEditCustomDomainId(null)
                            setEditCustomSlug("")
                          }
                        }}
                        
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingQR(qr)
                              setEditData(qr.data)
                              setEditCustomDomainId(qr.customDomainId ?? null)
                              setEditCustomSlug(qr.data.gs1 ? "" : qr.code)
                              setViewDialogOpen(true)
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                            <span className="sr-only">View QR Code</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className={MODAL_FRAME_CLASS_NAME}>
                          <DialogHeader className={MODAL_HEADER_CLASS_NAME}>
                            <DialogTitle>View QR Code</DialogTitle>
                            <DialogDescription>
                              {editingQR ? getPublicUrl(editingQR) : ""}
                            </DialogDescription>
                          </DialogHeader>
                          <div className={MODAL_BODY_CLASS_NAME}>
                            <div className="flex flex-col items-center gap-4">
                            <div ref={viewPreviewRef} className="flex w-full max-w-[320px] items-center justify-center">
                              <QrPreview
                                data={editingQR ? getPublicUrl(editingQR) : ""}
                                errorLevel={getViewPreviewConfig(editingQR).errorLevel}
                                styleSettings={getViewPreviewConfig(editingQR).styleSettings}
                                borderSettings={getViewPreviewConfig(editingQR).borderSettings}
                                logoSettings={getViewPreviewConfig(editingQR).logoSettings}
                                className="w-full h-full"
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {editingQR?.data.type === "url"
                                ? "Website"
                                : editingQR?.data.type === "sms"
                                  ? "SMS"
                                  : editingQR?.data.type
                                    ? editingQR.data.type.charAt(0).toUpperCase() + editingQR.data.type.slice(1)
                                    : ""}
                            </span>
                            </div>
                          </div>
                          <DialogFooter className={MODAL_FOOTER_CLASS_NAME}>
                            <Button variant="outline" onClick={handleDownloadViewedSvg}>
                              Download SVG
                            </Button>
                            <Button variant="outline" onClick={handleDownloadViewedPng}>
                              Download PNG
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (!editingQR) return
                                setViewDialogOpen(false)
                                setDesignData(editingQR.data)
                                setDesignDialogOpen(true)
                              }}
                            >
                              Edit design
                            </Button>
                            <Button onClick={() => setViewDialogOpen(false)}>
                              Done
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={designDialogOpen && editingQR?.id === qr.id}
                        onOpenChange={(open) => {
                          setDesignDialogOpen(open)
                          if (!open) {
                            setEditingQR(null)
                            setDesignData(null)
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingQR(qr)
                              setDesignData(qr.data)
                              setDesignDialogOpen(true)
                            }}
                          >
                            <PaintbrushVertical className="h-4 w-4" />
                            <span className="sr-only">Design</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="grid max-h-[calc(100dvh-1rem)] grid-rows-[auto,minmax(0,1fr),auto] gap-0 overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-h-[calc(100dvh-2rem)] sm:max-w-6xl">
                          <DialogHeader className="rounded-t-[28px] border-x border-t bg-card px-4 pt-4 sm:px-6 sm:pt-6">
                            <DialogTitle>Design QR Code</DialogTitle>
                            <DialogDescription>
                              Customize this QR, apply a saved style, and download the result.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="min-h-0 overflow-y-auto border-x bg-card px-3 py-3 sm:px-4">
                            {editingQR && designData ? (
                              <QrDesignDialog
                                qr={editingQR}
                                value={designData}
                                brand={brand}
                                presets={stylePresets}
                                stylesLoading={stylesLoading}
                                onChange={setDesignData}
                              />
                            ) : null}
                          </div>
                          <DialogFooter className="rounded-b-[28px] border-x border-b bg-card px-4 pb-4 pt-3 sm:px-6 sm:pb-6 [&_[data-slot=button]]:w-full sm:[&_[data-slot=button]]:w-auto">
                            <Button onClick={() => setDesignDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleDesignSave} disabled={isSavingDesign}>
                              {isSavingDesign ? "Saving..." : "Save design"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={editDialogOpen && editingQR?.id === qr.id}
                        onOpenChange={(open) => {
                          setEditDialogOpen(open)
                          if (!open) {
                            setEditingQR(null)
                            setEditCustomDomainId(null)
                            setEditCustomSlug("")
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingQR(qr)
                              setEditData(qr.data)
                              setEditCustomDomainId(qr.customDomainId ?? null)
                              setEditCustomSlug(qr.code)
                              setEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className={MODAL_FRAME_CLASS_NAME}>
                          <DialogHeader className={MODAL_HEADER_CLASS_NAME}>
                            <DialogTitle>Edit QR Code</DialogTitle>
                            <DialogDescription>
                              Update the data for QR code: {editingQR?.code}
                            </DialogDescription>
                          </DialogHeader>
                          <div className={MODAL_BODY_CLASS_NAME}>
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <Label htmlFor="qr-public-url">Public URL</Label>
                              <Input
                                id="qr-public-url"
                                readOnly
                                value={editingQR && editData
                                  ? editData.gs1
                                    ? buildGs1DigitalLinkUrl(
                                        editData.gs1,
                                        domains.find((domain) => domain.id === editCustomDomainId)?.hostname ?? editingQR.customHostname ?? null,
                                      )
                                    : buildPublicQrUrl(
                                        editCustomDomainId ? editCustomSlug : editingQR.code,
                                        domains.find((domain) => domain.id === editCustomDomainId)?.hostname ?? editingQR.customHostname ?? null,
                                      )
                                  : ""}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="edit-custom-domain-full">Public domain</Label>
                              <Select
                                value={editCustomDomainId ?? "default"}
                                onValueChange={(value) => {
                                  setEditCustomDomainId(value === "default" ? null : value)
                                  setEditCustomSlug(editData?.gs1 ? "" : editingQR?.code ?? "")
                                }}
                                disabled={domainsLoading || domainsLocked}
                              >
                                <SelectTrigger id="edit-custom-domain-full" className="w-full">
                                  <SelectValue placeholder={domainsLoading ? "Loading domains..." : domainsLocked ? "Upgrade required" : "Use default domain"} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Use default domain</SelectItem>
                                  {domains.map((domain) => (
                                    <SelectItem key={domain.id} value={domain.id}>
                                      {domain.hostname}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {domainsLocked ? (
                                <p className="text-xs text-muted-foreground">Upgrade to Creator to assign custom domains.</p>
                              ) : null}
                            </div>
                            {editCustomDomainId && !editData?.gs1 ? (
                              <div className="space-y-1">
                                <Label htmlFor="edit-custom-slug">Custom slug</Label>
                                <Input
                                  id="edit-custom-slug"
                                  value={editCustomSlug}
                                  onChange={(event) => setEditCustomSlug(event.target.value)}
                                  placeholder="spring-campaign"
                                />
                              </div>
                            ) : null}
                            <div className="space-y-1">
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                value={editData?.name ?? ""}
                                onChange={e =>
                                  setEditData((prev) =>
                                    prev ? { ...prev, name: e.target.value } : prev
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="desc">Description</Label>
                              <Textarea
                                id="desc"
                                value={editData?.description ?? ""}
                                onChange={e =>
                                  setEditData((prev) =>
                                    prev ? { ...prev, description: e.target.value } : prev
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="content-type">Content</Label>
                              <Select
                                value={editData?.type ?? ""}
                                onValueChange={value => {
                                  // Set initial values for each type to satisfy QRData
                                  switch (value as QRData['type']) {
                                    case "url":
                                      setEditData((prev) => mergeQrMeta(prev, { type: "url", url: "" }));
                                      break;
                                    case "text":
                                      setEditData((prev) => mergeQrMeta(prev, { type: "text", text: "" }));
                                      break;
                                    case "email":
                                      setEditData((prev) => mergeQrMeta(prev, { type: "email", to: "", subject: "", body: "" }));
                                      break;
                                    case "contact":
                                      setEditData((prev) => mergeQrMeta(prev, { type: "contact", source: "fields" }));
                                      break;
                                    case "phone":
                                      setEditData((prev) => mergeQrMeta(prev, { type: "phone", number: "" }));
                                      break;
                                    case "sms":
                                      setEditData((prev) => mergeQrMeta(prev, { type: "sms", number: "", message: "" }));
                                      break;
                                    case "wifi":
                                      setEditData((prev) => mergeQrMeta(prev, { type: "wifi", ssid: "", authenticationType: "", password: "" }));
                                      break;
                                    case "file":
                                      setEditData((prev) => mergeQrMeta(prev, { type: "file", key: "" }));
                                      break;
                                    default:
                                      setEditData(null);
                                  }
                                }}
                              >
                                <SelectTrigger id="content-type" className="w-full">
                                  <SelectValue placeholder="Select content type"/>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="url">
                                    <div className="flex items-center">
                                      <GlobeIcon className="mr-2 h-4 w-4" />
                                      Website
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="text">
                                    <div className="flex items-center">
                                      <TypeIcon className="mr-2 h-4 w-4" />
                                      Text
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="email">
                                    <div className="flex items-center">
                                      <MailIcon className="mr-2 h-4 w-4" />
                                      Email
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="contact">
                                    <div className="flex items-center">
                                      <UserIcon className="mr-2 h-4 w-4" />
                                      Contact
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="phone">
                                    <div className="flex items-center">
                                      <PhoneIcon className="mr-2 h-4 w-4" />
                                      Phone
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="sms">
                                    <div className="flex items-center">
                                      <MessageSquareIcon className="mr-2 h-4 w-4" />
                                      SMS
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="wifi">
                                    <div className="flex items-center">
                                      <WifiIcon className="mr-2 h-4 w-4" />
                                      WiFi
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="file">
                                    <div className="flex items-center">
                                      <FileIcon className="mr-2 h-4 w-4" />
                                      File
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Render inputs based on selected type */}
                            {editData?.type === "url" && (
                              <WebsiteInput
                                value={editData}
                                onChange={v => setEditData({ ...editData, ...v })}
                              />
                            )}
                            {editData?.type === "text" && (
                              <TextInput
                                value={editData?.text}
                                onChange={v => setEditData({ ...editData, text: v })}
                              />
                            )}
                            {editData?.type === "email" && (
                              <EmailInput
                                value={editData}
                                onChange={v => setEditData({ ...editData, ...v })}
                              />
                            )}
                            {editData?.type === "contact" && (
                              <ContactInput
                                value={editData}
                                onChange={v => setEditData((prev) => mergeQrMeta(prev, v))}
                              />
                            )}
                            {editData?.type === "phone" && (
                              <PhoneInput
                                value={editData}
                                onChange={v => setEditData({ ...editData, ...v })}
                              />
                            )}
                            {editData?.type === "sms" && (
                              <SmsInput
                                value={editData}
                                onChange={v => setEditData({ ...editData, ...v })}
                              />
                            )}
                            {editData?.type === "wifi" && (
                              <WifiInput
                                value={editData}
                                onChange={v => setEditData({ ...editData, ...v })}
                              />
                            )}
                            {editData?.type === "file" && (
                              <FileInput
                                onChange={file =>
                                  setEditData((prev) =>
                                    prev ? mergeQrMeta(prev, { type: "file", key: file?.name ?? "" }) : prev
                                  )
                                }
                              />
                            )}
                          </div>
                          </div>
                          <DialogFooter className={MODAL_FOOTER_CLASS_NAME}>
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdate} disabled={isUpdating}>
                              {isUpdating ? "Updating..." : "Update"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={deleteDialogOpen && editingQR?.id === qr.id}
                        onOpenChange={(open) => {
                          setDeleteDialogOpen(open)
                          if (!open) {
                            setEditingQR(null)
                            setEditCustomDomainId(null)
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingQR(qr)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="p-0 sm:max-w-md">
                          <DialogHeader className={MODAL_HEADER_CLASS_NAME}>
                            <DialogTitle>Delete QR Code</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete QR code: {editingQR?.code}? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className={MODAL_FOOTER_CLASS_NAME}>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                              {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
