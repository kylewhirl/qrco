import Link from "next/link"
import { Phone } from "lucide-react"


export default function Footer() {

  return (
        <footer className="border-t bg-background">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
        <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} <span className="font-brand font-bold">the qr code co.</span> All rights reserved.
        </p>
          <nav className="flex gap-4 text-sm text-gray-500">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/contact" className="hover:underline">
              Contact
            </Link>
             <Link href="tel:+17753910058" className="hover:underline flex flex-col justify-center">
                <Phone className="w-3.5 h-3.5 hover:underline"/>
            </Link>
          </nav>
        </div>
      </footer>
    )
}