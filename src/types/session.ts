import type { FileDiff } from './common';

export type SessionStatus =
  | {
    type: 'idle';
  }
  | {
    type: 'retry';
    attempt: number;
    message: string;
    next: number;
  }
  | {
    type: 'busy';
  };

export type Session = {
  id: string;
  projectID: string;
  directory: string;
  parentID?: string;
  summary?: {
    additions: number;
    deletions: number;
    files: number;
    diffs?: Array<FileDiff>;
  };
  share?: {
    url: string;
  };
  title: string;
  version: string;
  time: {
    created: number;
    updated: number;
    compacting?: number;
  };
  revert?: {
    messageID: string;
    partID?: string;
    snapshot?: string;
    diff?: string;
  };
};
