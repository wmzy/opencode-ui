import type { FileDiff } from './common';

export type ProviderAuthError = {
  name: 'ProviderAuthError';
  data: {
    providerID: string;
    message: string;
  };
};

export type UnknownError = {
  name: 'UnknownError';
  data: {
    message: string;
  };
};

export type MessageOutputLengthError = {
  name: 'MessageOutputLengthError';
  data: {
    [key: string]: unknown;
  };
};

export type MessageAbortedError = {
  name: 'MessageAbortedError';
  data: {
    message: string;
  };
};

export type ApiError = {
  name: 'APIError';
  data: {
    message: string;
    statusCode?: number;
    isRetryable: boolean;
    responseHeaders?: {
      [key: string]: string;
    };
    responseBody?: string;
  };
};

export type MessageError =
  | ProviderAuthError
  | UnknownError
  | MessageOutputLengthError
  | MessageAbortedError
  | ApiError;

export type UserMessage = {
  id: string;
  sessionID: string;
  role: 'user';
  time: {
    created: number;
  };
  summary?: {
    title?: string;
    body?: string;
    diffs: Array<FileDiff>;
  };
  agent: string;
  model: {
    providerID: string;
    modelID: string;
  };
  system?: string;
  tools?: {
    [key: string]: boolean;
  };
};

export type AssistantMessage = {
  id: string;
  sessionID: string;
  role: 'assistant';
  time: {
    created: number;
    completed?: number;
  };
  error?: MessageError;
  parentID: string;
  modelID: string;
  providerID: string;
  mode: string;
  path: {
    cwd: string;
    root: string;
  };
  summary?: boolean;
  cost: number;
  tokens: {
    input: number;
    output: number;
    reasoning: number;
    cache: {
      read: number;
      write: number;
    };
  };
  finish?: string;
};

export type Message = UserMessage | AssistantMessage;

export type MessageWithParts = {
  info: Message;
  parts: Array<import('./part').Part>;
};

export type AssistantMessageWithParts = {
  info: AssistantMessage;
  parts: Array<import('./part').Part>;
};
