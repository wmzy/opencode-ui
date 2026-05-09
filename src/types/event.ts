import type { Message } from './message';
import type { Part } from './part';
import type { Permission, FileDiff } from './common';
import type { Session, SessionStatus } from './session';
import type { Pty } from './terminal';
import type { Todo } from './shared-types';

export type EventServerInstanceDisposed = {
  type: 'server.instance.disposed';
  properties: {
    directory: string;
  };
};

export type EventInstallationUpdated = {
  type: 'installation.updated';
  properties: {
    version: string;
  };
};

export type EventInstallationUpdateAvailable = {
  type: 'installation.update-available';
  properties: {
    version: string;
  };
};

export type EventLspClientDiagnostics = {
  type: 'lsp.client.diagnostics';
  properties: {
    serverID: string;
    path: string;
  };
};

export type EventLspUpdated = {
  type: 'lsp.updated';
  properties: {
    [key: string]: unknown;
  };
};

export type EventMessageUpdated = {
  type: 'message.updated';
  properties: {
    info: Message;
  };
};

export type EventMessageRemoved = {
  type: 'message.removed';
  properties: {
    sessionID: string;
    messageID: string;
  };
};

export type EventMessagePartUpdated = {
  type: 'message.part.updated';
  properties: {
    part: Part;
    delta?: string;
  };
};

export type EventMessagePartRemoved = {
  type: 'message.part.removed';
  properties: {
    sessionID: string;
    messageID: string;
    partID: string;
  };
};

export type EventPermissionUpdated = {
  type: 'permission.updated';
  properties: Permission;
};

export type EventPermissionReplied = {
  type: 'permission.replied';
  properties: {
    sessionID: string;
    permissionID: string;
    response: string;
  };
};

export type EventSessionStatus = {
  type: 'session.status';
  properties: {
    sessionID: string;
    status: SessionStatus;
  };
};

export type EventSessionIdle = {
  type: 'session.idle';
  properties: {
    sessionID: string;
  };
};

export type EventSessionCompacted = {
  type: 'session.compacted';
  properties: {
    sessionID: string;
  };
};

export type EventFileEdited = {
  type: 'file.edited';
  properties: {
    file: string;
  };
};

export type EventTodoUpdated = {
  type: 'todo.updated';
  properties: {
    sessionID: string;
    todos: Array<Todo>;
  };
};

export type EventCommandExecuted = {
  type: 'command.executed';
  properties: {
    name: string;
    sessionID: string;
    arguments: string;
    messageID: string;
  };
};

export type EventSessionCreated = {
  type: 'session.created';
  properties: {
    info: Session;
  };
};

export type EventSessionUpdated = {
  type: 'session.updated';
  properties: {
    info: Session;
  };
};

export type EventSessionDeleted = {
  type: 'session.deleted';
  properties: {
    info: Session;
  };
};

export type EventSessionDiff = {
  type: 'session.diff';
  properties: {
    sessionID: string;
    diff: Array<FileDiff>;
  };
};

export type EventSessionError = {
  type: 'session.error';
  properties: {
    sessionID?: string;
    error?: import('./message').MessageError;
  };
};

export type EventFileWatcherUpdated = {
  type: 'file.watcher.updated';
  properties: {
    file: string;
    event: 'add' | 'change' | 'unlink';
  };
};

export type EventVcsBranchUpdated = {
  type: 'vcs.branch.updated';
  properties: {
    branch?: string;
  };
};

export type EventTuiPromptAppend = {
  type: 'tui.prompt.append';
  properties: {
    text: string;
  };
};

export type TuiCommand =
  | 'session.list'
  | 'session.new'
  | 'session.share'
  | 'session.interrupt'
  | 'session.compact'
  | 'session.page.up'
  | 'session.page.down'
  | 'session.half.page.up'
  | 'session.half.page.down'
  | 'session.first'
  | 'session.last'
  | 'prompt.clear'
  | 'prompt.submit'
  | 'agent.cycle'
  | (string & {});

export type EventTuiCommandExecute = {
  type: 'tui.command.execute';
  properties: {
    command: TuiCommand;
  };
};

export type EventTuiToastShow = {
  type: 'tui.toast.show';
  properties: {
    title?: string;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
  };
};

export type EventPtyCreated = {
  type: 'pty.created';
  properties: {
    info: Pty;
  };
};

export type EventPtyUpdated = {
  type: 'pty.updated';
  properties: {
    info: Pty;
  };
};

export type EventPtyExited = {
  type: 'pty.exited';
  properties: {
    id: string;
    exitCode: number;
  };
};

export type EventPtyDeleted = {
  type: 'pty.deleted';
  properties: {
    id: string;
  };
};

export type EventServerConnected = {
  type: 'server.connected';
  properties: {
    [key: string]: unknown;
  };
};

export type Event =
  | EventServerInstanceDisposed
  | EventInstallationUpdated
  | EventInstallationUpdateAvailable
  | EventLspClientDiagnostics
  | EventLspUpdated
  | EventMessageUpdated
  | EventMessageRemoved
  | EventMessagePartUpdated
  | EventMessagePartRemoved
  | EventPermissionUpdated
  | EventPermissionReplied
  | EventSessionStatus
  | EventSessionIdle
  | EventSessionCompacted
  | EventFileEdited
  | EventTodoUpdated
  | EventCommandExecuted
  | EventSessionCreated
  | EventSessionUpdated
  | EventSessionDeleted
  | EventSessionDiff
  | EventSessionError
  | EventFileWatcherUpdated
  | EventVcsBranchUpdated
  | EventTuiPromptAppend
  | EventTuiCommandExecute
  | EventTuiToastShow
  | EventPtyCreated
  | EventPtyUpdated
  | EventPtyExited
  | EventPtyDeleted
  | EventServerConnected;

export type GlobalEvent = {
  directory: string;
  payload: Event;
};
