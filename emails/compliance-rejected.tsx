import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ComplianceRejectedEmailProps {
  teamName?: string;
  reason?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://smartables.app";

export const ComplianceRejectedEmail = ({
  teamName = "Smartables",
  reason,
}: ComplianceRejectedEmailProps) => (
  <Html>
    <Head />
    <Preview>Richiesta di conformità rifiutata</Preview>
    <Tailwind>
      <Body className="bg-white my-auto mx-auto font-sans px-2">
        <Container className="border border-solid border-[#eaeaea] rounded my-10 mx-auto p-5 max-w-116.25">
          <Section className="mt-8">
            <Img
              src={`${baseUrl}/static/smartables-logo.png`}
              width="40"
              height="37"
              alt="Smartables"
              className="my-0 mx-auto"
            />
          </Section>
          <Heading className="text-black text-[24px] font-normal text-center p-0 my-7.5 mx-0">
            Richiesta di conformità rifiutata
          </Heading>
          <Text className="text-black text-[14px] leading-6">
            Ciao <strong>{teamName}</strong>,
          </Text>
          <Text className="text-black text-[14px] leading-6">
            La tua richiesta di conformità per l&apos;attivazione del numero è stata rifiutata.
          </Text>
          {reason && (
            <Text className="text-black text-[14px] leading-6 bg-[#f5f5f5] p-3 rounded">
              <strong>Motivo:</strong> {reason}
            </Text>
          )}
          <Text className="text-black text-[14px] leading-6">
            Puoi inviare una nuova richiesta con documenti corretti dalla dashboard.
          </Text>
          <Section className="text-center mt-8 mb-8">
            <Button
              className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
              href={`${baseUrl}/onboarding`}
            >
              Invia nuova richiesta
            </Button>
          </Section>
          <Hr className="border border-solid border-[#eaeaea] my-6.5 mx-0 w-full" />
          <Text className="text-[#666666] text-[12px] leading-6">
            Questa email è stata inviata a {teamName}. Per assistenza scrivi a{" "}
            <a href="mailto:support@smartables.it">support@smartables.it</a>.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

ComplianceRejectedEmail.PreviewProps = {
  teamName: "Ristorante Da Marco",
  reason: "Il documento di identità caricato è scaduto. Si prega di caricare un documento valido.",
} as ComplianceRejectedEmailProps;

export default ComplianceRejectedEmail;
