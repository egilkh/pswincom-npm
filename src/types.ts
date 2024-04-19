export type XmlRequestMessage = {
  ID: number;
  OP: number;
  TEXT: string;
  SND: string;
  RCV: string;
  DELIVERYTIME?: string;
};

export type XmlRequestModel = {
  SESSION: {
    // Contains the login name assigned to you by the PSWinCom Gateway Operator.
    CLIENT: string;
    // Password assigned to you by the PSWinCom Gateway operator.
    PW: string;
    MSGLST: {
      MSG: XmlRequestMessage[];
    };
  };
};

export enum XmlResponseMessageStatus {
  OK = 'OK',
  FAIL = 'FAIL',
}

export type XmlResponseMessage = {
  // Unique ID within one XML document/session. Autogenerated by Gateway if not set in Request.
  ID: string;
  // Status code indicating whether processing of a message was successful or not. Possible values: OK, FAIL
  STATUS: XmlResponseMessageStatus;
  // Unique reference ID autogenerated by the gateway.
  // The ID can later be used to correlate the message with a delivery report.
  // This value must be treated as a string with a length of at least 36 characters.
  REF: string;
  // Additional information describing reason for a failed message.
  INFO?: string;
};

export enum XmlResponseLoginStatus {
  OK = 'OK',
  FAIL = 'FAIL',
}

export type XmlResponseModel = {
  SESSION?: {
    // Status for logon. Possible values: "OK" or "FAIL".
    LOGON?: string;
    // Optional element describing reason for a failed login.
    REASON?: string;
    MSGLST?: {
      MSG?: XmlResponseMessage | XmlResponseMessage[];
    };
  };
};

enum DeliveryMessageState {
  // Message was successfully delivered to destination.
  // Premium messages: The receiver number is charged, SMS delivered.
  DELIVRD = 'DELIVRD',
  // Message validity period has expired.
  EXPIRED = 'EXPIRED',
  // Message has been deleted.
  DELETED = 'DELETED',
  // The SMS was undeliverable (not a valid number or no available route to destination).
  UNDELIV = 'UNDELIV',
  // No information of delivery status available.
  UNKNOWN = 'UNKNOWN',
  // Message was rejected.
  REJECTD = 'REJECTD',
  // The SMS failed to be delivered because no operator accepted the message or due to internal Gateway error.
  FAILED = 'FAILED',
  // No delivery report received from operator. Unknown delivery status.
  NULL = 'NULL',
  // The receiver number is barred/blocked/not in use. Do not retry message, and remove number from any subscriber list.
  BARRED = 'BARRED',

  // Premium messages: The receiver could not receive the message because his/her age is below the specified AgeLimit.
  BARREDA = 'BARREDA',
  // Premium messages: The receiver has an empty prepaid account.
  ZEROBAL = 'ZEROBAL',
}

export type XmlDeliveryMessage = {
  ID: string;
  REF: string;
  RCV: string;
  STATE: DeliveryMessageState;
  DELIVERYTIME: string;
};

export type XmlDeliveryResponse = {
  MSGLST?: {
    MSG?: XmlDeliveryMessage | XmlDeliveryMessage[];
  };
};

export type DeliveryResult = {
  id: string;
  ref: string;
  receiver: string;
  state: DeliveryMessageState;
  deliveryTime: string;
};

export type DeliveryResults = DeliveryResult[];

export type SmsResult = {
  logon: string | null;
  receivers: Record<string, XmlResponseMessageStatus>;
  refs: Record<string, string>;
};

export enum MessageOperation {
  // Message text should be encoded using ISO-8859-1/ASCII
  PlainText = 1,
  // Message bytes should be HEX-encoded
  RawBinary = 8,
  // Message text should be the HEX representation of UCS2 (aka Big Endian Unicode) encoded message
  Unicode = 9,
}

export type SmsOptions = {
  // Username at LINK Mobility
  username: string;
  // Password at LINK Mobility
  password: string;
  // Sender of the message, phone number or alphanumeric sender
  sender: string;
  // Array of receivers, phone numbers
  receivers: string[];
  // Message to send
  message: string;
  // Delivery time of the message
  // Delivery time is always in CET.
  deliveryTime?: Date;
  // Operation code
  operation?: MessageOperation;
  // Fetch function to use, defaults to global fetch
  fetch?: typeof fetch;
};
