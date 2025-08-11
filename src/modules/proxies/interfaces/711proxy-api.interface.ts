export interface ProxyFetchResponse {
  ip: string;
  port: number;
}

export interface ProxyTokenResponse {
  code: number;
  message: string;
  results: {
    token: string;
  };
}

export interface ProxyOrderResponse {
  code: number;
  message: string;
  results: {
    username: string;
    passwd: string;
    host: string;
    port: number;
    proto: string;
    order_no: string;
    flow: string;
    expire?: string;
  };
}

export interface ProxyOrderStatusResponse {
  code: number;
  message: string;
  results: {
    username: string;
    passwd: string;
    host: string;
    port: number;
    proto: string;
    order_no: string;
    flow: string;
    expire?: string;
    status: string;
  };
}

export interface ProxyBalanceResponse {
  code: number;
  message: string;
  results: {
    traffic_balance: number;
    ip_balance: number;
    currency: string;
  };
}

export interface ProxyUsageResponse {
  code: number;
  message: string;
  results: {
    username: string;
    traffic_used: number;
    ip_rotations: number;
    requests_count: number;
    successful_requests: number;
    failed_requests: number;
    average_response_time: number;
  }[];
}

export interface ProxyErrorResponse {
  code: number;
  message: string;
  error?: string;
}
