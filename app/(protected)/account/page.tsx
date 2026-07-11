import { getCurrentUser, getQuotaUsage } from "@/api";
import { AccountComponent } from "@/features/account/pages/Account";

export default async function Page() {
  const [user, quota] = await Promise.all([getCurrentUser(), getQuotaUsage()]);

  return <AccountComponent quota={quota} user={user} />;
}
