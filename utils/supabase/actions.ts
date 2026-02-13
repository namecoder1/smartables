"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "./server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/login?error=Password errata o email non esistente");
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp(data);

  const plan = formData.get("plan") as string;
  const interval = formData.get("interval") as string;

  if (error) {
    let errorUrl = "/register?error=Password errata o email non esistente";
    if (plan) errorUrl += `&plan=${plan}`;
    if (interval) errorUrl += `&interval=${interval}`;
    redirect(errorUrl);
  }

  revalidatePath("/", "layout");

  let redirectUrl = "/onboarding";
  if (plan && interval) {
    redirectUrl += `?plan=${plan}&interval=${interval}`;
  }

  redirect(redirectUrl);
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}

export async function deleteBooking(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
