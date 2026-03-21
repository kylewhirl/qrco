export function buildQrImageUrl(qrId: string, imageKey: string) {
  return `/api/qr/${qrId}/image?v=${encodeURIComponent(imageKey)}`;
}
