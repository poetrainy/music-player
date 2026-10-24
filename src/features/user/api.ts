import { auth } from "@/auth";
import { getEmbedSession } from "@/features/embed/api";
import { User } from "@/features/user/entity";

export const getCurrentUser = async (): Promise<User> => {
  const session = await auth();

  if (!session) {
    const embedSession = await getEmbedSession();

    if (embedSession) {
      return embedSession.user;
    }
  }

  return {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    avatarUrl: session?.user?.image ?? "",
  };
};
