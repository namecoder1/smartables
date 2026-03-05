import {
  Body,
  Button,
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

interface NumberActiveEmailProps {
  teamName?: string;
  phoneNumber?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : "https://smartables.app";

export const NumberActiveEmail = ({
  teamName = "Smartables", // Default fallback
  phoneNumber,
}: NumberActiveEmailProps) => {
  const previewText = `Il tuo numero ${phoneNumber ? phoneNumber + " " : ""}è attivo!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src={`${baseUrl}/static/smartables-logo.png`}
                width="40"
                height="37"
                alt="Smartables"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Il tuo numero è <strong>attivo</strong>!
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Ciao,
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Il numero <strong>{phoneNumber}</strong> per il team <strong>{teamName}</strong> è stato attivato con successo.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Ora puoi procedere con il resto della configurazione (WhatsApp, Voce, ecc.) direttamente dalla tua dashboard.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={`${baseUrl}/dashboard`}
              >
                Vai alla Dashboard
              </Button>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Questa email è stata inviata a {teamName}.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

NumberActiveEmail.PreviewProps = {
  teamName: "Ristorante Da Marco",
  phoneNumber: "+39 0123 456789",
} as NumberActiveEmailProps;

export default NumberActiveEmail;
