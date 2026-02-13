import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, FileText } from 'lucide-react'
import { approveComplianceRequest, rejectComplianceRequest, resetComplianceStatusAction } from '@/app/actions/admin-compliance'
import { format } from 'date-fns'

const AdminPage = async () => {
  const supabase = await createClient()

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
    <div className="p-6">
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

      <div className="mt-12 space-y-6">
        <h2 className="text-xl font-semibold">Locations Automation Status</h2>
        <AutomationStatusTable />
      </div>
    </div>
  )
}

import {
  manualPurchaseNumber,
  manualMetaRegistration,
  manualVoiceVerification
} from '@/app/actions/admin-automation'
import { BadgeCheck, Phone, RefreshCw } from 'lucide-react'

async function AutomationStatusTable() {
  const supabase = await createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch locations with their requirement status
  const { data: locations } = await supabase
    .from("locations")
    .select(`
      *,
      organization:organization_id ( name ),
      requirement:regulatory_requirement_id ( id, status, telnyx_requirement_group_id )
    `)
    .order('created_at', { ascending: false })
    .not('regulatory_requirement_id', 'is', null)
    .limit(20) // Just recent ones

  console.log('[Admin] Automation Status - Locations:', locations?.map(l => ({
    id: l.id,
    name: l.name,
    reqId: l.regulatory_requirement_id,
    reqStatus: l.requirement?.status,
    telnyxGroupId: l.requirement?.telnyx_requirement_group_id
  })));

  if (!locations?.length) return <p>No locations found.</p>

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {locations.map((loc) => (
        <AutomationCard key={loc.id} location={loc} />
      ))}
    </div>
  )
}

import {
  simulateTelnyxApproval,
  simulateIncomingCall,
  simulateRecordingSaved
} from '@/app/actions/admin-simulation'

function AutomationCard({ location }: { location: any }) {
  const reqStatus = location.requirement?.status || 'none';
  const telnyxReqGroupId = location.requirement?.telnyx_requirement_group_id;

  const hasTelnyx = !!location.telnyx_phone_number;
  const hasMeta = !!location.meta_phone_id;
  const isActive = location.activation_status === 'active';
  const isVerified = location.activation_status === 'verified';

  // Checking environment or just enabling for all admins? 
  // Let's enable for all admins as requested "management".

  return (
    <Card key={location.id} className="text-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{location.name} <span className="text-xs font-normal text-muted-foreground">({location.organization?.name})</span></CardTitle>
        <CardDescription className="text-xs break-all">{location.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        {/* Step 0: Regulatory */}
        <div className="flex justify-between items-center">
          <span>Regulatory:</span>
          <Badge variant={reqStatus === 'approved' ? 'default' : 'secondary'} className={reqStatus === 'approved' ? 'bg-green-100 text-green-800' : ''}>
            {reqStatus}
          </Badge>
        </div>


        {/* STUCK STATE: Pending but no Telnyx Group ID */}
        {reqStatus === 'pending' && !telnyxReqGroupId && (
          <form action={async () => {
            "use server"
            if (location.requirement?.id) {
              await resetComplianceStatusAction(location.requirement.id)
            }
          }}>
            <Button size="sm" variant="ghost" className="w-full h-6 mt-1 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50">
              ⚠️ Stuck? Reset to Pending Review
            </Button>
          </form>
        )}

        {/* SIMULATION: Approve Regulatory */}
        {reqStatus !== 'approved' && telnyxReqGroupId && (
          <form action={async () => {
            "use server"
            await simulateTelnyxApproval(telnyxReqGroupId, location.telnyx_phone_number)
          }}>
            <Button size="sm" variant="ghost" className="w-full h-6 mt-1 text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-50">
              ⚡ Simulate Approval
            </Button>
          </form>
        )}

        {/* Step 1: Purchase */}
        <div className="flex justify-between items-center border-t pt-2">
          <span>Telnyx Number:</span>
          <span className="font-mono text-xs">{location.telnyx_phone_number || 'N/A'}</span>
        </div>
        {reqStatus === 'approved' && (
          <form action={async () => {
            "use server"
            // manualPurchaseNumber requires locationId and requirementId
            // The original code used location.requirement?.id
            await manualPurchaseNumber(location.id, location.requirement?.id)
          }}>
            <Button size="sm" variant="outline" className="w-full h-7 mt-1 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" /> Force Purchase
            </Button>
          </form>
        )}

        {/* Step 2: Meta */}
        <div className="flex justify-between items-center border-t pt-2">
          <span>Meta ID:</span>
          {hasMeta ? <BadgeCheck className="w-4 h-4 text-green-600" /> : <span className="text-xs text-muted-foreground">Missing</span>}
        </div>
        {!hasMeta && hasTelnyx && (
          <form action={async () => {
            "use server"
            await manualMetaRegistration(location.id)
          }}>
            <Button size="sm" variant="outline" className="w-full h-7 mt-1 text-xs">
              <Phone className="w-3 h-3 mr-1" /> Force Add to Meta
            </Button>
          </form>
        )}

        {/* Step 3: Verify */}
        <div className="flex justify-between items-center border-t pt-2">
          <span>Status:</span>
          <Badge variant={isActive || isVerified ? 'default' : 'outline'}>{location.activation_status}</Badge>
        </div>

        {/* SIMULATION: Call & Verify */}
        {hasMeta && !isVerified && (
          <div className="flex gap-1 mt-1">
            <form action={async () => {
              "use server"
              await simulateIncomingCall(location.telnyx_phone_number)
            }} className="flex-1">
              <Button size="sm" variant="secondary" className="w-full h-7 text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100">
                ⚡ Sim. Call
              </Button>
            </form>
            <form action={async () => {
              "use server"
              await simulateRecordingSaved(location.telnyx_phone_number)
            }} className="flex-1">
              <Button size="sm" variant="secondary" className="w-full h-7 text-[10px] bg-green-50 text-green-700 hover:bg-green-100">
                ⚡ Sim. Code
              </Button>
            </form>
          </div>
        )}

        {/* Original Manual Trigger (Real) */}
        {hasMeta && !isVerified && (
          <form action={async () => {
            "use server"
            await manualVoiceVerification(location.id)
          }}>
            <Button size="sm" variant="outline" className="w-full h-7 mt-2 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" /> Re-trigger Real Call
            </Button>
          </form>
        )}

        <div className="pt-2 border-t mt-2">
          <form action={async () => {
            "use server"
            await deleteLocationAction(location.id)
          }}>
            <Button size="sm" variant="destructive" className="w-full h-6 text-[10px]">
              Trash Location (Cleanup)
            </Button>
          </form>
        </div>

      </CardContent>
    </Card>
  )
}

import { deleteLocationAction } from '@/app/actions/admin-automation'

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