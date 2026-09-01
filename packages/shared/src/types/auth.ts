import type { EAuthStatus, EUserRole } from '../enums/auth.js';

export type TUserSummary = {
  id: string;
  email: string;
  name: string;
  role: EUserRole;
  status: EAuthStatus;
  avatarUrl?: string | null;
};

export type TLoginRequest = {
  email: string;
  password: string;
};

export type TRegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type TAuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: TUserSummary;
};
