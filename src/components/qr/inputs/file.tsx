"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileInputProps {
  value?: string | null;
  onChange?: (file: File | null) => void;
}

export default function FileInput({ onChange }: FileInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (onChange) onChange(file);
  };

  return (
    <div className="flex flex-col space-y-1">
      <Label htmlFor="qr-file">File</Label>
      <Input
        id="qr-file"
        type="file"
        onChange={handleChange}
      />
    </div>
  );
}