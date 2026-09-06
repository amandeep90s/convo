export type IApiSuccessResponse<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
};

export type IApiErrorResponse = {
  success: false;
  statusCode: number;
  message: string;
  /** Field-level validation errors keyed by field path. */
  errors?: Record<string, string>;
  timestamp: string;
  path: string;
};

export type IApiResponse<T> = IApiSuccessResponse<T> | IApiErrorResponse;
