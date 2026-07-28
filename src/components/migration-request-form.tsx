"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SubmitState = "idle" | "submitting" | "success" | "error";

const providerOptions = [
  "QRCodeKIT",
  "QR Code Generator / qrco.de",
  "QRCodeChimp",
  "Hovercode",
  "QRFY",
  "QR Tiger",
  "Not sure",
  "Other",
];

const qrVolumeOptions = ["1-5", "6-25", "26-100", "100+"];

export function MigrationRequestForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState("");
  const [qrCount, setQrCount] = useState("");
  const [customDomain, setCustomDomain] = useState("");

  const disabled = state === "submitting" || state === "success";

  const statusMessage = useMemo(() => {
    if (state === "success") {
      return "Request received. We will review the QR link and follow up with a migration readout.";
    }

    if (state === "error") {
      return message || "Something went wrong. Please try again.";
    }

    return "We will only use this to review your QR setup and reply about the migration audit.";
  }, [message, state]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      company: String(formData.get("company") ?? ""),
      provider,
      qrUrl: String(formData.get("qrUrl") ?? ""),
      qrCount,
      customDomain,
      notes: String(formData.get("notes") ?? ""),
    };

    try {
      const response = await fetch("/api/migration-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Request failed");
      }

      setState("success");
      event.currentTarget.reset();
      setProvider("");
      setQrCount("");
      setCustomDomain("");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-background p-5 shadow-sm sm:p-6"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Request a free migration audit</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Send one QR link and enough context for a safe first-pass review.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="migration-name">Name</Label>
          <Input id="migration-name" name="name" autoComplete="name" required disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="migration-email">Work email</Label>
          <Input
            id="migration-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={disabled}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="migration-company">Company</Label>
          <Input id="migration-company" name="company" autoComplete="organization" required disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Current provider</Label>
          <Select value={provider} onValueChange={setProvider} required disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {providerOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="migration-qr-url">One QR link to review</Label>
        <Input
          id="migration-qr-url"
          name="qrUrl"
          type="url"
          inputMode="url"
          placeholder="https://qrco.de/..."
          required
          disabled={disabled}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Number of QR codes</Label>
          <Select value={qrCount} onValueChange={setQrCount} required disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {qrVolumeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Using a custom QR domain?</Label>
          <Select value={customDomain} onValueChange={setCustomDomain} required disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select one" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="not_sure">Not sure</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="migration-notes">Anything printed or time-sensitive?</Label>
        <Textarea
          id="migration-notes"
          name="notes"
          className="min-h-24 resize-none"
          placeholder="Menus, signage, flyers, packaging, event materials, or launch timing."
          disabled={disabled}
        />
      </div>

      <Button type="submit" className="mt-5 h-11 w-full rounded-lg" disabled={disabled}>
        {state === "submitting" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending request
          </>
        ) : state === "success" ? (
          <>
            <CheckCircle2 className="size-4" />
            Request received
          </>
        ) : (
          <>
            Request migration audit
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>

      <p
        className={`mt-3 text-sm leading-6 ${
          state === "error" ? "text-destructive" : "text-muted-foreground"
        }`}
        role={state === "error" ? "alert" : "status"}
      >
        {statusMessage}
      </p>
    </form>
  );
}
