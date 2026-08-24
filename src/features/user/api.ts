import { auth } from "@/auth";
import { User } from "@/features/user/entity";

export const getCurrentUser = async (): Promise<User> => {
  const session = await auth();

  return {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    avatarUrl: session?.user?.image ?? "",
  };
};
