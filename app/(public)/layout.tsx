import Navbar from "@/components/public/navbar";
import { createClient } from "@/supabase/server";
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
    return redirect('/dashboard')
  }

  return (
    <section>
      <Navbar />
      {children}
      <Footer />
    </section>
  );
}
