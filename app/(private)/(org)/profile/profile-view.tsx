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
    return role === "admin" ? "default" : "secondary";
  };

  const getRoleLabel = (role: string) => {
    return role === "admin" ? "Amministratore" : "Staff";
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

      <div className="grid xl:grid-cols-3 gap-4">
        {/* Main Content Column */}
        <div className="xl:col-span-2 space-y-4">
          {/* Profile Info Card */}
          <Card className="overflow-hidden py-0">
            <div className="bg-primary/20 border-b p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 border border-primary/30 bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
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
                <div className="flex items-start gap-3 p-4 bg-background/80 hover:bg-background/50 dark:bg-muted/50 dark:hover:bg-muted/70 transition-colors">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background/80 hover:bg-background/50 dark:bg-muted/50 dark:hover:bg-muted/70 transition-colors">
                  <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ruolo</p>
                    <p className="font-medium">{getRoleLabel(profile.role)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background/80 hover:bg-background/50 dark:bg-muted/50 dark:hover:bg-muted/70 transition-colors">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Membro dal</p>
                    <p className="font-medium">{formatDate(profile.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background/80 hover:bg-background/50 dark:bg-muted/50 dark:hover:bg-muted/70 transition-colors">
                  <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID Utente</p>
                    <p className="font-medium font-mono text-sm">{profile.id.slice(0, 12)}...</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 border border-primary/20 bg-primary/10 flex items-center justify-center">
                  {mounted && theme === "dark" ? (
                    <Moon className="h-4 w-4 text-primary" />
                  ) : mounted && theme === "light" ? (
                    <Sun className="h-4 w-4 text-primary" />
                  ) : (
                    <Monitor className="h-4 w-4 text-primary" />
                  )}
                </div>
                Tema dell&apos;interfaccia
              </CardTitle>
              <CardDescription>
                Scegli come vuoi visualizzare l&apos;interfaccia della piattaforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = mounted && theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`
                        relative flex flex-col items-center gap-2 p-4 border-2 transition-all
                        hover:border-primary/50 bg-background/80 dark:bg-muted/50
                        ${isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border"
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-5 w-5 bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className={`
                        h-12 w-12 flex items-center justify-center transition-colors
                        ${isSelected
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                        }
                      `}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={`font-medium text-sm ${isSelected ? "text-primary" : ""}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {mounted && theme === "system"
                  ? "Il tema si adatterà automaticamente alle preferenze del tuo sistema operativo."
                  : mounted && theme === "dark"
                    ? "Stai usando il tema scuro."
                    : "Stai usando il tema chiaro."
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Export Data Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 border border-primary/20 bg-primary/10 flex items-center justify-center">
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
                  className="w-full justify-start gap-3 h-12 group"
                  onClick={exportAsCSV}
                >
                  <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                    <FileSpreadsheet className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">CSV</p>
                    <p className="text-xs text-muted-foreground block xl:hidden 2xl:block">Per fogli di calcolo</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 group"
                  onClick={exportAsTXT}
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">TXT</p>
                    <p className="text-xs text-muted-foreground block xl:hidden 2xl:block">Testo semplice</p>
                  </div>
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-3">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <span className="font-semibold">Nota:</span> I file scaricati contengono solo le informazioni del tuo profilo, non i dati dell&apos;organizzazione.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone — only for admin */}
          {profile.role === "admin" && (
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
                  <div className="h-8 w-8 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  Zona pericolosa
                </CardTitle>
                <CardDescription>
                  Azioni irreversibili che riguardano il tuo account e la tua organizzazione.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 p-3">
                  <p className="text-xs text-red-800 dark:text-red-300">
                    <span className="font-semibold">Attenzione:</span> L&apos;eliminazione del tuo account cancellerà permanentemente tutti i dati dell&apos;organizzazione, le attività, i menu, le prenotazioni, i clienti e tutti i file caricati.
                  </p>
                </div>

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
                      className="w-full border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina account e organizzazione
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProfileView;
