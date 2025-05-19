"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { WiFiData } from "@/lib/types";

interface WifiInputProps {
  value: WiFiData;
  onChange?: (data: WiFiData) => void;
}

export default function WifiInput({
  value,
  onChange,
}: WifiInputProps) {
  const { ssid: initialSsid, password: initialPassword, authenticationType: initialEncryption, hidden: initialHidden } = value;
  const [ssid, setSsid] = useState(initialSsid);
  const [password, setPassword] = useState(initialPassword);
  const [encryption, setEncryption] = useState<WiFiData["authenticationType"]>(initialEncryption);
  const [hidden, setHidden] = useState(initialHidden);

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1">
        <Label htmlFor="wifi-ssid">SSID</Label>
        <Input
          id="wifi-ssid"
          type="text"
          placeholder="Network name"
          value={ssid}
          onChange={e => {
            const newSsid = e.target.value;
            setSsid(newSsid);
            onChange?.({ type: "wifi", ssid: newSsid, authenticationType: encryption, password: encryption !== "nopass" ? password : undefined, hidden: hidden || undefined });
          }}
        />
      </div>

      <div className="flex flex-col space-y-1">
        <Label htmlFor="wifi-encryption">Encryption</Label>
        <Select value={encryption} onValueChange={(value: "WPA" | "WEP" | "nopass") => {
          setEncryption(value);
          onChange?.({ type: "wifi", ssid, authenticationType: value, password: value !== "nopass" ? password : undefined, hidden: hidden || undefined });
        }}>
          <SelectTrigger id="wifi-encryption">
            <SelectValue placeholder="Select encryption" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WPA">WPA/WPA2</SelectItem>
            <SelectItem value="WEP">WEP</SelectItem>
            <SelectItem value="nopass">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {encryption !== "nopass" && (
        <div className="flex flex-col space-y-1">
          <Label htmlFor="wifi-password">Password</Label>
          <Input
            id="wifi-password"
            type="password"
            placeholder="Network password"
            value={password}
            onChange={e => {
              const newPass = e.target.value;
              setPassword(newPass);
              onChange?.({ type: "wifi", ssid, authenticationType: encryption, password: newPass, hidden: hidden || undefined });
            }}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="wifi-hidden"
          checked={hidden}
          onCheckedChange={checked => {
            const isHidden = !!checked;
            setHidden(isHidden);
            onChange?.({ type: "wifi", ssid, authenticationType: encryption, password: encryption !== "nopass" ? password : undefined, hidden: isHidden });
          }}
        />
        <Label htmlFor="wifi-hidden">Hidden network</Label>
      </div>
    </div>
  );
}