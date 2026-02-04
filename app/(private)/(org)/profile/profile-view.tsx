"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Download,
  FileJson,
  FileText,
  FileSpreadsheet,
  Sun,
  Moon,
  Monitor,
  Check
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PageWrapper from "@/components/private/page-wrapper";

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

  // Export functions
  const exportAsJSON = () => {
    const data = {
      nome_completo: profile.full_name,
      email: profile.email,
      ruolo: profile.role,
      data_creazione: profile.created_at,
      organization_id: profile.organization_id,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadFile(blob, "profilo.json");
  };

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
                Tema dell'interfaccia
              </CardTitle>
              <CardDescription>
                Scegli come vuoi visualizzare l'interfaccia della piattaforma.
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
                  <span className="font-semibold">Nota:</span> I file scaricati contengono solo le informazioni del tuo profilo, non i dati dell'organizzazione.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProfileView;
