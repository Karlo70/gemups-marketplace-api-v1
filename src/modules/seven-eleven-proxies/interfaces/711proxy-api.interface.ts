// Base response interface for all 711proxy API calls
export interface BaseResponse {
  code: number;
  message: string;
  results: any;
}

// Token response interface
export interface TokenResponse extends BaseResponse {
  results: {
    token: string;
  };
}

// Enterprise balance response interface
export interface EnterpriseBalanceResponse extends BaseResponse {
  results: {
    balance: number;
    currency: string;
  };
}

// Order response interface
export interface OrderResponse extends BaseResponse {
  results: {
    orderNo: string;
    status: string;
    message?: string;
  };
}

// Order status response interface
export interface OrderStatusResponse extends BaseResponse {
  results: {
    orderNo: string;
    status: string;
    flow: number;
    used: number;
    remaining: number;
    createdAt: string;
    expiresAt?: string;
  };
}

// Restitution order response interface
export interface RestitutionOrderResponse extends BaseResponse {
  results: {
    orderNo: string;
    status: string;
    message: string;
  };
}

// User pass status response interface
export interface UserPassStatusResponse extends BaseResponse {
  results: {
    username: string;
    status: boolean;
    message: string;
  };
}

// Allocation order response interface
export interface AllocationOrderResponse extends BaseResponse {
  results: {
    orderNo: string;
    proxies: Array<{
      ip: string;
      port: number;
      username?: string;
      password?: string;
      protocol: string;
    }>;
  };
}

// Whitelist response interface
export interface WhitelistResponse extends BaseResponse {
  results: {
    ip: string;
    status: string;
    message: string;
  };
}

// Whitelist info response interface
export interface WhitelistInfoResponse extends BaseResponse {
  results: Array<{
    ip: string;
    description?: string;
    createdAt: string;
  }>;
}

// Statement response interface
export interface StatementResponse extends BaseResponse {
  results: Array<{
    date: string;
    username: string;
    orderNo: string;
    flow: number;
    used: number;
    cost: number;
  }>;
}
