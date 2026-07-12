import { getCurrentUser, getQuotaUsage } from "@/features/user/api";
import { AccountComponent } from "@/features/user/pages/Account";

export default async function Page() {
  const [user, quota] = await Promise.all([getCurrentUser(), getQuotaUsage()]);

  return <AccountComponent quota={quota} user={user} />;
}
