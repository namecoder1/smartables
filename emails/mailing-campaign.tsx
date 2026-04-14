import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface MailingCampaignEmailProps {
  subject: string;
  contentHtml: string;
  unsubscribeUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : "https://smartables.app";

export const MailingCampaignEmail = ({
  subject,
  contentHtml,
  unsubscribeUrl,
}: MailingCampaignEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Tailwind>
        <Body className="bg-[#f4f4f5] my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded-xl bg-white my-10 mx-auto p-0 max-w-[580px] overflow-hidden">
            {/* Header */}
            <Section className="bg-black px-8 py-6">
              <Img
                src={`${baseUrl}/logo.png`}
                width="36"
                height="36"
                alt="Smartables"
                className="mb-3"
              />
              <Text className="text-white text-[22px] font-bold m-0 tracking-tight">
                Smartables
              </Text>
            </Section>

            {/* Body */}
            <Section className="px-8 py-8">
              <Heading className="text-black text-[22px] font-semibold m-0 mb-6">
                {subject}
              </Heading>

              {/* Rendered markdown content as HTML */}
              <div
                dangerouslySetInnerHTML={{ __html: contentHtml }}
                style={{
                  color: "#374151",
                  fontSize: "15px",
                  lineHeight: "1.7",
                }}
              />
            </Section>

            <Hr className="border border-solid border-[#eaeaea] mx-0 w-full" />

            {/* Footer */}
            <Section className="px-8 py-6">
              <Text className="text-[#6b7280] text-[12px] leading-5 m-0">
                © {new Date().getFullYear()} Smartables · Via della piattaforma per ristoranti
              </Text>
              {unsubscribeUrl && (
                <Text className="text-[#6b7280] text-[12px] leading-5 m-0 mt-2">
                  Non vuoi più ricevere queste email?{" "}
                  <Link href={unsubscribeUrl} className="text-[#6b7280] underline">
                    Disiscrivi
                  </Link>
                </Text>
              )}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

MailingCampaignEmail.PreviewProps = {
  subject: "Novità di Aprile — Nuove funzionalità in arrivo",
  contentHtml: `<h2>Ciao!</h2><p>Questo mese abbiamo rilasciato nuove funzionalità per la gestione delle prenotazioni. Scopri cosa c'è di nuovo su Smartables.</p><ul><li>Nuovo calendario prenotazioni</li><li>Analitiche avanzate</li><li>Integrazione WhatsApp migliorata</li></ul>`,
  unsubscribeUrl: "https://app.smartables.it/profile",
} as MailingCampaignEmailProps;

export default MailingCampaignEmail;
