import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Globe, Mail, Info, Smartphone, Building2, Store, Share, Search } from "lucide-react";
import { BiShare } from "react-icons/bi";
import Image from "next/image";
import { formatPhoneNumber } from "@/lib/utils";

interface WhatsAppPreviewProps {
  name: string;
  description: string;
  about: string;
  email: string;
  website: string;
  address: string;
  vertical: string;
  phoneNumber: string;
  profileImageUrl: string;
}

export function WhatsAppProfilePreview({
  name,
  description,
  about,
  email,
  website,
  address,
  vertical,
  phoneNumber,
  profileImageUrl,
}: WhatsAppPreviewProps) {

  const getVerticalLabel = (val: string) => {
    const defaultLabel = val || "Categoria";
    return defaultLabel;
  };

  return (
    <Tabs defaultValue="ios" className="w-full h-full flex flex-col">
      <div className="flex items-center border-b-2 pb-3 justify-between mb-2 px-4 shrink-0">
        <h3 className="font-semibold text-lg tracking-tight">Anteprima</h3>
        <TabsList className="p-0.5 h-10 bg-white">
          <TabsTrigger value="ios" className="text-xs">iOS</TabsTrigger>
          <TabsTrigger value="android" className="text-xs">Android</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="ios" className="m-0 mb-6 mx-6 focus-visible:outline-none flex-1 min-h-0 data-[state=active]:flex flex-col">
        <div className="w-full max-w-sm mx-auto h-full bg-gray-100 rounded-[2.5rem] border-8 border-zinc-200 shadow-xl relative font-sans text-gray-900 overflow-y-auto">
          <div className="bg-white pt-6 pb-6 px-4 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-4 shadow-sm relative">
              {profileImageUrl ? (
                <Image src={profileImageUrl} alt="Profile" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Store className="w-10 h-10" />
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-center">{name || "Nome Verificato"}</h2>
            <div className="text-gray-500 text-[13px] mt-1 mb-4">{formatPhoneNumber(phoneNumber)}</div>

            <div className="flex gap-4 w-full px-2">
              <div className="flex-1 bg-gray-100 rounded-xl py-3 flex flex-col items-center justify-center gap-1 text-blue-500">
                <div className="text-black rounded-full">
                  <BiShare size={24} />
                </div>
                <span className="text-[11px] font-medium text-black">Condividi</span>
              </div>
              <div className="flex-1 bg-gray-100 rounded-xl py-2 flex flex-col items-center justify-center gap-1 text-blue-500">
                <div className="text-black rounded-full">
                  <Search size={24} />
                </div>
                <span className="text-[11px] font-medium text-black">Cerca</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4 bg-gray-100">
            {/* Business Info Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex gap-3 items-start border-b px-4 py-3">
                <span className="text-[15px] leading-snug">{getVerticalLabel(vertical)}</span>
              </div>
              <div className="px-4 py-3 border-b">
                <p className="text-[15px] leading-relaxed text-gray-800">{description}</p>
              </div>
              {(address || email || website) ? (
                <div className="">
                  {address && (
                    <div className="flex gap-3 items-start px-4 py-3 border-b">
                      <span className="text-[15px] leading-snug">{address}</span>
                    </div>
                  )}
                  {website && (
                    <div className="flex gap-3 items-center px-4 py-3">
                      <span className="text-[15px] text-blue-500 truncate">{website}</span>
                    </div>
                  )}
                  {email && (
                    <div className="flex gap-3 items-center px-4 py-3">
                      <span className="text-[15px] text-green-600 truncate">{email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-sm text-gray-400 italic">No business details</div>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="android" className="m-0 mb-6 mx-6 focus-visible:outline-none flex-1 min-h-0 data-[state=active]:flex flex-col">
        <div className="w-full max-w-sm mx-auto bg-[#0b141a] text-white rounded-[2.5rem] border-8 border-zinc-800 shadow-xl relative font-sans overflow-x-hidden overflow-y-auto h-full">

          <div className="bg-[#202c33] pt-6 pb-6 px-4 flex flex-col items-center relative shadow-sm">
            <div className="absolute top-4 right-4 text-white/70">
              <Info className="w-5 h-5" />
            </div>
            <div className="w-28 h-28 rounded-full overflow-hidden bg-[#111b21] mb-5 relative">
              {profileImageUrl ? (
                <Image src={profileImageUrl} alt="Profile" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30">
                  <Store className="w-12 h-12" />
                </div>
              )}
            </div>
            <h2 className="text-2xl font-medium tracking-tight text-center text-[#e9edef]">{name || "Nome Verificato"}</h2>
            <div className="text-[#8696a0] text-sm mt-1">{vertical ? getVerticalLabel(vertical) : "Business Profile"}</div>
          </div>

          <div className="p-0 bg-[#0b141a]">
            {/* Description */}
            {(description || about) && (
              <div className="bg-[#111b21] mt-2 p-5 pb-6 border-b-4 border-[#0b141a]">
                {description && <p className="text-[15px] leading-relaxed text-[#e9edef] whitespace-pre-wrap">{description}</p>}
                {about && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="text-[#8696a0] text-sm mb-1">About</div>
                    <div className="text-[16px] text-[#e9edef]">{about}</div>
                  </div>
                )}
              </div>
            )}

            {/* Business info list */}
            <div className="bg-[#111b21] mt-2 flex flex-col pt-2 py-4">
              {address && (
                <div className="flex gap-5 items-center px-5 py-3 hover:bg-white/5 cursor-pointer transition-colors">
                  <MapPin className="w-6 h-6 text-[#8696a0] shrink-0" />
                  <span className="text-[16px] text-[#e9edef] leading-tight">{address}</span>
                </div>
              )}
              {vertical && (
                <div className="flex gap-5 items-center px-5 py-3 hover:bg-white/5 cursor-pointer transition-colors">
                  <Building2 className="w-6 h-6 text-[#8696a0] shrink-0" />
                  <span className="text-[16px] text-[#e9edef]">{getVerticalLabel(vertical)}</span>
                </div>
              )}
              {email && (
                <div className="flex gap-5 items-center px-5 py-3 hover:bg-white/5 cursor-pointer transition-colors">
                  <Mail className="w-6 h-6 text-[#8696a0] shrink-0" />
                  <span className="text-[16px] text-[#53bdeb] truncate">{email}</span>
                </div>
              )}
              {website && (
                <div className="flex gap-5 items-center px-5 py-3 hover:bg-white/5 cursor-pointer transition-colors">
                  <Globe className="w-6 h-6 text-[#8696a0] shrink-0" />
                  <span className="text-[16px] text-[#53bdeb] truncate">{website}</span>
                </div>
              )}
              {(!address && !email && !website && !vertical) && (
                <div className="px-5 py-3 text-[#8696a0] text-sm">No contact info provided</div>
              )}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
