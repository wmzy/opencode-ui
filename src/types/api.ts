import type { GlobalEvent } from './event';
import type { Project } from './project';
import type { Pty, PtyCreateInput, PtyUpdateInput } from './terminal';
import type { Config } from './config';
import type { ToolIds, ToolList } from './part';
import type { Path, VcsInfo } from './project';
import type { Session, SessionStatus } from './session';
import type {
  AssistantMessage,
  MessageWithParts,
  AssistantMessageWithParts,
} from './message';
import type { PartInput } from './part';
import type { FileDiff, BadRequestError, NotFoundError, PermissionResponse } from './common';
import type { Command } from './command';
import type { Provider, ProviderAuthMethod, ProviderAuthAuthorization, Auth } from './provider';
import type { FileNode, FileContent, FileChange, FindTextMatch } from './file';
import type { Todo } from './shared-types';
import type {
  Agent,
  McpStatus,
  LspStatus,
  FormatterStatus,
} from './provider';
import type { McpConfig } from './config';

type DirectoryQuery = {
  directory?: string;
};

export type GlobalEventData = {
  body?: never;
  path?: never;
  query?: never;
  url: '/global/event';
};

export type GlobalEventResponses = {
  200: GlobalEvent;
};

export type GlobalEventResponse = GlobalEventResponses[200];

export type ProjectListData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/project';
};

export type ProjectListResponses = {
  200: Array<Project>;
};

export type ProjectListResponse = ProjectListResponses[200];

export type ProjectCurrentData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/project/current';
};

export type ProjectCurrentResponses = {
  200: Project;
};

export type ProjectCurrentResponse = ProjectCurrentResponses[200];

export type PtyListData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/pty';
};

export type PtyListResponses = {
  200: Array<Pty>;
};

export type PtyListResponse = PtyListResponses[200];

export type PtyCreateData = {
  body?: PtyCreateInput;
  path?: never;
  query?: DirectoryQuery;
  url: '/pty';
};

export type PtyCreateErrors = {
  400: BadRequestError;
};

export type PtyCreateError = PtyCreateErrors[400];

export type PtyCreateResponses = {
  200: Pty;
};

export type PtyCreateResponse = PtyCreateResponses[200];

export type PtyRemoveData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/pty/{id}';
};

export type PtyRemoveErrors = {
  404: NotFoundError;
};

export type PtyRemoveResponses = {
  200: boolean;
};

export type PtyRemoveResponse = PtyRemoveResponses[200];

export type PtyGetData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/pty/{id}';
};

export type PtyGetErrors = {
  404: NotFoundError;
};

export type PtyGetResponses = {
  200: Pty;
};

export type PtyGetResponse = PtyGetResponses[200];

export type PtyUpdateData = {
  body?: PtyUpdateInput;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/pty/{id}';
};

export type PtyUpdateErrors = {
  400: BadRequestError;
};

export type PtyUpdateResponses = {
  200: Pty;
};

export type PtyUpdateResponse = PtyUpdateResponses[200];

export type PtyConnectData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/pty/{id}/connect';
};

export type PtyConnectErrors = {
  404: NotFoundError;
};

export type PtyConnectResponses = {
  200: boolean;
};

export type PtyConnectResponse = PtyConnectResponses[200];

export type ConfigGetData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/config';
};

export type ConfigGetResponses = {
  200: Config;
};

export type ConfigGetResponse = ConfigGetResponses[200];

export type ConfigUpdateData = {
  body?: Config;
  path?: never;
  query?: DirectoryQuery;
  url: '/config';
};

export type ConfigUpdateErrors = {
  400: BadRequestError;
};

export type ConfigUpdateResponses = {
  200: Config;
};

export type ConfigUpdateResponse = ConfigUpdateResponses[200];

export type ToolIdsData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/experimental/tool/ids';
};

export type ToolIdsErrors = {
  400: BadRequestError;
};

export type ToolIdsResponses = {
  200: ToolIds;
};

export type ToolIdsResponse = ToolIdsResponses[200];

export type ToolListData = {
  body?: never;
  path?: never;
  query: DirectoryQuery & { provider: string; model: string };
  url: '/experimental/tool';
};

export type ToolListErrors = {
  400: BadRequestError;
};

export type ToolListResponses = {
  200: ToolList;
};

export type ToolListResponse = ToolListResponses[200];

export type InstanceDisposeData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/instance/dispose';
};

export type InstanceDisposeResponses = {
  200: boolean;
};

export type InstanceDisposeResponse = InstanceDisposeResponses[200];

export type PathGetData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/path';
};

export type PathGetResponses = {
  200: Path;
};

export type PathGetResponse = PathGetResponses[200];

export type VcsGetData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/vcs';
};

export type VcsGetResponses = {
  200: VcsInfo;
};

export type VcsGetResponse = VcsGetResponses[200];

export type SessionListData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/session';
};

export type SessionListResponses = {
  200: Array<Session>;
};

export type SessionListResponse = SessionListResponses[200];

export type SessionCreateData = {
  body?: {
    parentID?: string;
    title?: string;
  };
  path?: never;
  query?: DirectoryQuery;
  url: '/session';
};

export type SessionCreateErrors = {
  400: BadRequestError;
};

export type SessionCreateResponses = {
  200: Session;
};

export type SessionCreateResponse = SessionCreateResponses[200];

export type SessionStatusData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/session/status';
};

export type SessionStatusErrors = {
  400: BadRequestError;
};

export type SessionStatusResponses = {
  200: {
    [key: string]: SessionStatus;
  };
};

export type SessionStatusResponse = SessionStatusResponses[200];

export type SessionDeleteData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}';
};

export type SessionDeleteErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionDeleteResponses = {
  200: boolean;
};

export type SessionDeleteResponse = SessionDeleteResponses[200];

export type SessionGetData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}';
};

export type SessionGetErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionGetResponses = {
  200: Session;
};

export type SessionGetResponse = SessionGetResponses[200];

export type SessionUpdateData = {
  body?: {
    title?: string;
  };
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}';
};

export type SessionUpdateErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionUpdateResponses = {
  200: Session;
};

export type SessionUpdateResponse = SessionUpdateResponses[200];

export type SessionChildrenData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/children';
};

export type SessionChildrenErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionChildrenResponses = {
  200: Array<Session>;
};

export type SessionChildrenResponse = SessionChildrenResponses[200];

export type SessionTodoData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/todo';
};

export type SessionTodoErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionTodoResponses = {
  200: Array<Todo>;
};

export type SessionTodoResponse = SessionTodoResponses[200];

export type SessionInitData = {
  body?: {
    modelID: string;
    providerID: string;
    messageID: string;
  };
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/init';
};

export type SessionInitErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionInitResponses = {
  200: boolean;
};

export type SessionInitResponse = SessionInitResponses[200];

export type SessionForkData = {
  body?: {
    messageID?: string;
  };
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/fork';
};

export type SessionForkResponses = {
  200: Session;
};

export type SessionForkResponse = SessionForkResponses[200];

export type SessionAbortData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/abort';
};

export type SessionAbortErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionAbortResponses = {
  200: boolean;
};

export type SessionAbortResponse = SessionAbortResponses[200];

export type SessionShareData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/share';
};

export type SessionShareErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionShareResponses = {
  200: Session;
};

export type SessionShareResponse = SessionShareResponses[200];

export type SessionUnshareData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/share';
};

export type SessionUnshareErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionUnshareResponses = {
  200: Session;
};

export type SessionUnshareResponse = SessionUnshareResponses[200];

export type SessionDiffData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery & { messageID?: string };
  url: '/session/{id}/diff';
};

export type SessionDiffErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionDiffResponses = {
  200: Array<FileDiff>;
};

export type SessionDiffResponse = SessionDiffResponses[200];

export type SessionSummarizeData = {
  body?: {
    providerID: string;
    modelID: string;
  };
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/summarize';
};

export type SessionSummarizeErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionSummarizeResponses = {
  200: boolean;
};

export type SessionSummarizeResponse = SessionSummarizeResponses[200];

export type SessionMessagesData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery & { limit?: number };
  url: '/session/{id}/message';
};

export type SessionMessagesErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionMessagesResponses = {
  200: Array<MessageWithParts>;
};

export type SessionMessagesResponse = SessionMessagesResponses[200];

export type SessionPromptData = {
  body?: {
    messageID?: string;
    model?: {
      providerID: string;
      modelID: string;
    };
    agent?: string;
    noReply?: boolean;
    system?: string;
    tools?: {
      [key: string]: boolean;
    };
    parts: Array<PartInput>;
  };
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/message';
};

export type SessionPromptErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionPromptResponses = {
  200: AssistantMessageWithParts;
};

export type SessionPromptResponse = SessionPromptResponses[200];

export type SessionMessageData = {
  body?: never;
  path: { id: string; messageID: string };
  query?: DirectoryQuery;
  url: '/session/{id}/message/{messageID}';
};

export type SessionMessageErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionMessageResponses = {
  200: MessageWithParts;
};

export type SessionMessageResponse = SessionMessageResponses[200];

export type SessionPromptAsyncData = {
  body?: {
    messageID?: string;
    model?: {
      providerID: string;
      modelID: string;
    };
    agent?: string;
    noReply?: boolean;
    system?: string;
    tools?: {
      [key: string]: boolean;
    };
    parts: Array<PartInput>;
  };
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/prompt_async';
};

export type SessionPromptAsyncErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionPromptAsyncResponses = {
  204: void;
};

export type SessionPromptAsyncResponse = SessionPromptAsyncResponses[204];

export type SessionCommandData = {
  body?: {
    messageID?: string;
    agent?: string;
    model?: string;
    arguments: string;
    command: string;
  };
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/command';
};

export type SessionCommandErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionCommandResponses = {
  200: AssistantMessageWithParts;
};

export type SessionCommandResponse = SessionCommandResponses[200];

export type SessionShellData = {
  body?: {
    agent: string;
    model?: {
      providerID: string;
      modelID: string;
    };
    command: string;
  };
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/shell';
};

export type SessionShellErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionShellResponses = {
  200: AssistantMessage;
};

export type SessionShellResponse = SessionShellResponses[200];

export type SessionRevertData = {
  body?: {
    messageID: string;
    partID?: string;
  };
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/revert';
};

export type SessionRevertErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionRevertResponses = {
  200: Session;
};

export type SessionRevertResponse = SessionRevertResponses[200];

export type SessionUnrevertData = {
  body?: never;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/session/{id}/unrevert';
};

export type SessionUnrevertErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type SessionUnrevertResponses = {
  200: Session;
};

export type SessionUnrevertResponse = SessionUnrevertResponses[200];

export type PermissionReplyData = {
  body?: {
    response: PermissionResponse;
  };
  path: { id: string; permissionID: string };
  query?: DirectoryQuery;
  url: '/session/{id}/permissions/{permissionID}';
};

export type PermissionReplyErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type PermissionReplyResponses = {
  200: boolean;
};

export type PermissionReplyResponse = PermissionReplyResponses[200];

export type CommandListData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/command';
};

export type CommandListResponses = {
  200: Array<Command>;
};

export type CommandListResponse = CommandListResponses[200];

export type ConfigProvidersData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/config/providers';
};

export type ConfigProvidersResponses = {
  200: {
    providers: Array<Provider>;
    default: {
      [key: string]: string;
    };
  };
};

export type ConfigProvidersResponse = ConfigProvidersResponses[200];

export type ProviderListData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/provider';
};

export type ProviderListResponses = {
  200: {
    all: Array<{
      api?: string;
      name: string;
      env: Array<string>;
      id: string;
      npm?: string;
      models: {
        [key: string]: {
          id: string;
          name: string;
          release_date: string;
          attachment: boolean;
          reasoning: boolean;
          temperature: boolean;
          tool_call: boolean;
          cost?: {
            input: number;
            output: number;
            cache_read?: number;
            cache_write?: number;
            context_over_200k?: {
              input: number;
              output: number;
              cache_read?: number;
              cache_write?: number;
            };
          };
          limit: {
            context: number;
            output: number;
          };
          modalities?: {
            input: Array<'text' | 'audio' | 'image' | 'video' | 'pdf'>;
            output: Array<'text' | 'audio' | 'image' | 'video' | 'pdf'>;
          };
          experimental?: boolean;
          status?: 'alpha' | 'beta' | 'deprecated';
          options: {
            [key: string]: unknown;
          };
          headers?: {
            [key: string]: string;
          };
          provider?: {
            npm: string;
          };
        };
      };
    }>;
    default: {
      [key: string]: string;
    };
    connected: Array<string>;
  };
};

export type ProviderListResponse = ProviderListResponses[200];

export type ProviderAuthData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/provider/auth';
};

export type ProviderAuthResponses = {
  200: {
    [key: string]: Array<ProviderAuthMethod>;
  };
};

export type ProviderAuthResponse = ProviderAuthResponses[200];

export type ProviderOauthAuthorizeData = {
  body?: {
    method: number;
  };
  path: { id: string };
  query?: DirectoryQuery;
  url: '/provider/{id}/oauth/authorize';
};

export type ProviderOauthAuthorizeErrors = {
  400: BadRequestError;
};

export type ProviderOauthAuthorizeResponses = {
  200: ProviderAuthAuthorization;
};

export type ProviderOauthAuthorizeResponse = ProviderOauthAuthorizeResponses[200];

export type ProviderOauthCallbackData = {
  body?: {
    method: number;
    code?: string;
  };
  path: { id: string };
  query?: DirectoryQuery;
  url: '/provider/{id}/oauth/callback';
};

export type ProviderOauthCallbackErrors = {
  400: BadRequestError;
};

export type ProviderOauthCallbackResponses = {
  200: boolean;
};

export type ProviderOauthCallbackResponse = ProviderOauthCallbackResponses[200];

export type FindTextData = {
  body?: never;
  path?: never;
  query: DirectoryQuery & { pattern: string };
  url: '/find';
};

export type FindTextResponses = {
  200: Array<FindTextMatch>;
};

export type FindTextResponse = FindTextResponses[200];

export type FindFilesData = {
  body?: never;
  path?: never;
  query: DirectoryQuery & { query: string; dirs?: 'true' | 'false' };
  url: '/find/file';
};

export type FindFilesResponses = {
  200: Array<string>;
};

export type FindFilesResponse = FindFilesResponses[200];

export type FindSymbolsData = {
  body?: never;
  path?: never;
  query: DirectoryQuery & { query: string };
  url: '/find/symbol';
};

export type FindSymbolsResponses = {
  200: Array<import('./provider').Symbol>;
};

export type FindSymbolsResponse = FindSymbolsResponses[200];

export type FileListData = {
  body?: never;
  path?: never;
  query: DirectoryQuery & { path: string };
  url: '/file';
};

export type FileListResponses = {
  200: Array<FileNode>;
};

export type FileListResponse = FileListResponses[200];

export type FileReadData = {
  body?: never;
  path?: never;
  query: DirectoryQuery & { path: string };
  url: '/file/content';
};

export type FileReadResponses = {
  200: FileContent;
};

export type FileReadResponse = FileReadResponses[200];

export type FileStatusData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/file/status';
};

export type FileStatusResponses = {
  200: Array<FileChange>;
};

export type FileStatusResponse = FileStatusResponses[200];

export type AppLogData = {
  body?: {
    service: string;
    level: 'debug' | 'info' | 'error' | 'warn';
    message: string;
    extra?: {
      [key: string]: unknown;
    };
  };
  path?: never;
  query?: DirectoryQuery;
  url: '/log';
};

export type AppLogErrors = {
  400: BadRequestError;
};

export type AppLogResponses = {
  200: boolean;
};

export type AppLogResponse = AppLogResponses[200];

export type AppAgentsData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/agent';
};

export type AppAgentsResponses = {
  200: Array<Agent>;
};

export type AppAgentsResponse = AppAgentsResponses[200];

export type McpStatusData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/mcp';
};

export type McpStatusResponses = {
  200: {
    [key: string]: McpStatus;
  };
};

export type McpStatusResponse = McpStatusResponses[200];

export type McpAddData = {
  body?: {
    name: string;
    config: McpConfig;
  };
  path?: never;
  query?: DirectoryQuery;
  url: '/mcp';
};

export type McpAddErrors = {
  400: BadRequestError;
};

export type McpAddResponses = {
  200: {
    [key: string]: McpStatus;
  };
};

export type McpAddResponse = McpAddResponses[200];

export type McpAuthRemoveData = {
  body?: never;
  path: { name: string };
  query?: DirectoryQuery;
  url: '/mcp/{name}/auth';
};

export type McpAuthRemoveErrors = {
  404: NotFoundError;
};

export type McpAuthRemoveResponses = {
  200: { success: true };
};

export type McpAuthRemoveResponse = McpAuthRemoveResponses[200];

export type McpAuthStartData = {
  body?: never;
  path: { name: string };
  query?: DirectoryQuery;
  url: '/mcp/{name}/auth';
};

export type McpAuthStartErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type McpAuthStartResponses = {
  200: {
    authorizationUrl: string;
  };
};

export type McpAuthStartResponse = McpAuthStartResponses[200];

export type McpAuthCallbackData = {
  body?: {
    code: string;
  };
  path: { name: string };
  query?: DirectoryQuery;
  url: '/mcp/{name}/auth/callback';
};

export type McpAuthCallbackErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type McpAuthCallbackResponses = {
  200: McpStatus;
};

export type McpAuthCallbackResponse = McpAuthCallbackResponses[200];

export type McpAuthAuthenticateData = {
  body?: never;
  path: { name: string };
  query?: DirectoryQuery;
  url: '/mcp/{name}/auth/authenticate';
};

export type McpAuthAuthenticateErrors = {
  400: BadRequestError;
  404: NotFoundError;
};

export type McpAuthAuthenticateResponses = {
  200: McpStatus;
};

export type McpAuthAuthenticateResponse = McpAuthAuthenticateResponses[200];

export type McpConnectData = {
  body?: never;
  path: { name: string };
  query?: DirectoryQuery;
  url: '/mcp/{name}/connect';
};

export type McpConnectResponses = {
  200: boolean;
};

export type McpConnectResponse = McpConnectResponses[200];

export type McpDisconnectData = {
  body?: never;
  path: { name: string };
  query?: DirectoryQuery;
  url: '/mcp/{name}/disconnect';
};

export type McpDisconnectResponses = {
  200: boolean;
};

export type McpDisconnectResponse = McpDisconnectResponses[200];

export type LspStatusData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/lsp';
};

export type LspStatusResponses = {
  200: Array<LspStatus>;
};

export type LspStatusResponse = LspStatusResponses[200];

export type FormatterStatusData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/formatter';
};

export type FormatterStatusResponses = {
  200: Array<FormatterStatus>;
};

export type FormatterStatusResponse = FormatterStatusResponses[200];

export type TuiAppendPromptData = {
  body?: { text: string };
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/append-prompt';
};

export type TuiAppendPromptErrors = {
  400: BadRequestError;
};

export type TuiAppendPromptResponses = {
  200: boolean;
};

export type TuiAppendPromptResponse = TuiAppendPromptResponses[200];

export type TuiOpenHelpData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/open-help';
};

export type TuiOpenHelpResponses = {
  200: boolean;
};

export type TuiOpenHelpResponse = TuiOpenHelpResponses[200];

export type TuiOpenSessionsData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/open-sessions';
};

export type TuiOpenSessionsResponses = {
  200: boolean;
};

export type TuiOpenSessionsResponse = TuiOpenSessionsResponses[200];

export type TuiOpenThemesData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/open-themes';
};

export type TuiOpenThemesResponses = {
  200: boolean;
};

export type TuiOpenThemesResponse = TuiOpenThemesResponses[200];

export type TuiOpenModelsData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/open-models';
};

export type TuiOpenModelsResponses = {
  200: boolean;
};

export type TuiOpenModelsResponse = TuiOpenModelsResponses[200];

export type TuiSubmitPromptData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/submit-prompt';
};

export type TuiSubmitPromptResponses = {
  200: boolean;
};

export type TuiSubmitPromptResponse = TuiSubmitPromptResponses[200];

export type TuiClearPromptData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/clear-prompt';
};

export type TuiClearPromptResponses = {
  200: boolean;
};

export type TuiClearPromptResponse = TuiClearPromptResponses[200];

export type TuiExecuteCommandData = {
  body?: { command: string };
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/execute-command';
};

export type TuiExecuteCommandErrors = {
  400: BadRequestError;
};

export type TuiExecuteCommandResponses = {
  200: boolean;
};

export type TuiExecuteCommandResponse = TuiExecuteCommandResponses[200];

export type TuiShowToastData = {
  body?: {
    title?: string;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
  };
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/show-toast';
};

export type TuiShowToastResponses = {
  200: boolean;
};

export type TuiShowToastResponse = TuiShowToastResponses[200];

export type TuiPublishData = {
  body?:
    | import('./event').EventTuiPromptAppend
    | import('./event').EventTuiCommandExecute
    | import('./event').EventTuiToastShow;
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/publish';
};

export type TuiPublishErrors = {
  400: BadRequestError;
};

export type TuiPublishResponses = {
  200: boolean;
};

export type TuiPublishResponse = TuiPublishResponses[200];

export type TuiControlNextData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/control/next';
};

export type TuiControlNextResponses = {
  200: {
    path: string;
    body: unknown;
  };
};

export type TuiControlNextResponse = TuiControlNextResponses[200];

export type TuiControlResponseData = {
  body?: unknown;
  path?: never;
  query?: DirectoryQuery;
  url: '/tui/control/response';
};

export type TuiControlResponseResponses = {
  200: boolean;
};

export type TuiControlResponseResponse = TuiControlResponseResponses[200];

export type AuthSetData = {
  body?: Auth;
  path: { id: string };
  query?: DirectoryQuery;
  url: '/auth/{id}';
};

export type AuthSetErrors = {
  400: BadRequestError;
};

export type AuthSetResponses = {
  200: boolean;
};

export type AuthSetResponse = AuthSetResponses[200];

export type EventSubscribeData = {
  body?: never;
  path?: never;
  query?: DirectoryQuery;
  url: '/event';
};

export type EventSubscribeResponses = {
  200: import('./event').Event;
};

export type EventSubscribeResponse = EventSubscribeResponses[200];

export type ClientOptions = {
  baseUrl: `${string}://${string}` | (string & {});
};
