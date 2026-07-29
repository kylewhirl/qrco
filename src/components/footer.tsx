import Link from "next/link";
import Logo from "@/assets/logo";

export default function Footer() {
  return (
    <footer className="bg-[#101829] text-white dark:bg-[#111b21]">
      <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-10 border-b border-white/25 pb-10 md:flex-row md:items-start md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="!size-6 text-white" />
            <span className="font-brand text-xl font-bold">the qr code co.</span>
          </Link>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm font-semibold sm:grid-cols-3">
            <Link href="/pricing" className="hover:text-[var(--brand-lime)]">Pricing</Link>
            <Link href="/retail-2d" className="hover:text-[var(--brand-lime)]">Retail 2D</Link>
            <Link href="/qr-migration" className="hover:text-[var(--brand-lime)]">Migration</Link>
            <Link href="/contact" className="hover:text-[var(--brand-lime)]">Contact</Link>
            <Link href="/terms" className="hover:text-[var(--brand-lime)]">Terms</Link>
            <Link href="/privacy" className="hover:text-[var(--brand-lime)]">Privacy</Link>
            <Link href="https://docs.tqrco.de" className="hover:text-[var(--brand-lime)]">Docs</Link>
          </nav>
        </div>
        <div className="flex flex-col gap-2 pt-6 text-xs font-medium text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The QR Code Co. All rights reserved.</p>
          <p>Dynamic by design.</p>
        </div>
      </div>
    </footer>
  );
}
