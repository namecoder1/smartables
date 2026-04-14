"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Download,
  FileText,
  FileSpreadsheet,
  Sun,
  Moon,
  Monitor,
  Check,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PageWrapper from "@/components/private/page-wrapper";
import { deleteAccountAction } from "./actions";
import { getRoleLabel } from "@/lib/utils";

interface ProfileData {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
  email: string;
  organization_id: string | null;
}

interface ProfileViewProps {
  profile: ProfileData;
}

const ProfileView = ({ profile }: ProfileViewProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === "owner") return "default";
    if (role === "admin") return "default";
    return "secondary";
  };



  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccountAction();
    } catch (error: any) {
      setDeleteError(error.message || "Errore durante l'eliminazione");
      setIsDeleting(false);
    }
  };

  // Export functions
  const exportAsCSV = () => {
    const headers = "Nome Completo,Email,Ruolo,Data Creazione,Organization ID";
    const values = `"${profile.full_name || ""}","${profile.email}","${profile.role}","${profile.created_at}","${profile.organization_id || ""}"`;
    const csv = `${headers}\n${values}`;
    const blob = new Blob([csv], { type: "text/csv" });
    downloadFile(blob, "profilo.csv");
  };

  const exportAsTXT = () => {
    const text = `
=== PROFILO UTENTE ===

Nome Completo: ${profile.full_name || "Non specificato"}
Email: ${profile.email}
Ruolo: ${getRoleLabel(profile.role)}
Data Creazione Account: ${formatDate(profile.created_at)}
Organization ID: ${profile.organization_id || "Non associato"}

Esportato il: ${new Date().toLocaleString("it-IT")}
    `.trim();
    const blob = new Blob([text], { type: "text/plain" });
    downloadFile(blob, "profilo.txt");
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const themeOptions = [
    { value: "light", label: "Chiaro", icon: Sun },
    { value: "dark", label: "Scuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ];

  return (
    <PageWrapper>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Il tuo profilo</h1>
        <p className="text-muted-foreground">
          Gestisci le tue informazioni personali e le tue preferenze della piattaforma.
        </p>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Profile Info Card */}
          <Card className="overflow-hidden py-0">
            <div className="bg-border/30 border-b-2 p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 border-2 rounded-2xl border-primary/30 bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                  {getInitials(profile.full_name)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profile.full_name || "Utente"}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getRoleBadgeVariant(profile.role)} className="capitalize">
                      {getRoleLabel(profile.role)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-background/80 hover:bg-background/50 transition-colors border-2 rounded-3xl">
                  <div className="h-10 w-10 bg-blue-100 flex items-center justify-center shrink-0 rounded-xl">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background/80 hover:bg-background/50 transition-colors border-2 rounded-3xl">
                  <div className="h-10 w-10 bg-purple-100 flex items-center justify-center shrink-0 rounded-xl">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ruolo</p>
                    <p className="font-medium">{getRoleLabel(profile.role)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background/80 hover:bg-background/50 transition-colors border-2 rounded-3xl">
                  <div className="h-10 w-10 bg-green-100 flex items-center justify-center shrink-0 rounded-xl">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Membro dal</p>
                    <p className="font-medium">{formatDate(profile.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background/80 hover:bg-background/50 transition-colors border-2 rounded-3xl">
                  <div className="h-10 w-10 bg-orange-100 flex items-center justify-center shrink-0 rounded-xl">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID Utente</p>
                    <p className="font-medium font-mono text-sm">{profile.id.slice(0, 16)}...</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone — only for admin and owner */}
          {(profile.role === "admin" || profile.role === "owner") && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                  <div className="h-8 w-8 border border-red-200 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  Zona pericolosa
                </CardTitle>
                <CardDescription>
                  Azioni irreversibili che riguardano il tuo account e la tua organizzazione.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-100/60 border-2 rounded-xl border-red-100 p-3">
                  <p className="text-xs text-red-800">
                    <span className="font-semibold">Attenzione:</span> L&apos;eliminazione del tuo account cancellerà permanentemente tutti i dati dell&apos;organizzazione, le attività, i menu, le prenotazioni, i clienti e tutti i file caricati.
                  </p>
                </div>

                <div className="ml-auto">
                  <AlertDialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                      setDeleteConfirmation("");
                      setDeleteError(null);
                    }
                  }}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-fit border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Elimina account e organizzazione
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-5 w-5" />
                          Sei sicuro di voler eliminare tutto?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="space-y-3">
                            <p>
                              Questa azione è <strong>irreversibile</strong>. Verranno eliminati permanentemente:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              <li>Il tuo account e profilo</li>
                              <li>L&apos;organizzazione e tutti i collaboratori</li>
                              <li>L&apos;abbonamento Stripe (con rimborso se applicabile)</li>
                              <li>Tutte le attività (location)</li>
                              <li>Tutti i menu, categorie e prodotti</li>
                              <li>Tutte le prenotazioni e i clienti</li>
                              <li>Tutti i file caricati (loghi, documenti, immagini)</li>
                            </ul>
                            <div className="pt-2">
                              <p className="text-sm font-medium mb-2">
                                Scrivi <strong className="text-red-600 dark:text-red-400">ELIMINA</strong> per confermare:
                              </p>
                              <Input
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="Scrivi ELIMINA"
                                className="font-mono"
                                disabled={isDeleting}
                              />
                            </div>
                            {deleteError && (
                              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                {deleteError}
                              </p>
                            )}
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
                        <Button
                          variant="destructive"
                          disabled={deleteConfirmation !== "ELIMINA" || isDeleting}
                          onClick={handleDeleteAccount}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Eliminazione in corso...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina tutto definitivamente
                            </>
                          )}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 border-2 rounded-lg border-primary/20 bg-primary/10 flex items-center justify-center">
                <Download className="h-4 w-4 text-primary" />
              </div>
              Esporta i tuoi dati
            </CardTitle>
            <CardDescription>
              Scarica una copia delle tue informazioni personali in diversi formati.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-16 group rounded-2xl"
                onClick={exportAsCSV}
              >
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">CSV</p>
                  <p className="text-xs text-muted-foreground block xl:hidden 2xl:block">Per fogli di calcolo</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-16 group rounded-2xl"
                onClick={exportAsTXT}
              >
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">TXT</p>
                  <p className="text-xs text-muted-foreground block xl:hidden 2xl:block">Testo semplice</p>
                </div>
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="bg-blue-50/50 border-2 border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">Nota:</span> I file scaricati contengono solo le informazioni del tuo profilo, non i dati dell&apos;organizzazione.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default ProfileView;
