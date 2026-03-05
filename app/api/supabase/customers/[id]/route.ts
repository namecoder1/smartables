import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");

  if (!id) {
    return NextResponse.json(
      { error: "Customer ID is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Fetch customer details
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (customerError) {
    return NextResponse.json({ error: customerError.message }, { status: 500 });
  }

  // Fetch recent bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("customer_id", id)
    .order("booking_time", { ascending: false })
    .limit(10);

  // Fetch recent orders (linked via bookings or customer_id if exists)
  // Note: Searching through bookings to find orders for this customer
  const bookingIds = bookings?.map((b) => b.id) || [];

  let orders = [];
  if (bookingIds.length > 0) {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });
    orders = ordersData || [];
  }

  return NextResponse.json({
    ...customer,
    bookings: bookings || [],
    orders: orders || [],
  });
}
