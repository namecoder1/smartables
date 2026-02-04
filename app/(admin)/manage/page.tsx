import React from 'react'
import { createClient } from '@/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react'
import { approveComplianceRequest, rejectComplianceRequest } from '@/app/actions/admin-compliance'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

const AdminPage = async () => {
  const supabase = await createClient()

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Unauthorized</div>

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== 'admin' && user.id !== '0a82970f-1fc5-4a52-97a1-a8613de0e3f7') {
    return <div>Access Denied. Admins only.</div>
  }

  // Fetch Pending Requests using Admin Client to bypass RLS on organizations/locations
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: requests, error } = await supabaseAdmin
    .from("telnyx_regulatory_requirements")
    .select(`
      *,
      organization:organization_id ( name ),
      location:location_id ( * )
    `)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching requests:", error);
  }

  // Enhance requests with Signed URLs
  const requestsWithUrls = await Promise.all((requests || []).map(async (req) => {
    let identityUrl = null;
    let addressUrl = null;

    if (req.documents_data?.identity_path) {
      const { data } = await supabase.storage.from('compliance-docs').createSignedUrl(req.documents_data.identity_path, 3600);
      identityUrl = data?.signedUrl;
    }

    if (req.documents_data?.address_path) {
      const { data } = await supabase.storage.from('compliance-docs').createSignedUrl(req.documents_data.address_path, 3600);
      addressUrl = data?.signedUrl;
    }

    return { ...req, identityUrl, addressUrl };
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage compliance requests and approvals.</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Pending Compliance Reviews ({requestsWithUrls.length})</h2>

        {requestsWithUrls.length === 0 && (
          <p className="text-muted-foreground italic">No pending requests found.</p>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requestsWithUrls.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      </div>
    </div>
  )
}

async function RequestCard({ request }: { request: any }) {
  // We need client component for interactive buttons? 
  // Actually, we can use Server Actions in a form or button wrapper.
  // Let's make a small client wrapper for the actions to handle loading states or alerts.

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending Review
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(request.created_at).toLocaleDateString()}
          </span>
        </div>
        <CardTitle className="text-lg mt-2">{request.organization?.name || "Unknown Org"}</CardTitle>
        <CardDescription>
          Location: <span className="font-semibold text-foreground">{request.location?.name || "Unknown Location"}</span>
          <br />
          Area Code: <span className="font-mono font-medium text-foreground">{request.area_code}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-2 pb-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="col-span-2 font-semibold border-b pb-1 mt-2 mb-1">Customer Details</div>

          <div>Type:</div>
          <div className="font-medium capitalize">{request.documents_data?.customerType?.replace('_', ' ')}</div>

          {request.documents_data?.customerType === 'legal_entity' && (
            <>
              <div>Business Name:</div>
              <div className="font-medium">{request.documents_data?.businessName}</div>
              <div>VAT Number:</div>
              <div className="font-medium">{request.documents_data?.vatNumber}</div>
            </>
          )}

          <div>Name:</div>
          <div className="font-medium">{request.documents_data?.firstName} {request.documents_data?.lastName}</div>

          <div>Tax Code:</div>
          <div className="font-medium">{request.documents_data?.taxCode}</div>

          <div>DOB:</div>
          <div className="font-medium">{format(request.documents_data?.dateOfBirth || new Date(), 'dd/MM/yyyy')}</div>

          <div>Place of Birth:</div>
          <div className="font-medium">{request.documents_data?.placeOfBirth}</div>

          <div className="col-span-2 font-semibold border-b pb-1 mt-2 mb-1">Identity Document</div>
          <div>Type:</div>
          <div className="font-medium">{request.documents_data?.idType}</div>
          <div>Number:</div>
          <div className="font-medium">{request.documents_data?.idNumber}</div>
          <div>Issuer:</div>
          <div className="font-medium">{request.documents_data?.idIssuer}</div>
          <div>Expires:</div>
          <div className="font-medium">{format(request.documents_data?.idExpirationDate || new Date(), 'dd/MM/yyyy')}</div>

          <div className="col-span-2 font-semibold border-b pb-1 mt-2 mb-1">Address</div>
          <div className="col-span-2">
            {request.documents_data?.streetAddress}, {request.documents_data?.city}
            <br />
            {request.documents_data?.zipCode} {request.documents_data?.province}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold w-16">Identity:</span>
            {request.identityUrl ? (
              <a href={request.identityUrl} target="_blank" rel="noopener noreferrer" className="text-xs truncate max-w-[150px] hover:underline hover:text-blue-600">
                {request.documents_data?.identity_filename || "View File"}
              </a>
            ) : (
              <span className="text-xs truncate max-w-[150px] text-muted-foreground">Missing</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold w-16">Address:</span>
            {request.addressUrl ? (
              <a href={request.addressUrl} target="_blank" rel="noopener noreferrer" className="text-xs truncate max-w-[150px] hover:underline hover:text-blue-600">
                {request.documents_data?.address_filename || "View File"}
              </a>
            ) : (
              <span className="text-xs truncate max-w-[150px] text-muted-foreground">Missing</span>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Org ID: {request.organization_id}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <form action={async () => {
          "use server";
          await rejectComplianceRequest(request.id, "Admin Rejected via Dashboard");
        }} className="w-1/2">
          <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
            <XCircle className="w-4 h-4 mr-1" /> Reject
          </Button>
        </form>

        <form action={async () => {
          "use server";
          await approveComplianceRequest(request.id);
        }} className="w-1/2">
          <Button variant="default" type='submit' className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-1" /> Approve
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

export default AdminPage