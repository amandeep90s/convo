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

export type CursorPaginationParams = {
  cursor?: string;
  limit?: number;
};

export type CursorPaginatedResponse<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};
