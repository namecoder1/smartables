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

interface InviteUserEmailProps {
  username?: string;
  invitedByUsername?: string;
  invitedByEmail?: string;
  teamName?: string;
  teamImage?: string;
  inviteLink?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : "https://smartables.app";

export const InviteUserEmail = ({
  username,
  invitedByUsername,
  invitedByEmail,
  teamName,
  teamImage,
  inviteLink,
}: InviteUserEmailProps) => {
  const previewText = `Sei stato invitato a unirti a ${teamName} su Smartables`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src={teamImage || `${baseUrl}/static/smartables-logo.png`}
                width="40"
                height="37"
                alt="Smartables Logo"
                className="my-0 mx-auto"
              />
            </Section>

            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Benvenuto, {username}!
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              <strong>{invitedByUsername}</strong> ({invitedByEmail}) ti ha invitato a collaborare nel team <strong>{teamName}</strong> su Smartables.
            </Text>

            <Section className="bg-[#f9f9f9] rounded p-[20px] my-[20px] border border-solid border-[#eaeaea]">
              <Text className="text-[#666666] text-[13px] leading-[20px] m-0 italic text-center">
                Smartables è la piattaforma intelligente per gestire il tuo locale: ordini, menu digitali, prenotazioni e analytics, tutto in un unico posto.
              </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={inviteLink}
              >
                Accetta l'invito
              </Button>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Se il pulsante non funziona, copia e incolla questo link nel browser: {' '}
              <Link href={inviteLink} className="text-orange-400 no-underline">
                {inviteLink}
              </Link>
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Copyright © 2024 Smartables. <br />
              Hai bisogno di aiuto? <Link href="https://smartables.it/docs" className="text-orange-400 no-underline">Consulta la nostra guida</Link>
            </Text>
          </Container>

          <Section className="text-center mt-[32px] mb-[32px]">
            <Text className="text-[#666666] text-[10px] leading-[16px]">
              Ricevi questa email perché sei stato invitato a unirti a un team su Smartables. <br />
              Se non ti aspettavi questo invito, puoi ignorare tranquillamente questa email.
            </Text>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  );
};

InviteUserEmail.PreviewProps = {
  username: "Tobia Bartolomei",
  invitedByUsername: "Marco Bini",
  invitedByEmail: "marcobini@damarco.it",
  teamName: "Ristorante Da Marco",
  teamImage: "http://localhost:3000/static/logo.png",
  inviteLink: "http://localhost:3000/invite",
} as InviteUserEmailProps;

export default InviteUserEmail;