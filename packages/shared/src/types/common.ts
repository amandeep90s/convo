export type Id = string;
export type ISODateString = string;

export type TPaginationParams = {
  page?: number;
  limit?: number;
};

export type TPaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type TApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: TApiError;
};
