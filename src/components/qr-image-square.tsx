"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { QR } from "@/lib/types";

interface QRImageSquareProps {
  qr: Pick<QR, "id" | "code" | "data" | "imageUrl">;
  className?: string;
  editable?: boolean;
  onUploaded?: (qr: QR) => void;
}

export function QRImageSquare({ qr, className, editable = false, onUploaded }: QRImageSquareProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const imageUrl = qr.imageUrl ?? null;
  const label = qr.data.name?.trim() || qr.code;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("qrId", qr.id);
      formData.append("purpose", "image");

      const response = await fetch(`/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to upload image");
      }

      const payload = await response.json() as { qr: QR };
      onUploaded?.(payload.qr);
      toast.success(imageUrl ? "Image updated" : "Image uploaded");
    } catch (error) {
      console.error("Failed to upload QR image:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }

  const content = (
    <>
      {imageUrl ? (
        // Signed storage URLs should render directly without Next image optimization.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={`${label} image`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_58%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(226,232,240,0.92))] text-slate-500">
          <QrCode className="h-5 w-5" />
        </div>
      )}

      {editable ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        </div>
      ) : null}
    </>
  );

  if (!editable) {
    return (
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-muted/30 shadow-sm",
          className,
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "group relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-muted/30 shadow-sm transition hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      onClick={() => inputRef.current?.click()}
      disabled={isUploading}
      aria-label={imageUrl ? `Update image for ${label}` : `Upload image for ${label}`}
    >
      {content}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
    </button>
  );
}
