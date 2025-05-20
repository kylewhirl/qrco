"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { QR, QRData } from "@/lib/types"
import { formatDate, isValidURL, isValidEmail, isValidPhone } from "@/lib/utils"
import { Edit, Trash2, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"
import {
  GlobeIcon,
  TypeIcon,
  MailIcon,
  PhoneIcon,
  MessageSquareIcon,
  WifiIcon,
  FileIcon,
} from "lucide-react";
// And import your input subcomponents:
import WebsiteInput from "../qr/inputs/website";
import TextInput from "../qr/inputs/text";
import EmailInput from "../qr/inputs/email";
import PhoneInput from "../qr/inputs/phone";
import SmsInput from "../qr/inputs/sms";
import WifiInput from "../qr/inputs/wifi";
import FileInput from "../qr/inputs/file";


interface QRCodeListProps {
  qrCodes: QR[]
  onCreateQR: (data: { type: "url"; url: string }) => Promise<void>
  onUpdateQR: (id: string, data: QRData) => Promise<void>
  onDeleteQR: (id: string) => Promise<void>
}

export function QRCodeList({ qrCodes, onCreateQR, onUpdateQR, onDeleteQR }: QRCodeListProps) {
  const [newUrl, setNewUrl] = useState("")
  const [editingQR, setEditingQR] = useState<QR | null>(null)
  const [editData, setEditData] = useState<QRData | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  console.log("QR Codes:", editData)

  function ClientFormattedDate({ date }: { date: string | Date | null }) {
    const [formatted, setFormatted] = useState("")

    useEffect(() => {
      if (!date) {
        setFormatted("Never")
      } else {
        setFormatted(formatDate(date))
      }
    }, [date])

    return <span>{formatted}</span>
  }

  const handleCreate = async () => {
    if (!newUrl) {
      toast.error("URL is required")
      return
    }

    if (!isValidURL(newUrl)) {
      toast.error("Please enter a valid URL")
      return
    }

    setIsCreating(true)
    try {
      await onCreateQR({ type: "url", url: newUrl })
      setNewUrl("")
      setCreateDialogOpen(false)
      toast.success("QR code created successfully")
    } catch (error) {
      console.error("Error creating QR code:", error)
      toast.error("Failed to create QR code")
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingQR || !editData) return;

    // Type-specific validation
    switch (editData.type) {
      case "url":
        if (!editData.url || !isValidURL(editData.url)) {
          toast.error("Please enter a valid URL");
          return;
        }
        break;
      case "text":
        if (!editData.text) {
          toast.error("Text content cannot be empty");
          return;
        }
        break;
      case "email":
        if (
          !editData.to ||
          !editData.subject ||
          !editData.body ||
          !isValidEmail(editData.to)
        ) {
          toast.error("Please fill out valid email to, subject, and body");
          return;
        }
        break;
      case "phone":
        if (!editData.number || !isValidPhone(editData.number)) {
          toast.error("Please enter a valid phone number");
          return;
        }
        break;
      case "sms":
        if (!editData.number || !isValidPhone(editData.number)) {
          toast.error("Please enter a valid phone number");
          return;
        }
        break;
      case "wifi":
        if (!editData.ssid) {
          toast.error("SSID cannot be empty");
          return;
        }
        break;
      case "file":
        if (!editData.key) {
          toast.error("File key cannot be empty");
          return;
        }
        break;
      default:
        toast.error("Invalid content type");
        return;
    }

    setIsUpdating(true);
    try {
      await onUpdateQR(editingQR.id, editData);
      setEditingQR(null);
      setEditData(null);
      setEditDialogOpen(false);
      toast.success("QR code updated successfully");
    } catch (error) {
      console.error("Error updating QR code:", error);
      toast.error("Failed to update QR code");
    } finally {
      setIsUpdating(false);
    }
  }

  const handleDelete = async () => {
    if (!editingQR) return

    setIsDeleting(true)
    try {
      await onDeleteQR(editingQR.id)
      setEditingQR(null)
      setDeleteDialogOpen(false)
      toast.success("QR code deleted successfully")
    } catch (error) {
      console.error("Error deleting QR code:", error)
      toast.error("Failed to delete QR code")
    } finally {
      setIsDeleting(false)
    }
  }


  
  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>QR Codes</CardTitle>
          <CardDescription>Manage your QR codes</CardDescription>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Quick Create
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create QR Code</DialogTitle>
              <DialogDescription>Enter the URL for your new QR code.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="url">URL</label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Total Scans</TableHead>
              <TableHead>Last Scanned</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No QR codes found
                </TableCell>
              </TableRow>
            ) : (
              qrCodes.map((qr) => (
                <TableRow key={qr.id}>
                  <TableCell className="font-medium">{qr.data?.name ? qr.data.name : qr.code}</TableCell>
                  <TableCell><ClientFormattedDate date={qr.createdAt} /></TableCell>
                  <TableCell>{qr.totalScans}</TableCell>
                  <TableCell><ClientFormattedDate date={qr.lastScanned} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Dialog
                        open={editDialogOpen && editingQR?.id === qr.id}
                        onOpenChange={(open) => {
                          setEditDialogOpen(open)
                          if (!open) setEditingQR(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingQR(qr)
                              console.log("Editing QR:", qr)
                              setEditData(qr.data)
                              setEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit QR Code</DialogTitle>
                            <DialogDescription>
                              Update the data for QR code: {editingQR?.code}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <div className="space-y-1">
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                value={editData?.name ?? ""}
                                onChange={e =>
                                  setEditData((prev) =>
                                    prev ? { ...prev, name: e.target.value } : prev
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="desc">Description</Label>
                              <Textarea
                                id="desc"
                                value={editData?.description ?? ""}
                                onChange={e =>
                                  setEditData((prev) =>
                                    prev ? { ...prev, description: e.target.value } : prev
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="content-type">Content</Label>
                              <Select
                                value={editData?.type ?? ""}
                                onValueChange={value => {
                                  // Set initial values for each type to satisfy QRData
                                  switch (value as QRData['type']) {
                                    case "url":
                                      setEditData({ type: "url", url: "" });
                                      break;
                                    case "text":
                                      setEditData({ type: "text", text: "" });
                                      break;
                                    case "email":
                                      setEditData({ type: "email", to: "", subject: "", body: "" });
                                      break;
                                    case "phone":
                                      setEditData({ type: "phone", number: "" });
                                      break;
                                    case "sms":
                                      setEditData({ type: "sms", number: "", message: "" });
                                      break;
                                    case "wifi":
                                      setEditData({ type: "wifi", ssid: "", authenticationType: "", password: "" });
                                      break;
                                    case "file":
                                      setEditData({ type: "file", key: "" });
                                      break;
                                    default:
                                      setEditData(null);
                                  }
                                }}
                              >
                                <SelectTrigger id="content-type" className="w-full">
                                  <SelectValue placeholder="Select content type"/>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="url">
                                    <div className="flex items-center">
                                      <GlobeIcon className="mr-2 h-4 w-4" />
                                      Website
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="text">
                                    <div className="flex items-center">
                                      <TypeIcon className="mr-2 h-4 w-4" />
                                      Text
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="email">
                                    <div className="flex items-center">
                                      <MailIcon className="mr-2 h-4 w-4" />
                                      Email
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="phone">
                                    <div className="flex items-center">
                                      <PhoneIcon className="mr-2 h-4 w-4" />
                                      Phone
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="sms">
                                    <div className="flex items-center">
                                      <MessageSquareIcon className="mr-2 h-4 w-4" />
                                      SMS
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="wifi">
                                    <div className="flex items-center">
                                      <WifiIcon className="mr-2 h-4 w-4" />
                                      WiFi
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="file">
                                    <div className="flex items-center">
                                      <FileIcon className="mr-2 h-4 w-4" />
                                      File
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Render inputs based on selected type */}
                            {editData?.type === "url" && (
                              <WebsiteInput
                                value={editData}
                                onChange={v => setEditData({ ...editData, ...v })}
                              />
                            )}
                            {editData?.type === "text" && (
                              <TextInput
                                value={editData?.text}
                                onChange={v => setEditData({ ...editData, text: v })}
                              />
                            )}
                            {editData?.type === "email" && (
                              <EmailInput
                                value={editData}
                                onChange={v => setEditData({ ...editData, ...v })}
                              />
                            )}
                            {editData?.type === "phone" && (
                              <PhoneInput
                                value={editData}
                                onChange={v => setEditData({ ...editData, ...v })}
                              />
                            )}
                            {editData?.type === "sms" && (
                              <SmsInput
                                value={editData}
                                onChange={v => setEditData({ ...editData, ...v })}
                              />
                            )}
                            {editData?.type === "wifi" && (
                              <WifiInput
                                value={editData}
                                onChange={v => setEditData({ ...editData, ...v })}
                              />
                            )}
                            {editData?.type === "file" && (
                              <FileInput
                                onChange={v =>
                                  setEditData({
                                    ...editData,
                                    ...v,
                                    type: "file"
                                  })
                                }
                              />
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdate} disabled={isUpdating}>
                              {isUpdating ? "Updating..." : "Update"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog
                        open={deleteDialogOpen && editingQR?.id === qr.id}
                        onOpenChange={(open) => {
                          setDeleteDialogOpen(open)
                          if (!open) setEditingQR(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingQR(qr)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete QR Code</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete QR code: {editingQR?.code}? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                              {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
