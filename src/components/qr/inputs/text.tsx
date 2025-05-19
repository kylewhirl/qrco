"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextInputProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function TextInput({
  value = "",
  onChange,
}: TextInputProps) {
  const [text, setText] = useState<string>(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setText(v);
    if (onChange) onChange(v);
  };

  return (
    <div className="flex flex-col space-y-1">
      <Label htmlFor="qr-text">Text</Label>
      <Input
        id="qr-text"
        type="text"
        placeholder="Your text here"
        value={text}
        onChange={handleChange}
      />
    </div>
  );
}