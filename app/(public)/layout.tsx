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

  if (session && session.user.id !== '0a82970f-1fc5-4a52-97a1-a8613de0e3f7') {
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
