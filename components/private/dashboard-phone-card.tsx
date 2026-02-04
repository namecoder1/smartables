'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, Check, Loader2, Info } from 'lucide-react'
import { Location } from '@/types/general'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import PhoneSettings from './phone-settings'

interface DashboardPhoneCardProps {
    activationStatus: string
    locations: Location[]
}

export default function DashboardPhoneCard({ activationStatus, locations }: DashboardPhoneCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // For MVP, we target the first location. 
    // In future, this might need a selector or loop.
    const location = locations && locations.length > 0 ? locations[0] : null

    // Hidden if account not active (billing check)
    if (activationStatus !== 'active') {
        return null;
    }

    if (!location) {
        return null;
        // Or show a "Create Location first" state, but Settings handles that.
        // Dashboard usually assumes happy path or specific "Empty State" components elsewhere.
    }

    const hasNumber = !!location.telnyx_phone_number

    if (hasNumber) {
        return (
            <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border-green-200 dark:border-green-900 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Phone className="w-5 h-5" /> AI Receptionist Active
                    </CardTitle>
                    <CardDescription className="text-green-600/80 dark:text-green-500/80">
                        Your AI is ready to handle calls. Connect it now.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-white/80 dark:bg-black/20 rounded-lg border border-green-100 dark:border-green-900/50 backdrop-blur-sm">
                        <h4 className="font-semibold text-sm mb-2 text-green-800 dark:text-green-300">Call Forwarding Instructions</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
                            To redirect your missed calls to the AI, dial this MMI code on your restaurant's phone:
                        </p>
                        <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-lg tracking-wider select-all cursor-text text-center justify-center">
                            **67*{location.telnyx_phone_number}#
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1">
                            <Info className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>This code (busy call forwarding) redirects calls only when you are busy or reject the call.</span>
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/10 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Phone className="w-5 h-5" /> Activate AI Receptionist
                </CardTitle>
                <CardDescription>
                    Stop losing customers to missed calls. Activate your AI assistant in one click.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]">
                            <Phone className="w-4 h-4 mr-2" />
                            Setup Number
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Configure AI Phone</DialogTitle>
                            <DialogDescription>
                                Search and select a number for your AI Assistant.
                            </DialogDescription>
                        </DialogHeader>
                        <PhoneSettings location={location} />
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}
