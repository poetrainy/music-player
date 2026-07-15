import { auth } from "@/auth";
import { serviceAdapter } from "@/service/adapter";
import { QuotaUsage, User } from "@/features/user/entity";

export const getCurrentUser = async (): Promise<User> => {
  const session = await auth();

  return {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    avatarUrl: session?.user?.image ?? "",
  };
};

export const getQuotaUsage = async (): Promise<QuotaUsage> =>
  serviceAdapter.getQuotaUsage();
