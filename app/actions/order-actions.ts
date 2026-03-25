"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { createAdminClient } from "@/utils/supabase/admin";
import { ok, fail } from "@/lib/action-response";
import { OrderStatus, OrderItemStatus, type Menu } from "@/types/general";
import { isMenuActive, isMenuAvailableAtTime } from "@/lib/menu-helpers";
import { PATHS, dynamicPath } from "@/lib/revalidation-paths";
import { createNotification } from "@/lib/notifications";
import { sendPushToOrganization } from "@/lib/push-notifications";

interface MenuLocation {
  menu_id: string;
  daily_from: string | null;
  daily_until: string | null;
  menus: Menu;
}

export async function getOrderData(locationSlug: string, tableId: string) {
  const supabase = createAdminClient();

  try {
    // 1. Fetch Location
    const { data: location, error: locError } = await supabase
      .from("locations")
      .select("id, organization_id, name, branding, active_menu_id, slug")
      .eq("slug", locationSlug)
      .single();

    if (locError || !location) {
      console.error("Error fetching location:", locError);
      return null;
    }

    // 2. Fetch Table
    const { data: table, error: tableError } = await supabase
      .from("restaurant_tables")
      .select("id, table_number")
      .eq("id", tableId)
      .single();

    if (tableError || !table) {
      console.error("Error fetching table:", tableError);
      return null;
    }

    // 3. Fetch All Active Menus for this Location
    const { data: linkedMenus, error: menusError } = await supabase
      .from("menu_locations")
      .select(
        `
            menu_id,
            daily_from,
            daily_until,
            menus (
                *
            )
        `,
      )
      .eq("location_id", location.id);

    let menus: Menu[] = [];

    if (menusError) {
      console.error("[getOrderData] Error fetching menus:", menusError.message);
    } else if (linkedMenus) {
      const now = new Date();
      menus = (linkedMenus as unknown as MenuLocation[])
        .filter((item) => isMenuAvailableAtTime(item.menus, item, now))
        .map((item) => item.menus);

    }

    if (menus.length === 0 && location.active_menu_id) {
      // Fallback: legacy active_menu_id for locations not yet using menu_locations
      {
        const { data: legacyMenu } = await supabase
          .from("menus")
          .select("*")
          .eq("id", location.active_menu_id)
          .single();

        if (isMenuActive(legacyMenu)) {
          menus.push(legacyMenu);
        }
      }
    }

    // 4. Fetch Booking
    const today = new Date().toISOString().split("T")[0];
    const { data: bookings } = await supabase
      .from("bookings")
      .select("guest_name, status, booking_time")
      .eq("table_id", tableId)
      .gte("booking_time", `${today}T00:00:00`)
      .lte("booking_time", `${today}T23:59:59`)
      .in("status", ["confirmed", "arrived"])
      .order("booking_time", { ascending: false })
      .limit(1);

    const activeBooking = bookings && bookings.length > 0 ? bookings[0] : null;

    return {
      location,
      table,
      menus,
      bookingName: activeBooking?.guest_name || null,
    };
  } catch (error) {
    console.error("Unexpected error in getOrderData:", error);
    return null;
  }
}

interface CreateOrderInput {
  organization_id: string;
  location_id: string;
  table_id: string;
  guest_name?: string; // Optional for tracking who placed it
  items: {
    menu_item_id: string; // From JSON
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }[];
}

export async function createOrder(data: CreateOrderInput) {
  const supabase = await createClient();

  // 1. Check for Active Booking on this Table
  const today = new Date().toISOString().split("T")[0];

  const { data: activeBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("table_id", data.table_id)
    .in("status", ["confirmed", "arrived"])
    .gte("booking_time", `${today}T00:00:00`)
    .lte("booking_time", `${today}T23:59:59`)
    .order("booking_time", { ascending: false })
    .limit(1)
    .single();

  const bookingId = activeBooking?.id || null;

  // 2. Create Order
  const orderId = uuidv4();
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    organization_id: data.organization_id,
    location_id: data.location_id,
    table_id: data.table_id,
    booking_id: bookingId,
    status: "pending",
    total_amount: totalAmount,
    notes: data.guest_name ? `Guest: ${data.guest_name}` : null,
  });

  if (orderError) {
    console.error("[createOrder] Error creating order:", orderError.message);
    return fail("Impossibile creare l'ordine");
  }

  // 3. Create Order Items
  if (data.items.length > 0) {
    const itemsToInsert = data.items.map((item) => ({
      order_id: orderId,
      menu_item_id: item.menu_item_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes,
      status: "pending" as OrderItemStatus,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("[createOrder] Error creating order items:", itemsError.message);
      return fail("Impossibile aggiungere gli articoli all'ordine");
    }
  }

  // Notify staff about new order (fire-and-forget)
  createNotification(supabase, {
    organizationId: data.organization_id,
    locationId: data.location_id,
    type: "new_order",
    title: "Nuovo ordine",
    body: `Ordine da tavolo${data.guest_name ? ` (${data.guest_name})` : ""} — €${(totalAmount / 100).toFixed(2)}`,
    link: "/orders",
    metadata: { orderId, tableId: data.table_id, totalAmount },
  });
  sendPushToOrganization(data.organization_id, {
    title: "Nuovo ordine",
    body: `Ordine da tavolo${data.guest_name ? ` (${data.guest_name})` : ""} — €${(totalAmount / 100).toFixed(2)}`,
    data: { orderId, type: "new_order" },
  });

  revalidatePath(dynamicPath.publicMenu(data.location_id));
  return { success: true as const, orderId };
}

export async function getActiveMenus(locationId: string) {
  const supabase = createAdminClient();

  try {
    const { data: linkedMenus, error: menusError } = await supabase
      .from("menu_locations")
      .select(
        `
        menu_id,
        menus (*)
      `,
      )
      .eq("location_id", locationId);

    let activeMenus: Menu[] = [];

    if (!menusError && linkedMenus && linkedMenus.length > 0) {
      const now = new Date();
      activeMenus = (linkedMenus as unknown as MenuLocation[])
        .map((item) => item.menus)
        .filter((m) => isMenuActive(m, now));
    }

    if (activeMenus.length === 0) {
      const { data: location } = await supabase
        .from("locations")
        .select("active_menu_id")
        .eq("id", locationId)
        .single();

      if (location?.active_menu_id) {
        const { data: legacyMenu } = await supabase
          .from("menus")
          .select("*")
          .eq("id", location.active_menu_id)
          .eq("is_active", true)
          .single();

        if (isMenuActive(legacyMenu)) {
          activeMenus.push(legacyMenu);
        }
      }
    }

    return activeMenus;
  } catch (error) {
    console.error("[getActiveMenus] Unexpected error:", error);
    return [];
  }
}

export async function getActiveMenu(locationId: string) {
  const menus = await getActiveMenus(locationId);
  return menus[0] || null;
}

export async function getTableOrders(tableId: string) {
  const supabase = await createClient();

  // Get orders that are NOT completed/cancelled (active orders)
  // Or maybe we want all for the current session?
  // Let's get "pending", "confirmed", "preparing", "served"
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(*)
    `,
    )
    .eq("table_id", tableId)
    .in("status", ["pending", "confirmed", "preparing", "ready", "served"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching table orders:", error);
    return [];
  }

  return data;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.error("[updateOrderStatus] Error:", error.message);
    return fail("Impossibile aggiornare lo stato dell'ordine");
  }

  revalidatePath(PATHS.RESERVATIONS);
  return ok();
}

export async function updateOrderItemStatus(
  itemId: string,
  status: OrderItemStatus,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("order_items")
    .update({ status })
    .eq("id", itemId);

  if (error) {
    console.error("[updateOrderItemStatus] Error:", error.message);
    return fail("Impossibile aggiornare lo stato dell'articolo");
  }

  return ok();
}

export async function getLocationOrders(locationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(*),
      table:restaurant_tables(table_number),
      booking:bookings(guest_name, guests_count)
    `,
    )
    .eq("location_id", locationId)
    .in("status", ["pending", "confirmed", "preparing", "ready", "served"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching location orders:", error);
    return [];
  }

  return data;
}
