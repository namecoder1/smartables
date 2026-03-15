"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import PasswordStrength, { isPasswordValid } from "@/components/utility/password-strength"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/supabase-js"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function AcceptInvitePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [password, setPassword] = useState("")

  useEffect(() => {
    // Check for error in hash (Supabase returns errors in hash for implicit flow)
    const hash = window.location.hash

    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1)) // remove #
      const errorDescription = params.get('error_description')
      const errorCode = params.get('error_code')
      console.error("AcceptInvite: Hash Error:", errorCode, errorDescription)
      if (errorDescription) {
        setErrorMsg(decodeURIComponent(errorDescription.replace(/\+/g, ' ')))
        setLoading(false)
        return
      }
    }

    const init = async () => {
      // 1. Check for session (handles Implicit Flow #hash automatically)
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        setLoading(false)
        return
      }

      // If no session but we have an access_token in hash, try to manually set the session
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1))
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })

          if (error) {
            console.error("Manual setSession error:", error)
          } else if (data.session?.user) {
            setUser(data.session.user)
            setLoading(false)
            return
          }
        }
      }

      // If still no session, stop loading
      setLoading(false)
    }

    init()

    // Listen for auth state changes (e.g. after hash parsing)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const fullName = formData.get("fullName") as string
    const newPassword = formData.get("password") as string


    try {
      // 1. Update Password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (passwordError) throw passwordError

      // 2. Update Profile Name
      // We use the REST API here via the client definition
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user!.id)

      if (profileError) throw profileError

      toast.success("Profilo completato! Benvenuto.")
      router.push("/home")

    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message || "Qualcosa è andato storto")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-xl shadow-sm border text-center">
          <h2 className="text-2xl font-bold text-red-600">Link non valido</h2>
          <p className="text-gray-600">
            Non siamo riusciti a verificare il tuo invito. Assicurati di aver cliccato il link corretto o che non sia scaduto.
          </p>
          <div className="mt-6 space-y-2">
            <p className="text-xs text-muted-foreground">Se vedi un errore #access_token nel'URL, prova a ricaricare la pagina.</p>
            <Button asChild variant="outline" className="w-full">
              <a href="/login">Vai al login</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#e9e9e9]">
      <Card className="w-full max-w-md rounded-xl shadow-sm border-2 gap-2">
        <CardHeader>
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.png"
            alt="Smartables"
          />
          <h2 className="mt-2 text-center text-3xl tracking-tighter font-extrabold text-gray-900">
            Benvenuto in Smartables
          </h2>
          <p className="text-center text-sm text-muted-foreground">
            Completa il tuo profilo per iniziare
          </p>
        </CardHeader>

        <CardContent>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="text"
                  value={user.email}
                  disabled
                  className="bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Mario Rossi"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Crea Password</Label>
                <PasswordStrength
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" disabled={submitting || !isPasswordValid(password)}>
                {submitting ? "Salvataggio..." : "Completa Registrazione"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="flex flex-col items-center mt-4 gap-2">
        <div className="flex items-center gap-2">
          <Link href='/privacy-policy' className="text-xs hover:text-primary hover:underline underline-offset-2">Politica sulla privacy</Link>
          <Link href='/terms-of-service' className="text-xs hover:text-primary hover:underline underline-offset-2">Termini di servizio</Link>
        </div>
      </div>
    </div >
  )
}
