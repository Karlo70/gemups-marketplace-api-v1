// Base API response interface
export interface ProxySellerApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Proxy management interfaces
export interface CreateProxySellerProxyRequest {
  zone: string;
  protocol: 'http' | 'https' | 'socks5';
  count: number;
  duration: number; // in days
  subaccount_id?: string;
  note?: string;
}

export interface ProxySellerProxyResponse {
  id: string;
  ip: string;
  port: number;
  username: string;
  password: string;
  protocol: string;
  zone: string;
  expires_at: string;
  status: 'active' | 'expired' | 'suspended';
  subaccount_id?: string;
  note?: string;
  created_at: string;
}

export interface ProxySellerProxyListResponse {
  proxies: ProxySellerProxyResponse[];
  total: number;
  page: number;
  per_page: number;
}

// Usage and statistics interfaces
export interface UsageStatisticsSellerProxyResponse {
  username: string;
  date: string;
  traffic_used: number;
  ip_rotations: number;
  requests_count: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
}

export interface BalanceSellerProxyResponse {
  traffic_balance: number;
  ip_balance: number;
  currency: string;
  account_status: string;
}

// Error response interface
export interface ProxySellerErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: number;
}

// Subuser Package Management interfaces
export interface CreateSubUserPackageRequest {
  is_link_date: boolean;
  rotation: number; // -1, 0, or 1-3600
  traffic_limit: string; // bytes
  expired_at: string; // d.m.Y format
}

export interface UpdateSubUserPackageRequest {
  is_link_date: boolean;
  rotation: number;
  traffic_limit: string;
  expired_at: string;
  is_active: boolean;
  package_key: string;
}

export interface SubUserPackageResponse {
  package_key: string;
  is_link_date: boolean;
  rotation: number;
  traffic_limit: string;
  expired_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubUserPackageListResponse {
  packages: SubUserPackageResponse[];
  total: number;
}

export interface DeleteSubUserPackageRequest {
  package_key: string;
}

// IP List Management interfaces
export interface CreateIPListRequest {
  title: string;
  whitelist?: string; // comma-separated IPs
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    isp?: string;
  };
  export?: {
    ports: number; // max 1000
    ext: string; // e.g. txt
  };
  rotation: number;
  package_key: string;
}

export interface RenameIPListRequest {
  id: number;
  title: string;
  package_key: string;
}

export interface ChangeIPListRotationRequest {
  id: number;
  rotation: number;
  package_key: string;
}

export interface DeleteIPListRequest {
  id: number;
  package_key: string;
}

export interface IPListResponse {
  id: number;
  title: string;
  whitelist?: string;
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    isp?: string;
  };
  export?: {
    ports: number;
    ext: string;
  };
  rotation: number;
  package_key: string;
  created_at: string;
  updated_at: string;
}

export interface IPListListResponse {
  lists: IPListResponse[];
  total: number;
}

export interface RetrieveSubUserIPListsQuery {
  package_key?: string;
  listId?: number;
}

export interface CreateSpecialListForAPIToolRequest {
  package_key: string;
}

// ==================== NEW PROXY SELLER API INTERFACES ====================

// Get Active Proxies
export interface GetActiveProxiesResponse {
  status: string;
  data: {
    ipv4?: string[];
    ipv6?: string[];
    mobile?: string[];
    isp?: string[];
    mix?: string[];
    mix_isp?: string[];
    resident?: string[];
  };
  errors: any[];
}

// Get Order Reference Info
export interface GetOrderReferenceInfoResponse {
  status: string;
  data: {
    items: Array<{
      country: Array<{
        id: number;
        name: string;
        alpha3: string;
      }>;
      period: Array<{
        id: string;
        name: string;
      }>;
    }>;
  };
  errors: any[];
}

// Calculate Order
export interface CalculateOrderRequest {
  countryId: number;
  periodId: string;
  coupon?: string;
  paymentId: string;
  quantity: number;
  authorization: string;
  customTargetName?: string;
}

export interface CalculateOrderResponse {
  status: string;
  data: {
    warning?: string;
    balance: number;
    total: number;
    quantity: number;
    currency: string;
    discount: number;
    price: number;
  };
  errors: any[];
}

// Make Order
export interface MakeOrderRequest extends CalculateOrderRequest {}

export interface MakeOrderResponse {
  status: string;
  data: {
    orderId: number;
    total: number;
    balance: number;
  };
  errors: any[];
}

// List Authorizations
export interface ListAuthorizationsResponse {
  status: string;
  data: Array<{
    id: string;
    active: boolean;
    login: string;
    password: string;
    orderNumber: string;
    ip?: string;
  }>;
  errors: any[];
}

// Create Authorization
export interface CreateAuthorizationRequest {
  orderNumber: string;
  generateAuth: string; // 'Y' or 'N'
  ip?: string; // for IP authorization only
}

export interface CreateAuthorizationResponse {
  status: string;
  data: {
    id: string;
    active: boolean;
    login: string;
    password: string;
    orderNumber: string;
  };
  errors: any[];
}

// Get Existing IP Lists
export interface GetExistingIPListsResponse {
  status: string;
  data: {
    items: Array<{
      id: number;
      title: string;
      login: string;
      password: string;
      whitelist: string;
      rotation: string;
      geo: {
        country: string;
        region: string;
        city: string;
        isp: string;
      };
      export: {
        ports: number;
        ext: string;
      };
    }>;
  };
  errors: any[];
}

// Create Special List for API Tool
export interface CreateSpecialListForAPIToolResponse {
  status: string;
  data: {
    id: number;
    login: string;
    password: string;
  };
  errors: any[];
}

// Change Rotation
export interface ChangeRotationRequest {
  id: number;
  rotation: number; // -1, 0 to 3600
  package_key: string;
}

export interface ChangeRotationResponse {
  status: string;
  data: {
    id: number;
    title: string;
    login: string;
    password: string;
    whitelist: string;
    rotation: string;
    geo: {
      country: string;
      region: string;
      city: string;
      isp: string;
    };
    export: {
      ports: number;
      ext: string;
    };
  };
  errors: any[];
}

// Get Proxies by Order
export interface GetProxiesByOrderQuery {
  orderId?: string;
  latest?: string; // 'Y' or 'N'
  country?: string; // Alpha-3 country code
  ends?: string; // 'Y' or 'N'
}

export interface GetProxiesByOrderResponse {
  status: string;
  data: {
    [key: string]: string[]; // e.g., "ipv4": ["1.2.3.4:port"]
  };
  errors: any[];
}
