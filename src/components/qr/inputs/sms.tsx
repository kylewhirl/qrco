"use client";

import { useState, } from "react";
import type { SMSData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

interface SmsInputProps {
  value?: SMSData;
  onChange?: (data: SMSData) => void;
}

export default function SmsInput({
  value,
  onChange,
}: SmsInputProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>(value?.number ?? "");
  const [text, setText] = useState<string>(value?.message ?? "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setText(v);
    onChange?.({ type: "sms", number: phoneNumber, message: v });
  };

  console.log("sms", phoneNumber, text);

  return (
    <div className="flex flex-col space-y-1">
      <Label htmlFor="phone-input">Phone Number</Label>
      <PhoneInput
        id="phone-input"
        value={phoneNumber}
        onChange={(v) => {
          setPhoneNumber(v);
          onChange?.({ type: "sms", number: v, message: text });
        }}
        defaultCountry="US"
        placeholder="Enter a phone number"
      />
      <Label htmlFor="qr-text">Message</Label>
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