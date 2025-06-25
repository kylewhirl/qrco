import { StackServerApp } from "@stackframe/stack";
import CustomDomainForm from "@/components/custom-domain-form";

export default async function SettingsPage() {
  const stack = new StackServerApp({
    tokenStore: "nextjs-cookie",
    urls: { signIn: "/login" },
  });
  const user = await stack.getUser();
  const meta = user?.serverMetadata || {};
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <CustomDomainForm initialDomain={meta.customDomain ?? ""} verified={!!meta.customDomainVerified} />
    </div>
  );
}
