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

interface NumberOrderFailedEmailProps {
  teamName?: string;
  phoneNumber?: string;
  errorDetail?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : "https://smartables.app";

export const NumberOrderFailedEmail = ({
  teamName = "Smartables",
  phoneNumber,
  errorDetail,
}: NumberOrderFailedEmailProps) => {
  const previewText = `Problema con l'attivazione del numero${phoneNumber ? " " + phoneNumber : ""}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
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
              Problema con l&apos;attivazione del numero
            </Heading>
            <Text className="text-black text-[14px] leading-6">
              Ciao,
            </Text>
            <Text className="text-black text-[14px] leading-6">
              Purtroppo l&apos;ordine per il numero{phoneNumber ? <> <strong>{phoneNumber}</strong></> : null} del team <strong>{teamName}</strong> non è andato a buon fine.
            </Text>
            {errorDetail && (
              <Text className="text-black text-[14px] leading-6 bg-[#f5f5f5] p-3 rounded">
                <strong>Dettaglio errore:</strong> {errorDetail}
              </Text>
            )}
            <Text className="text-black text-[14px] leading-6">
              Questo può essere causato da un documento non accettato da Telnyx. Ti consigliamo di verificare i documenti caricati e contattare il supporto se il problema persiste.
            </Text>
            <Section className="text-center mt-8 mb-8">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={`${baseUrl}/dashboard`}
              >
                Vai alla Dashboard
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
};

NumberOrderFailedEmail.PreviewProps = {
  teamName: "Ristorante Da Marco",
  phoneNumber: "+39 0123 456789",
  errorDetail: "Il documento caricato non è stato accettato da Telnyx. Ricarica un documento di identità valido.",
} as NumberOrderFailedEmailProps;

export default NumberOrderFailedEmail;
