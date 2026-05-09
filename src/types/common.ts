export type ID = string;

export type Timestamp = number;

export type Pagination = {
  limit?: number;
  offset?: number;
};

export type FileDiff = {
  file: string;
  before: string;
  after: string;
  additions: number;
  deletions: number;
};

export type Range = {
  start: {
    line: number;
    character: number;
  };
  end: {
    line: number;
    character: number;
  };
};

export type BadRequestError = {
  data: unknown;
  errors: Array<{
    [key: string]: unknown;
  }>;
  success: false;
};

export type NotFoundError = {
  name: 'NotFoundError';
  data: {
    message: string;
  };
};

export type Permission = {
  id: string;
  type: string;
  pattern?: string | Array<string>;
  sessionID: string;
  messageID: string;
  callID?: string;
  title: string;
  metadata: {
    [key: string]: unknown;
  };
  time: {
    created: number;
  };
};

export type PermissionResponse = 'once' | 'always' | 'reject';

export type LogLevel = 'debug' | 'info' | 'error' | 'warn';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
