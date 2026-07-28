import { StylesStudio } from "@/components/dashboard/styles-studio";

export default function DashboardStylesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Brand System</p>
        <h1 className="text-3xl tracking-tight md:text-4xl">Styles</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Build reusable QR treatments and set the live defaults used across your codes.
        </p>
      </section>
      <StylesStudio />
    </div>
  );
}
