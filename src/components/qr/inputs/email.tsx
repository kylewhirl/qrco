"use client";

import { useState, useEffect } from "react";
import type { EmailData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isValidEmail } from "@/lib/utils";

interface EmailInputProps {
  value?: EmailData;
  onChange?: (data: EmailData) => void;
}


export default function EmailInput({
  value,
  onChange,
}: EmailInputProps) {
  const [email, setEmail] = useState<string>(value?.to ?? "");
  const [subject, setSubject] = useState<string>(value?.subject ?? "");
  const [body, setBody] = useState<string>(value?.body ?? "");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (value) {
      setEmail(value.to);
      setSubject(value.subject);
      setBody(value.body);
    }
  }, [value]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setEmail(v);

    if (v === "" || isValidEmail(v)) {
      setError("");
    } else {
      setError("Please enter a valid email address");
    }

    onChange?.({ type: "email", to: v, subject, body });
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSubject(v);
    onChange?.({ type: "email", to: email, subject: v, body });
  };
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setBody(v);
    onChange?.({ type: "email", to: email, subject, body: v });
  };

  return (
    <>
      <div className="flex flex-col space-y-1">
        <Label htmlFor="qr-email">Recipient Email</Label>
        <Input
          id="qr-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={handleEmailChange}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <div className="flex flex-col space-y-1">
        <Label htmlFor="qr-subject">Subject</Label>
        <Input
          id="qr-subject"
          type="text"
          placeholder="Email subject"
          value={subject}
          onChange={handleSubjectChange}
        />
      </div>
      <div className="flex flex-col space-y-1">
        <Label htmlFor="qr-body">Body</Label>
        <Textarea
          id="qr-body"
          placeholder="Email body"
          value={body}
          onChange={handleBodyChange}
          rows={4}
        />
      </div>
    </>
  );
}