import { createClient } from "@/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  labels: string[] | null;
  allergens: string[] | null;
  is_available: boolean;
  sort_order: number;
};

type MenuCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  items: MenuItem[];
};

type MenuData = {
  id: string;
  name: string;
  categories: MenuCategory[];
};

export default async function DigitalMenuPage({
  params,
}: {
  params: Promise<{ locationSlug: string; menuId: string }>;
}) {
  const { locationSlug, menuId } = await params;
  const supabase = await createClient();

  // Fetch Menu with Content (JSONB)
  const { data: menu, error } = await supabase
    .from("menus")
    .select("id, name, description, content, pdf_url")
    .eq("id", menuId)
    .single();

  if (error || !menu) {
    console.error("Menu not found:", error);
    return notFound();
  }

  // Handle PDF Menu
  if (menu.pdf_url) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center p-4">
        <div className="w-full max-w-4xl flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 p-2">
            <Link href={`/m/${locationSlug}`} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-gray-900 truncate">{menu.name}</h1>
          </div>

          <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100 min-h-[80vh]">
            <iframe
              src={menu.pdf_url}
              className="w-full h-full"
              title="Menu PDF"
            />
          </div>
          <div className="text-center pb-8">
            <a href={menu.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Scarica / Apri PDF
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Parse categories from JSONB content
  // We assume the JSON structure matches MenuCategory[]
  const categories = (menu.content as unknown as MenuCategory[]) || [];

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center">
        <Link href={`/m/${locationSlug}`} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="ml-2">
          <h1 className="font-bold text-gray-900 truncate">{menu.name}</h1>
        </div>
      </div>

      <div className="p-4 space-y-8">
        {categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{cat.name}</h2>
            {cat.description && (
              <p className="text-sm text-gray-500 mb-4">{cat.description}</p>
            )}

            <div className="space-y-4">
              {cat.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-2 font-medium text-gray-900">
                      € {item.price.toFixed(2)}
                    </div>
                  </div>
                  {item.image_url && (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Divider if not last */}
            <hr className="mt-8 border-gray-100" />
          </section>
        ))}
      </div>
    </div>
  );
}
