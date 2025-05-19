"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidURL } from "@/lib/utils";
import type { URLData } from "@/lib/types";

interface WebsiteInputProps {
  value?: URLData;
  onChange?: (data: URLData) => void;
}

export default function WebsiteInput({
  value,
  onChange,
}: WebsiteInputProps) {
  const [url, setUrl] = useState<string>(value?.url ?? "");
  useEffect(() => {
    if (value) setUrl(value.url);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setUrl(v);
    onChange?.({ type: "url", url: v });

    if (v === "" || isValidURL(v)) {
      setError("");
    } else {
      setError("Please enter a valid URL");
    }
  };

  const [error, setError] = useState<string>("");

  return (
    <div className="flex flex-col space-y-1">
      <Label htmlFor="qr-website-url">Website URL</Label>
      <Input
        id="qr-website-url"
        type="url"
        placeholder="https://example.com"
        value={url}
        onChange={handleChange}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}