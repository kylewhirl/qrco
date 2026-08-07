import { ProductWorkspace } from "@/components/dashboard/product-workspace";
import { getProductsForUser } from "@/lib/products";
import { stackServerApp } from "@/stack";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const user = await stackServerApp.getUser();
  const products = user ? await getProductsForUser(user.id) : [];

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-[-0.05em]">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage your product catalog.</p>
        </div>
      </div>
      <ProductWorkspace initialProducts={products} />
    </div>
  );
}
