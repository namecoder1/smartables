import DemoView from "./demo-view";

export const metadata = {
  title: "Prenota una demo | Smartables",
  description: "Scopri come Smartables può trasformare la gestione del tuo ristorante. Prenota una demo gratuita.",
  alternates: { canonical: '/demo' },
  openGraph: {
    title: 'Prenota una demo | Smartables',
    description: 'Scopri come Smartables può trasformare la gestione del tuo ristorante. Prenota una demo gratuita.',
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Prenota una demo",
      },
    ],
  },
};

export default function DemoPage() {
  return <DemoView />;
}
