import type { Metadata } from "next";
import "./globals.css";
import { Manrope } from 'next/font/google'
import { ThemeProvider } from "@/components/utility/theme-provider";

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: "Smartables | Mai più tavoli vuoti. Trasforma le chiamate perse in prenotazioni confermate.",
  description: "Mai più tavoli vuoti. Trasforma le chiamate perse in prenotazioni confermate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased ${manrope.className}`}>
        <ThemeProvider 
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
