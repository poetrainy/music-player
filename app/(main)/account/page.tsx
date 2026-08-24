import { getCurrentUser } from "@/features/user/api";
import { AccountComponent } from "@/features/user/pages/Account";

export default async function Page() {
  const user = await getCurrentUser();

  return <AccountComponent user={user} />;
}
