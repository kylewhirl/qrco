"use client";

import { useState } from "react"
import type { QR, QRData } from "@/lib/types"
import { QRCodeList } from "@/components/dashboard/qr-code-list"

interface DashboardClientProps {
  initialQRCodes: QR[]
}

export function DashboardClient({ initialQRCodes }: DashboardClientProps) {
  const [qrCodes, setQRCodes] = useState<QR[]>(initialQRCodes)

  const handleCreateQR = async (data: { type: "url"; url: string }) => {
    try {
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create QR code")
      }

      const newQR = await response.json()
      setQRCodes([newQR, ...qrCodes])
    } catch (error) {
      console.error("Error creating QR code:", error)
      throw error
    }
  }

  const handleUpdateQR = async (id: string, data: QRData,) => {
    try {
      const response = await fetch(`/api/qr/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update QR code")
      }

      const updatedQR = await response.json()
      setQRCodes(qrCodes.map((qr) => (qr.id === id ? updatedQR : qr)))
      // No return value needed for Promise<void>
    } catch (error) {
      console.error("Error updating QR code:", error)
      throw error
    }
  }

  const handleDeleteQR = async (id: string) => {
    try {
      const response = await fetch(`/api/qr/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete QR code")
      }

      setQRCodes(qrCodes.filter((qr) => qr.id !== id))
      // No return value needed for Promise<void>
    } catch (error) {
      console.error("Error deleting QR code:", error)
      throw error
    }
  }

  return (
    <QRCodeList qrCodes={qrCodes} onCreateQR={handleCreateQR} onUpdateQR={handleUpdateQR} onDeleteQR={handleDeleteQR} />
  )
}
