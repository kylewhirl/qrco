import Link from "next/link"


export default function Footer() {

  return (
        <footer className="border-t bg-background">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
        <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} <span className="font-brand font-bold">the qr code co.</span> All rights reserved.
        </p>
          <nav className="flex gap-4 text-sm text-gray-500">
            <Link href="#" className="hover:underline">
              Terms
            </Link>
            <Link href="#" className="hover:underline">
              Privacy
            </Link>
            <Link href="#" className="hover:underline">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    )
}