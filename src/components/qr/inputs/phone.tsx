"use client";

import { useState, useEffect } from "react";
import type { PhoneData } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { PhoneInput as PhoneNumberInput } from "@/components/ui/phone-input";

interface PhoneInputProps {
  value?: PhoneData;
  onChange?: (data: PhoneData) => void;
}

export default function PhoneInput({
  value,
  onChange,
}: PhoneInputProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>(value?.number ?? "");

  useEffect(() => {
    if (value) setPhoneNumber(value.number);
  }, [value]);

  return (
    <div className="flex flex-col space-y-1">
      <Label htmlFor="phone-input">Phone Number</Label>
      <PhoneNumberInput
        id="phone-input"
        value={phoneNumber}
        onChange={(v) => {
          setPhoneNumber(v);
          onChange?.({ type: "phone", number: v });
        }}
        defaultCountry="US"
        placeholder="Enter a phone number"
      />
    </div>
  );
}