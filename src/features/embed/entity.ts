import { User } from "@/features/user/entity";

export interface EmbedSession {
  refreshToken: string;
  user: User;
}
