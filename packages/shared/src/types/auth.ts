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

export type TAuthenticatedUser = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type TRegisterRequest = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type TRegisterResponse = {
  id: string;
  name: string;
  username: string;
  email: string;
  created_at: Date;
};

export type TAuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: TUserSummary;
};

export type TVerifyEmailRequest = {
  token: string;
};

export type TResendVerificationRequest = {
  email: string;
};
