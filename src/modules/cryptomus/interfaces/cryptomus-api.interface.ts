export interface CryptomusPaymentResponse {
  state: number;
  result: {
    uuid: string;
    orderId: string;
    amount: string;
    currency: string;
    network: string;
    address: string;
    url: string;
    tag?: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    isFinal: boolean;
    isTest: boolean;
  };
}

export interface CryptomusPaymentStatusResponse {
  state: number;
  result: {
    uuid: string;
    orderId: string;
    amount: string;
    currency: string;
    network: string;
    address: string;
    paymentStatus: string;
    txHash?: string;
    createdAt: string;
    updatedAt: string;
    isFinal: boolean;
    isTest: boolean;
  };
}

export interface CryptomusErrorResponse {
  state: number;
  error: {
    code: string;
    message: string;
  };
}
