import { getOrderData } from "@/app/actions/order-actions";
import { OrderClient } from "./_components/order-client";
import { notFound } from "next/navigation";

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
