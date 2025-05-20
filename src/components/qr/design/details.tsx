

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function DetailsSettings({
  className,
}: {
  className?: string;
}) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);

  return (
    <Card className={`p-4${className ? ` ${className}` : ""}`}>
      <h3 className="text-lg font-medium">Details</h3>
      <div className="flex flex-col space-y-1">
        <Label htmlFor="qr-name">Name</Label>
        <Input
          id="qr-name"
          type="text"
          placeholder="Enter a name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col space-y-1">
        <Label htmlFor="qr-description">Description</Label>
        <Textarea
          id="qr-description"
          placeholder="Enter a description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex flex-col space-y-1">
        <Label htmlFor="qr-image">Upload Image</Label>
        <Input
          id="qr-image"
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
        {image && <p className="text-sm">Selected: {image.name}</p>}
      </div>
    </Card>
  );
}