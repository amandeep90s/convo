export type UserRole = 'admin' | 'moderator' | 'member';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type AuthProvider = 'email' | 'google' | 'apple';

export type UserSummary = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserSummary;
};
