import { getOrderData } from "@/app/actions/order-actions";
import { OrderClient } from "./_components/order-client";
import { notFound } from "next/navigation";
import { Metadata } from "next";

type MetaProps = { params: Promise<{ locationSlug: string; tableId: string }> }

export async function generateMetadata({ params }: MetaProps): Promise<Metadata> {
  const { locationSlug, tableId } = await params
  const data = await getOrderData(locationSlug, tableId)
  if (!data) return { title: "Ordina al Tavolo | Smartables", robots: { index: false, follow: false } }

  const title = `Ordina al Tavolo ${data.table?.name ?? ""} – ${data.location.name}`
  return {
    title,
    description: `Sfoglia il menu, ordina e paga direttamente dal tavolo di ${data.location.name}. Nessuna app richiesta.`,
    robots: { index: false, follow: false },
    openGraph: { title, description: `Ordina dal tavolo di ${data.location.name} in modo semplice e veloce.`, type: "website" },
  }
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locationSlug: string; tableId: string }>;
}) {
  const { locationSlug, tableId } = await params;
  const data = await getOrderData(locationSlug, tableId);

  if (!data) return notFound();

  return (
    <OrderClient
      location={data.location}
      table={data.table}
      menus={data.menus}
      bookingName={data.bookingName}
    />
  );
}
