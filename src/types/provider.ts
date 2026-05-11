import type { Range } from './common';

export type Model = {
  id: string;
  providerID: string;
  api: {
    id: string;
    url: string;
    npm: string;
  };
  name: string;
  capabilities: {
    temperature: boolean;
    reasoning: boolean;
    attachment: boolean;
    toolcall: boolean;
    input: {
      text: boolean;
      audio: boolean;
      image: boolean;
      video: boolean;
      pdf: boolean;
    };
    output: {
      text: boolean;
      audio: boolean;
      image: boolean;
      video: boolean;
      pdf: boolean;
    };
  };
  cost: {
    input: number;
    output: number;
    cache: {
      read: number;
      write: number;
    };
    experimentalOver200K?: {
      input: number;
      output: number;
      cache: {
        read: number;
        write: number;
      };
    };
  };
  limit: {
    context: number;
    output: number;
  };
  status: 'alpha' | 'beta' | 'deprecated' | 'active';
  options: {
    [key: string]: unknown;
  };
  headers: {
    [key: string]: string;
  };
};

export type Provider = {
  id: string;
  name: string;
  source: 'env' | 'config' | 'custom' | 'api';
  env: Array<string>;
  key?: string;
  options: {
    [key: string]: unknown;
  };
  models: {
    [key: string]: Model;
  };
};

export type ProviderAuthMethod = {
  type: 'oauth' | 'api';
  label: string;
};

export type ProviderAuthAuthorization = {
  url: string;
  method: 'auto' | 'code';
  instructions: string;
};

export type OAuth = {
  type: 'oauth';
  refresh: string;
  access: string;
  expires: number;
  enterpriseUrl?: string;
};

export type ApiAuth = {
  type: 'api';
  key: string;
};

export type WellKnownAuth = {
  type: 'wellknown';
  key: string;
  token: string;
};

export type Auth = OAuth | ApiAuth | WellKnownAuth;

export type Agent = {
  name: string;
  description?: string;
  mode: 'subagent' | 'primary' | 'all';
  native?: boolean;
  hidden?: boolean;
  builtIn?: boolean;
  topP?: number;
  temperature?: number;
  color?: string;
  permission: {
    edit: 'ask' | 'allow' | 'deny';
    bash: {
      [key: string]: 'ask' | 'allow' | 'deny';
    };
    webfetch?: 'ask' | 'allow' | 'deny';
    doom_loop?: 'ask' | 'allow' | 'deny';
    external_directory?: 'ask' | 'allow' | 'deny';
  };
  model?: {
    modelID: string;
    providerID: string;
  };
  variant?: string;
  prompt?: string;
  tools: {
    [key: string]: boolean;
  };
  options: {
    [key: string]: unknown;
  };
  maxSteps?: number;
  steps?: number;
};

export type Symbol = {
  name: string;
  kind: number;
  location: {
    uri: string;
    range: Range;
  };
};

export type McpStatusConnected = {
  status: 'connected';
};

export type McpStatusDisabled = {
  status: 'disabled';
};

export type McpStatusFailed = {
  status: 'failed';
  error: string;
};

export type McpStatusNeedsAuth = {
  status: 'needs_auth';
};

export type McpStatusNeedsClientRegistration = {
  status: 'needs_client_registration';
  error: string;
};

export type McpStatus =
  | McpStatusConnected
  | McpStatusDisabled
  | McpStatusFailed
  | McpStatusNeedsAuth
  | McpStatusNeedsClientRegistration;

export type LspStatus = {
  id: string;
  name: string;
  root: string;
  status: 'connected' | 'error';
};

export type FormatterStatus = {
  name: string;
  extensions: Array<string>;
  enabled: boolean;
};
