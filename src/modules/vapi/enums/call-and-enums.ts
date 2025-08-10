
export enum CallFrom {
  AGENT_PAGE = 'agent_page',
  SYSTEM = 'system',
}

export enum VapiStatus {
  QUEUED = 'queued',
  RINGING = 'ringing',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  BUSY = 'busy',
  NO_ANSWER = 'no-answer',
  FAILED = 'failed',
  PENDING = 'pending',
  SUCCESS = 'success',
  SENT = 'sent',
  ENDED = 'ended',
}
export enum CommunicationChannel {
  MESSAGE = 'message',
  CALL = 'call',
  EMAIL = 'email',
}

export enum VapiCallEndedReason {
  // 🤖 Assistant-related
  ASSISTANT_ENDED_CALL = 'assistant-ended-call',
  ASSISTANT_ENDED_CALL_AFTER_SPOKEN = 'assistant-ended-call-after-message-spoken',
  ASSISTANT_ENDED_CALL_WITH_HANGUP_TASK = 'assistant-ended-call-with-hangup-task',
  ASSISTANT_ERROR = 'assistant-error',
  ASSISTANT_FORWARDED_CALL = 'assistant-forwarded-call',
  ASSISTANT_JOIN_TIMED_OUT = 'assistant-join-timed-out',
  ASSISTANT_NOT_FOUND = 'assistant-not-found',
  ASSISTANT_NOT_VALID = 'assistant-not-valid',
  ASSISTANT_NOT_PROVIDED = 'assistant-not-provided',
  ASSISTANT_REQUEST_FAILED = 'assistant-request-failed',
  ASSISTANT_REQUEST_RETURNED_ERROR = 'assistant-request-returned-error',
  ASSISTANT_REQUEST_RETURNED_FORWARDING_PHONE_NUMBER = 'assistant-request-returned-forwarding-phone-number',
  ASSISTANT_REQUEST_RETURNED_INVALID_ASSISTANT = 'assistant-request-returned-invalid-assistant',
  ASSISTANT_REQUEST_RETURNED_NO_ASSISTANT = 'assistant-request-returned-no-assistant',
  ASSISTANT_REQUEST_RETURNED_UNSPEAKABLE_ERROR = 'assistant-request-returned-unspeakable-error',
  ASSISTANT_SAID_END_CALL_PHRASE = 'assistant-said-end-call-phrase',

  // 🧠 Pipeline / LLM errors
  VAPIFAULT_ERROR = 'call.in-progress.error-vapifault-*',
  PROVIDERFAULT_ERROR = 'call.in-progress.error-providerfault-*',
  PIPELINE_ERROR = 'pipeline-error-*',
  NO_AVAILABLE_LLM_MODEL = 'pipeline-no-available-llm-model',
  PIPELINE_NO_AVAILABLE_MODEL = 'call.in-progress.error-pipeline-no-available-llm-model',

  // 📞 Phone call/connectivity
  CUSTOMER_BUSY = 'customer-busy',
  CUSTOMER_ENDED_CALL = 'customer-ended-call',
  CUSTOMER_DID_NOT_ANSWER = 'customer-did-not-answer',
  CUSTOMER_MIC_PERMISSION_DENIED = 'customer-did-not-give-microphone-permission',
  NO_CUSTOMER_AUDIO = 'call.in-progress.error-assistant-did-not-receive-customer-audio',
  PROVIDER_CLOSED_WEBSOCKET = 'phone-call-provider-closed-websocket',
  PROVIDER_BYPASS_NO_CALL = 'phone-call-provider-bypass-enabled-but-no-call-received',
  TWILIO_FAILED_TO_CONNECT = 'twilio-failed-to-connect-call',
  TWILIO_MISDIALED = 'twilio-reported-customer-misdialed',
  VONAGE_DISCONNECTED = 'vonage-disconnected',
  VONAGE_FAILED_TO_CONNECT = 'vonage-failed-to-connect-call',
  VONAGE_REJECTED = 'vonage-rejected',
  VONAGE_COMPLETED = 'vonage-completed',
  SIP_PROVIDER_FAILED = 'call.in-progress.error-sip-telephony-provider-failed-to-connect-call',

  // 🚦 Call start errors
  START_NO_ASSISTANT_OR_SERVER = 'call-start-error-neither-assistant-nor-server-set',
  START_GET_ORG_ERROR = 'call.start.error-get-org',
  START_GET_SUB_ERROR = 'call.start.error-get-subscription',
  START_GET_ASSISTANT_ERROR = 'call.start.error-get-assistant',
  START_GET_PHONE_NUMBER_ERROR = 'call.start.error-get-phone-number',
  START_GET_CUSTOMER_ERROR = 'call.start.error-get-customer',
  START_RESOURCES_VALIDATION_ERROR = 'call.start.error-get-resources-validation',
  START_VAPI_NUMBER_INTERNATIONAL_ERROR = 'call.start.error-vapi-number-international',
  START_VAPI_NUMBER_LIMIT = 'call.start.error-vapi-number-outbound-daily-limit',
  START_GET_TRANSPORT_ERROR = 'call.start.error-get-transport',

  // 🔁 Call forwarding and hooks
  FORWARD_OPERATOR_BUSY = 'call.forwarding.operator-busy',
  RINGING_HOOK_SAY = 'call.ringing.hook-executed-say',
  RINGING_HOOK_TRANSFER = 'call.ringing.hook-executed-transfer',

  // ⚠️ Other reasons
  DATABASE_ERROR = 'database-error',
  EXCEEDED_MAX_DURATION = 'exceeded-max-duration',
  MANUALLY_CANCELED = 'manually-canceled',
  SILENCE_TIMED_OUT = 'silence-timed-out',
  VOICEMAIL = 'voicemail',
  WORKER_SHUTDOWN = 'worker-shutdown',

  // ❓ Unknown
  UNKNOWN_ERROR = 'unknown-error',
}
