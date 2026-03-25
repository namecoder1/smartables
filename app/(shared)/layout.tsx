import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { createClient } from "@/utils/supabase/server";
import { Profile } from "@/types/general";

export default async function SharedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let user: Profile | null = null
  if (authUser) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, organization_id")
      .eq("id", authUser.id)
      .single()
    user = data as Profile | null
  }

  return (
    <section>
      <Navbar user={user} email={authUser?.email} />
      {children}
      <Footer />
    </section>
  );
}
