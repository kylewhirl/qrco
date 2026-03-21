"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import type { ContactData, ContactFieldsData, ContactVCardData } from "@/lib/types";

interface ContactInputProps {
  value?: ContactData;
  onChange?: (value: ContactData) => void;
}

interface ContactFieldsDraft {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  note: string;
}

const EMPTY_FIELDS: ContactFieldsDraft = {
  firstName: "",
  lastName: "",
  organization: "",
  title: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  note: "",
};

function toOptionalValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toFieldsDraft(value?: ContactData): ContactFieldsDraft {
  if (!value || value.source !== "fields") {
    return EMPTY_FIELDS;
  }

  return {
    firstName: value.firstName ?? "",
    lastName: value.lastName ?? "",
    organization: value.organization ?? "",
    title: value.title ?? "",
    phone: value.phone ?? "",
    email: value.email ?? "",
    website: value.website ?? "",
    address: value.address ?? "",
    note: value.note ?? "",
  };
}

function toContactFieldsData(draft: ContactFieldsDraft): ContactFieldsData {
  return {
    type: "contact",
    source: "fields",
    firstName: toOptionalValue(draft.firstName),
    lastName: toOptionalValue(draft.lastName),
    organization: toOptionalValue(draft.organization),
    title: toOptionalValue(draft.title),
    phone: toOptionalValue(draft.phone),
    email: toOptionalValue(draft.email),
    website: toOptionalValue(draft.website),
    address: toOptionalValue(draft.address),
    note: toOptionalValue(draft.note),
  };
}

function toVCardData(value?: ContactData): ContactVCardData {
  if (!value || value.source !== "vcard") {
    return {
      type: "contact",
      source: "vcard",
      vcard: "",
      fileName: undefined,
    };
  }

  return {
    type: "contact",
    source: "vcard",
    vcard: value.vcard,
    fileName: value.fileName ?? undefined,
  };
}

export default function ContactInput({ value, onChange }: ContactInputProps) {
  const [mode, setMode] = useState<ContactData["source"]>(value?.source ?? "fields");
  const [fields, setFields] = useState<ContactFieldsDraft>(toFieldsDraft(value));
  const [vcardData, setVcardData] = useState<ContactVCardData>(toVCardData(value));
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setMode(value?.source ?? "fields");
    setFields(toFieldsDraft(value));
    setVcardData(toVCardData(value));
    setError("");
  }, [value]);

  function updateFields(next: Partial<ContactFieldsDraft>) {
    const updated = { ...fields, ...next };
    setFields(updated);
    setMode("fields");
    onChange?.(toContactFieldsData(updated));
  }

  function updateVCard(next: ContactVCardData) {
    setVcardData(next);
    setMode("vcard");
    onChange?.(next);
  }

  async function handleVCardUpload(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".vcf")) {
      setError("Only .vcf files are supported for contact QR codes.");
      return;
    }

    const rawText = await file.text();
    if (!/BEGIN:VCARD/i.test(rawText) || !/END:VCARD/i.test(rawText)) {
      setError("The uploaded file does not contain a valid VCARD payload.");
      return;
    }

    setError("");
    updateVCard({
      type: "contact",
      source: "vcard",
      vcard: rawText,
      fileName: file.name,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Contact Source</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={mode === "fields" ? "default" : "outline"}
            onClick={() => {
              setMode("fields");
              setError("");
              onChange?.(toContactFieldsData(fields));
            }}
          >
            Enter details
          </Button>
          <Button
            type="button"
            variant={mode === "vcard" ? "default" : "outline"}
            onClick={() => {
              setMode("vcard");
              setError("");
              if (vcardData.vcard.trim()) {
                onChange?.(vcardData);
              }
            }}
          >
            Upload .vcf
          </Button>
        </div>
      </div>

      {mode === "fields" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="contact-first-name">First name</Label>
            <Input
              id="contact-first-name"
              value={fields.firstName}
              onChange={(event) => updateFields({ firstName: event.target.value })}
              placeholder="Ada"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-last-name">Last name</Label>
            <Input
              id="contact-last-name"
              value={fields.lastName}
              onChange={(event) => updateFields({ lastName: event.target.value })}
              placeholder="Lovelace"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-organization">Company</Label>
            <Input
              id="contact-organization"
              value={fields.organization}
              onChange={(event) => updateFields({ organization: event.target.value })}
              placeholder="Analytical Engines"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-title">Job title</Label>
            <Input
              id="contact-title"
              value={fields.title}
              onChange={(event) => updateFields({ title: event.target.value })}
              placeholder="Director"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="contact-phone">Phone number</Label>
            <PhoneInput
              id="contact-phone"
              value={fields.phone}
              onChange={(value) => updateFields({ phone: value ?? "" })}
              defaultCountry="US"
              placeholder="Enter a phone number"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={fields.email}
              onChange={(event) => updateFields({ email: event.target.value })}
              placeholder="ada@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-website">Website</Label>
            <Input
              id="contact-website"
              type="url"
              value={fields.website}
              onChange={(event) => updateFields({ website: event.target.value })}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="contact-address">Address</Label>
            <Textarea
              id="contact-address"
              value={fields.address}
              onChange={(event) => updateFields({ address: event.target.value })}
              placeholder="123 Main St, San Francisco, CA 94105"
              rows={3}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="contact-note">Note</Label>
            <Textarea
              id="contact-note"
              value={fields.note}
              onChange={(event) => updateFields({ note: event.target.value })}
              placeholder="Optional contact note"
              rows={3}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="contact-vcard-file">VCF file</Label>
            <Input
              id="contact-vcard-file"
              type="file"
              accept=".vcf,text/vcard"
              onChange={(event) => {
                void handleVCardUpload(event.target.files?.[0] ?? null);
              }}
            />
            {vcardData.fileName ? (
              <p className="text-sm text-muted-foreground">Loaded file: {vcardData.fileName}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-vcard-text">VCARD payload</Label>
            <Textarea
              id="contact-vcard-text"
              value={vcardData.vcard}
              onChange={(event) => {
                setError("");
                updateVCard({
                  ...vcardData,
                  vcard: event.target.value,
                });
              }}
              placeholder={"BEGIN:VCARD\nVERSION:3.0\nFN:Ada Lovelace\nEND:VCARD"}
              rows={10}
            />
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
