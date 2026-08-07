import { notFound, redirect } from "next/navigation";

import { ProductDetailClient } from "@/components/dashboard/product-detail-client";
import { getBrandProfileForUser } from "@/lib/brand-styles";
import { getProductByIdForUser } from "@/lib/products";
import { stackServerApp } from "@/stack";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/login");
  const { productId } = await params;
  const [product, brand] = await Promise.all([
    getProductByIdForUser(user.id, productId),
    getBrandProfileForUser(user.id),
  ]);
  if (!product) notFound();
  return <ProductDetailClient initialProduct={product} brand={brand} />;
}
