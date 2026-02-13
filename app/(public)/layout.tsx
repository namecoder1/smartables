import Navbar from "@/components/public/navbar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Footer from "@/components/public/footer";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    return redirect('/home')
  }

  return (
    <section>
      <Navbar />
      {children}
      <Footer />
    </section>
  );
}
