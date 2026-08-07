import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Globe2,
  Package,
  QrCode,
  ScanBarcode,
  Smartphone,
  Store,
  Terminal,
  Upload,
} from "lucide-react";

function QrMark({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-white p-2 ${className}`}>
      <div className="aspect-square rounded-[3px] bg-[repeating-conic-gradient(#111827_0_25%,#fff_0_50%)] bg-[length:14px_14px]" />
      <span className="absolute left-3 top-3 size-5 rounded-[3px] border-[5px] border-white bg-[#111827]" />
      <span className="absolute right-3 top-3 size-5 rounded-[3px] border-[5px] border-white bg-[#111827]" />
      <span className="absolute bottom-3 left-3 size-5 rounded-[3px] border-[5px] border-white bg-[#111827]" />
    </div>
  );
}

function LinearBarcode({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="h-12 bg-[repeating-linear-gradient(90deg,#111827_0,#111827_2px,transparent_2px,transparent_5px,#111827_5px,#111827_8px,transparent_8px,transparent_11px)]" />
      <p className="mt-1 text-center font-mono text-[9px] tracking-[0.16em] text-[#111827]/70">0 950600 013435</p>
    </div>
  );
}

export function ProductPackage({ className = "" }: { className?: string }) {
  return (
    <div className={`relative rounded-[1.5rem] bg-[#f8f1e4] p-5 text-[#172033] shadow-[0_36px_80px_-48px_#071024] sm:p-6 ${className}`}>
      <div className="absolute right-5 top-5 rounded-full border border-[#172033]/15 px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-[0.16em]">sparkling water</div>
      <div className="max-w-[210px] pt-7">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#1756e8]">Meyer Lemon</p>
        <h3 className="mt-2 font-display text-4xl leading-[0.86] tracking-[-0.06em]">Bright<br />by nature.</h3>
        <p className="mt-4 text-[11px] font-bold leading-5 text-[#172033]/60">Sparkling water with a clean, citrus finish.</p>
      </div>
      <div className="mt-10 grid grid-cols-[1fr_74px] items-end gap-4 border-t border-[#172033]/12 pt-4">
        <LinearBarcode />
        <div><QrMark className="w-full" /><p className="mt-1 text-center text-[7px] font-extrabold uppercase tracking-[0.1em]">2D ready</p></div>
      </div>
    </div>
  );
}

export function TransitionHeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[590px]">
      <div className="absolute -inset-8 rounded-full bg-[#1756e8]/20 blur-[90px]" />
      <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.07] p-4 shadow-[0_40px_100px_-60px_#000] backdrop-blur sm:p-5">
        <div className="mb-4 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/50"><span>One package</span><span className="inline-flex items-center gap-1.5 text-[#c8f33d]"><CheckCircle2 className="size-3.5" />Transition ready</span></div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px] lg:items-center">
          <div className="rounded-[1.5rem] bg-[#dfe8f5] p-4 sm:p-5"><ProductPackage /></div>
          <div className="space-y-2">
            <div className="rounded-2xl border border-white/12 bg-[#071024]/55 p-4"><div className="flex items-center gap-2 text-xs font-bold text-white"><ScanBarcode className="size-4 text-[#c8f33d]" />At checkout</div><p className="mt-3 font-mono text-2xl font-bold text-[#c8f33d]">GTIN</p><p className="mt-1 text-[11px] leading-5 text-white/50">Identifier read locally by a compatible retail system.</p></div>
            <div className="rounded-2xl border border-white/12 bg-[#071024]/55 p-4"><div className="flex items-center gap-2 text-xs font-bold text-white"><Smartphone className="size-4 text-[#c8f33d]" />On a phone</div><p className="mt-3 font-mono text-2xl font-bold text-[#c8f33d]">Experience</p><p className="mt-1 text-[11px] leading-5 text-white/50">The same code opens live product content.</p></div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45"><span className="h-px w-8 bg-white/20" />UPC stays during the transition<span className="h-px w-8 bg-white/20" /></div>
      </div>
    </div>
  );
}

export function CatalogImportVisual() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#101a2d] p-5 text-white shadow-[0_34px_90px_-54px_#101a2d] sm:p-7">
      <div className="absolute -right-24 -top-24 size-64 rounded-full bg-[#1756e8]/35 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between"><div className="inline-flex items-center gap-2 text-xs font-bold"><FileSpreadsheet className="size-4 text-[#c8f33d]" />products.xlsx</div><span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white/60">Import</span></div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
          <div className="grid grid-cols-[1.3fr_1fr_0.7fr] border-b border-white/10 px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/40"><span>Product</span><span>UPC / GTIN</span><span>Status</span></div>
          {["Meyer Lemon Water", "Oat Milk 1 L", "Organic Honey"].map((item, index) => <div key={item} className="grid grid-cols-[1.3fr_1fr_0.7fr] items-center border-b border-white/8 px-4 py-3 text-[11px] last:border-0"><span className="truncate font-semibold">{item}</span><span className="font-mono text-white/55">{index === 0 ? "095060..." : index === 1 ? "008500..." : "000123..."}</span><span className="inline-flex items-center gap-1.5 text-[#c8f33d]"><Check className="size-3" />Ready</span></div>)}
        </div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="font-display text-5xl leading-none tracking-[-0.08em]">1,241</p><p className="mt-2 text-xs font-bold text-white/50">GTINs ready</p></div><div className="rounded-2xl border border-[#ffbd69]/30 bg-[#ffbd69]/10 px-4 py-3"><p className="font-display text-3xl leading-none text-[#ffbd69]">6</p><p className="mt-1 text-[10px] font-bold text-[#ffbd69]/70">need attention</p></div></div>
      </div>
    </div>
  );
}

export function StoreReadinessVisual() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#101a2d] p-5 text-white shadow-[0_34px_90px_-54px_#101a2d] sm:p-7">
      <div className="absolute bottom-0 right-0 h-1/2 w-2/3 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_13px,rgba(255,255,255,.05)_13px,rgba(255,255,255,.05)_16px)]" />
      <div className="relative"><div className="flex items-center justify-between"><div className="inline-flex items-center gap-2 text-xs font-bold"><Store className="size-4 text-[#c8f33d]" />Store readiness</div><span className="rounded-full bg-[#c8f33d] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#263600]">Pilot</span></div><div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Stores", "12"], ["Checkout lanes", "84"], ["Scanners", "156"], ["Self checkout", "28"]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"><p className="font-display text-3xl tracking-[-0.06em]">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">{label}</p></div>)}</div><div className="mt-4 rounded-2xl border border-white/10 bg-[#071024]/60 p-4"><div className="flex items-center justify-between text-xs font-bold"><span className="inline-flex items-center gap-2"><Terminal className="size-4 text-[#c8f33d]" />2D rollout readiness</span><span className="text-[#c8f33d]">72%</span></div><div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-[#c8f33d]" /></div><div className="mt-3 grid grid-cols-3 gap-2 text-center text-[9px] font-bold text-white/45"><span>Scanner</span><span>POS</span><span>Store test</span></div></div></div>
    </div>
  );
}

export function OneCodeJobs() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
      <div className="rounded-[1.5rem] border bg-card p-6 shadow-[0_24px_60px_-50px_var(--brand-shadow)]"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#101a2d] text-[#c8f33d]"><ScanBarcode className="size-5" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">At checkout</p><h3 className="mt-1 text-xl font-extrabold tracking-[-0.04em]">QR → GTIN → POS</h3></div></div><p className="mt-6 text-sm leading-6 text-muted-foreground">A compatible scanner can extract the product identifier directly from the symbol without depending on a web redirect.</p></div>
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--brand-lime)] text-[#263600] shadow-[0_12px_30px_-16px_var(--brand-shadow)]"><QrCode className="size-7" /></div>
      <div className="rounded-[1.5rem] border bg-card p-6 shadow-[0_24px_60px_-50px_var(--brand-shadow)]"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--brand-blue)_10%,var(--card))] text-[var(--brand-blue)]"><Smartphone className="size-5" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">On a phone</p><h3 className="mt-1 text-xl font-extrabold tracking-[-0.04em]">QR → Digital Link → Experience</h3></div></div><p className="mt-6 text-sm leading-6 text-muted-foreground">The same printed identity can open the product content a shopper needs today—and update tomorrow.</p></div>
    </div>
  );
}

export function DomainComparison() {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <div className="rounded-2xl border bg-muted/40 p-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">Generic QR infrastructure</p><p className="mt-3 break-all font-mono text-lg font-bold text-foreground/50">tqrco.de/abC827</p><p className="mt-2 text-xs text-muted-foreground">Short and disposable.</p></div>
      <ArrowRight className="mx-auto hidden size-5 text-[var(--brand-blue)] md:block" />
      <ArrowDown className="mx-auto size-5 text-[var(--brand-blue)] md:hidden" />
      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--brand-blue)_30%,var(--border))] bg-[color-mix(in_srgb,var(--brand-blue)_6%,var(--card))] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--brand-blue)]">Brand-owned product identity</p><p className="mt-3 break-all font-mono text-lg font-bold text-foreground">id.acme.com/01/00012345678905</p><p className="mt-2 text-xs text-muted-foreground">Persistent and recognizable on packaging.</p></div>
    </div>
  );
}

export function ProductExperienceVisual() {
  return (
    <div className="relative mx-auto max-w-[460px] rounded-[2rem] bg-[#101a2d] p-4 shadow-[0_34px_90px_-54px_#101a2d] sm:p-5"><div className="mx-auto max-w-[310px] overflow-hidden rounded-[1.5rem] border-[7px] border-[#202b42] bg-[#f8fbff] text-[#172033] shadow-xl"><div className="h-8 bg-[#e8eef8] px-4 py-2"><div className="h-2 w-20 rounded-full bg-[#b8c5dc]" /></div><div className="p-5"><p className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-[#1756e8]">Product information</p><h3 className="mt-2 text-2xl font-extrabold leading-none tracking-[-0.05em]">Meyer Lemon<br />Sparkling Water</h3><div className="mt-5 grid grid-cols-2 gap-2">{["Nutrition", "Ingredients", "Allergens", "Origin", "Recycling", "Recipes"].map((item) => <div key={item} className="rounded-xl border bg-white px-3 py-3 text-[10px] font-bold">{item}<ArrowRight className="mt-2 size-3 text-[#1756e8]" /></div>)}</div></div></div><div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55"><Globe2 className="size-3.5 text-[#c8f33d]" />Live product experience</div></div>
  );
}

export function PackagingReadinessVisual() {
  const checks = [["GTIN", "Validated", true], ["Digital Link", "Valid", true], ["Brand domain", "Configured", true], ["Destination", "Available", true], ["QR asset", "Generated", true], ["Physical verification", "Still required", false]] as const;
  return <div className="rounded-[2rem] border bg-card p-5 shadow-[0_28px_70px_-54px_var(--brand-shadow)] sm:p-7"><div className="flex items-center justify-between border-b pb-4"><div className="inline-flex items-center gap-2 text-sm font-extrabold"><Package className="size-4 text-[var(--brand-blue)]" />Packaging preflight</div><span className="rounded-full bg-[#fff3df] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9a5a00]">Before print</span></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{checks.map(([label, detail, complete]) => <div key={label} className="flex items-center justify-between rounded-xl border bg-background/70 px-4 py-3"><span className="text-sm font-semibold">{label}</span><span className={`inline-flex items-center gap-1.5 text-xs font-bold ${complete ? "text-emerald-600" : "text-[#9a5a00]"}`}>{complete ? <Check className="size-3.5" /> : <AlertTriangle className="size-3.5" />}{detail}</span></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Software checks reduce preventable setup errors. They do not replace physical barcode verification or ISO quality testing.</p></div>;
}

export function CheckoutTestingVisual() {
  const tests = [["UPC only", "Pass", true], ["2D only", "Pass", true], ["UPC + 2D", "One item", true], ["Self checkout", "Pass", true]] as const;
  return <div className="rounded-[2rem] bg-[#101a2d] p-5 text-white shadow-[0_34px_90px_-54px_#101a2d] sm:p-7"><div className="flex items-center justify-between"><div className="inline-flex items-center gap-2 text-sm font-extrabold"><ScanBarcode className="size-4 text-[#c8f33d]" />Checkout test run</div><span className="rounded-full bg-[#c8f33d] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#263600]">Ready to document</span></div><div className="mt-5 space-y-2">{tests.map(([label, detail]) => <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3"><span className="text-sm font-semibold">{label}</span><span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c8f33d]"><CheckCircle2 className="size-3.5" />{detail}</span></div>)}</div><p className="mt-5 text-xs leading-5 text-white/55">During coexistence, the important test is that a package carrying both symbols still becomes one item at checkout.</p></div>;
}

export function PrivateLabelFlowVisual() {
  return <div className="rounded-[2rem] border bg-card p-5 shadow-[0_28px_70px_-54px_var(--brand-shadow)] sm:p-7"><div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center"><div className="rounded-2xl bg-[#f8f1e4] p-4 text-[#172033]"><Package className="size-5 text-[#1756e8]" /><p className="mt-6 text-sm font-extrabold">Private-label product</p><p className="mt-1 text-xs text-[#172033]/60">You control the catalog.</p></div><ArrowRight className="mx-auto hidden size-5 text-[var(--brand-blue)] sm:block" /><ArrowDown className="mx-auto size-5 text-[var(--brand-blue)] sm:hidden" /><div className="rounded-2xl bg-[#101a2d] p-4 text-white"><QrCode className="size-5 text-[#c8f33d]" /><p className="mt-6 text-sm font-extrabold">Digital Link</p><p className="mt-1 text-xs text-white/55">Identity and content.</p></div><ArrowRight className="mx-auto hidden size-5 text-[var(--brand-blue)] sm:block" /><ArrowDown className="mx-auto size-5 text-[var(--brand-blue)] sm:hidden" /><div className="rounded-2xl border bg-background p-4"><Store className="size-5 text-[var(--brand-blue)]" /><p className="mt-6 text-sm font-extrabold">Your checkout</p><p className="mt-1 text-xs text-muted-foreground">Test before rollout.</p></div></div></div>;
}

export function CatalogToPackageSteps() {
  const steps = [
    ["Bring your catalog", "Upload the spreadsheet you already use.", FileSpreadsheet],
    ["Validate the identifiers", "Work with the GTINs your products already have.", CheckCircle2],
    ["Create product identities", "Use a permanent, brand-ready Digital Link.", Globe2],
    ["Generate the 2D barcode", "Create a QR asset for the next packaging run.", QrCode],
    ["Control the experience", "Connect an existing site or host structured content.", Smartphone],
    ["Prepare for rollout", "Review digital setup before packaging and retail deployment.", Upload],
  ] as const;
  return <div className="grid gap-3">{steps.map(([title, detail, Icon], index) => <div key={title} className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-[48px_180px_minmax(0,1fr)] sm:items-center"><span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-lime)] text-sm font-extrabold text-[#263600]">{String(index + 1).padStart(2, "0")}</span><div className="flex items-center gap-2 text-sm font-extrabold"><Icon className="size-4 text-[var(--brand-blue)]" />{title}</div><p className="text-sm leading-6 text-muted-foreground">{detail}</p></div>)}</div>;
}
