"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { createAdminClient } from "@/utils/supabase/admin";
import { OrderStatus, OrderItemStatus } from "@/types/general";

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
    // We join menu_locations to filter by location_id
    console.log(
      "[getOrderData] Fetching all active menus for location:",
      location.id,
    );

    // We want menus that are active AND linked to this location
    const { data: linkedMenus, error: menusError } = await supabase
      .from("menu_locations")
      .select(
        `
            menu_id,
            menus (
                *
            )
        `,
      )
      .eq("location_id", location.id);

    let menus: any[] = [];

    if (menusError) {
      console.error(
        "[getOrderData] Error fetching menus:",
        JSON.stringify(menusError, null, 2),
      );
    } else if (linkedMenus) {
      const now = new Date();
      // Extract menus and filter for is_active and date validity
      menus = linkedMenus
        .map((item: any) => item.menus)
        .filter((m: any) => {
          if (!m || m.is_active === false) return false;

          if (m.starts_at && m.ends_at) {
            const startDate = new Date(m.starts_at);
            const endDate = new Date(m.ends_at);
            if (now < startDate || now > endDate) return false;
          } else if (m.starts_at) {
            if (now < new Date(m.starts_at)) return false;
          } else if (m.ends_at) {
            if (now > new Date(m.ends_at)) return false;
          }

          return true;
        });

      console.log("[getOrderData] Found active menus:", menus.length);
    }

    if (menus.length === 0) {
      console.warn(
        "[getOrderData] No active menus found for location:",
        location.id,
      );
      // Fallback check: Does the location have an "active_menu_id" set directly?
      // This is legacy behavior but good for fallback if menu_locations isn't used yet.
      if (location.active_menu_id) {
        console.log(
          "[getOrderData] Checking legacy active_menu_id:",
          location.active_menu_id,
        );
        const { data: legacyMenu } = await supabase
          .from("menus")
          .select("*")
          .eq("id", location.active_menu_id)
          .single();

        if (legacyMenu && legacyMenu.is_active !== false) {
          let isValid = true;
          const now = new Date();
          if (legacyMenu.starts_at && legacyMenu.ends_at) {
            const startDate = new Date(legacyMenu.starts_at);
            const endDate = new Date(legacyMenu.ends_at);
            if (now < startDate || now > endDate) isValid = false;
          } else if (legacyMenu.starts_at) {
            if (now < new Date(legacyMenu.starts_at)) isValid = false;
          } else if (legacyMenu.ends_at) {
            if (now > new Date(legacyMenu.ends_at)) isValid = false;
          }

          if (isValid) {
            menus.push(legacyMenu);
          }
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
    console.error("Error creating order:", orderError);
    return { error: "Failed to create order" };
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
      console.error("Error creating order items:", itemsError);
      return { error: "Failed to create order items" };
    }
  }

  revalidatePath(`/m/${data.location_id}`);
  return { success: true, orderId };
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

    let activeMenus: any[] = [];

    if (!menusError && linkedMenus && linkedMenus.length > 0) {
      const now = new Date();
      activeMenus = linkedMenus
        .map((item: any) => item.menus)
        .filter((m: any) => {
          if (!m || m.is_active === false) return false;

          if (m.starts_at && m.ends_at) {
            const startDate = new Date(m.starts_at);
            const endDate = new Date(m.ends_at);
            if (now < startDate || now > endDate) return false;
          } else if (m.starts_at) {
            if (now < new Date(m.starts_at)) return false;
          } else if (m.ends_at) {
            if (now > new Date(m.ends_at)) return false;
          }

          return true;
        });
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

        if (legacyMenu) {
          let isValid = true;
          const now = new Date();
          if (legacyMenu.starts_at && legacyMenu.ends_at) {
            const startDate = new Date(legacyMenu.starts_at);
            const endDate = new Date(legacyMenu.ends_at);
            if (now < startDate || now > endDate) isValid = false;
          } else if (legacyMenu.starts_at) {
            if (now < new Date(legacyMenu.starts_at)) isValid = false;
          } else if (legacyMenu.ends_at) {
            if (now > new Date(legacyMenu.ends_at)) isValid = false;
          }

          if (isValid) activeMenus.push(legacyMenu);
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
    console.error("Error updating order status:", error);
    return { error: "Failed to update order status" };
  }

  revalidatePath("/reservations"); // Assuming floor plan is here
  return { success: true };
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
    console.error("Error updating order item status:", error);
    return { error: "Failed to update item status" };
  }

  return { success: true };
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
