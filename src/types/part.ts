import type { Range } from './common';
import type { ApiError } from './message';

export type TextPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'text';
  text: string;
  synthetic?: boolean;
  ignored?: boolean;
  time?: {
    start: number;
    end?: number;
  };
  metadata?: {
    [key: string]: unknown;
  };
};

export type ReasoningPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'reasoning';
  text: string;
  metadata?: {
    [key: string]: unknown;
  };
  time: {
    start: number;
    end?: number;
  };
};

export type FilePartSourceText = {
  value: string;
  start: number;
  end: number;
};

export type FileSource = {
  text: FilePartSourceText;
  type: 'file';
  path: string;
};

export type SymbolSource = {
  text: FilePartSourceText;
  type: 'symbol';
  path: string;
  range: Range;
  name: string;
  kind: number;
};

export type FilePartSource = FileSource | SymbolSource;

export type FilePart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'file';
  mime: string;
  filename?: string;
  url: string;
  source?: FilePartSource;
};

export type ToolStatePending = {
  status: 'pending';
  input: {
    [key: string]: unknown;
  };
  raw: string;
};

export type ToolStateRunning = {
  status: 'running';
  input: {
    [key: string]: unknown;
  };
  title?: string;
  metadata?: {
    [key: string]: unknown;
  };
  time: {
    start: number;
  };
};

export type ToolStateCompleted = {
  status: 'completed';
  input: {
    [key: string]: unknown;
  };
  output: string;
  title: string;
  metadata: {
    [key: string]: unknown;
  };
  time: {
    start: number;
    end: number;
    compacted?: number;
  };
  attachments?: Array<FilePart>;
};

export type ToolStateError = {
  status: 'error';
  input: {
    [key: string]: unknown;
  };
  error: string;
  metadata?: {
    [key: string]: unknown;
  };
  time: {
    start: number;
    end: number;
  };
};

export type ToolState =
  | ToolStatePending
  | ToolStateRunning
  | ToolStateCompleted
  | ToolStateError;

export type ToolPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'tool';
  callID: string;
  tool: string;
  state: ToolState;
  metadata?: {
    [key: string]: unknown;
  };
};

export type StepStartPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'step-start';
  snapshot?: string;
};

export type StepFinishPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'step-finish';
  reason: string;
  snapshot?: string;
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
};

export type SnapshotPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'snapshot';
  snapshot: string;
};

export type PatchPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'patch';
  hash: string;
  files: Array<string>;
};

export type AgentPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'agent';
  name: string;
  source?: {
    value: string;
    start: number;
    end: number;
  };
};

export type RetryPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'retry';
  attempt: number;
  error: ApiError;
  time: {
    created: number;
  };
};

export type CompactionPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'compaction';
  auto: boolean;
};

export type SubtaskPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'subtask';
  prompt: string;
  description: string;
  agent: string;
};

export type Part =
  | TextPart
  | SubtaskPart
  | ReasoningPart
  | FilePart
  | ToolPart
  | StepStartPart
  | StepFinishPart
  | SnapshotPart
  | PatchPart
  | AgentPart
  | RetryPart
  | CompactionPart;

export type TextPartInput = {
  id?: string;
  type: 'text';
  text: string;
  synthetic?: boolean;
  ignored?: boolean;
  time?: {
    start: number;
    end?: number;
  };
  metadata?: {
    [key: string]: unknown;
  };
};

export type FilePartInput = {
  id?: string;
  type: 'file';
  mime: string;
  filename?: string;
  url: string;
  source?: FilePartSource;
};

export type AgentPartInput = {
  id?: string;
  type: 'agent';
  name: string;
  source?: {
    value: string;
    start: number;
    end: number;
  };
};

export type SubtaskPartInput = {
  id?: string;
  type: 'subtask';
  prompt: string;
  description: string;
  agent: string;
};

export type PartInput = TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput;

export type ToolIds = Array<string>;

export type ToolListItem = {
  id: string;
  description: string;
  parameters: unknown;
};

export type ToolList = Array<ToolListItem>;
