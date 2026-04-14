import { getCampaignsAction, getSubscribersCountAction } from "@/app/actions/mailing";
import MailingView from "./mailing-view";

export const metadata = {
  title: "Mailing — Admin",
};

export default async function MailingPage() {
  const [campaignsResult, subscribersResult] = await Promise.all([
    getCampaignsAction(),
    getSubscribersCountAction(),
  ]);

  const campaigns = campaignsResult.success ? (campaignsResult.data ?? []) : [];
  const subscribersCount = subscribersResult.success ? (subscribersResult.data?.count ?? 0) : 0;

  return (
    <MailingView
      campaigns={campaigns}
      subscribersCount={subscribersCount}
    />
  );
}
