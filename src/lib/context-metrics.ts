import type { Message, AssistantMessage } from '@/types/message';
import type { Part } from '@/types/part';

export type ContextMetrics = {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalCost: number;
  messageCount: number;
  userCount: number;
  assistantCount: number;
  lastAssistant: AssistantMessage | undefined;
  providerID: string | undefined;
  modelID: string | undefined;
  usagePercent: number | null;
};

export type ContextBreakdown = {
  key: BreakdownKey;
  tokens: number;
  width: number;
  percent: number;
};

type BreakdownKey = 'system' | 'user' | 'assistant' | 'tool' | 'other';

const BREAKDOWN_KEYS: BreakdownKey[] = ['system', 'user', 'assistant', 'tool', 'other'];

const tokenTotal = (msg: AssistantMessage): number => {
  return (
    msg.tokens.input +
    msg.tokens.output +
    msg.tokens.reasoning +
    msg.tokens.cache.read +
    msg.tokens.cache.write
  );
};

const lastAssistantWithTokens = (messages: Message[]): AssistantMessage | undefined => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant') continue;
    if (tokenTotal(msg) <= 0) continue;
    return msg;
  }
  return undefined;
};

export function computeContextMetrics(
  messages: Message[],
  contextLimit?: number,
): ContextMetrics {
  const result: ContextMetrics = {
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalCost: 0,
    messageCount: messages.length,
    userCount: 0,
    assistantCount: 0,
    lastAssistant: undefined,
    providerID: undefined,
    modelID: undefined,
    usagePercent: null,
  };

  for (const msg of messages) {
    if (msg.role === 'user') {
      result.userCount += 1;
    } else if (msg.role === 'assistant') {
      result.assistantCount += 1;
      result.totalCost += msg.cost;
      result.inputTokens += msg.tokens.input;
      result.outputTokens += msg.tokens.output;
      result.reasoningTokens += msg.tokens.reasoning;
      result.cacheReadTokens += msg.tokens.cache.read;
      result.cacheWriteTokens += msg.tokens.cache.write;
    }
  }

  result.totalTokens =
    result.inputTokens +
    result.outputTokens +
    result.reasoningTokens +
    result.cacheReadTokens +
    result.cacheWriteTokens;

  const last = lastAssistantWithTokens(messages);
  result.lastAssistant = last;
  if (last) {
    result.providerID = last.providerID;
    result.modelID = last.modelID;
    if (contextLimit && contextLimit > 0) {
      const lastTotal = tokenTotal(last);
      result.usagePercent = Math.round((lastTotal / contextLimit) * 100);
    }
  }

  return result;
}

const estimateTokens = (chars: number): number => Math.ceil(chars / 4);

const charsFromUserPart = (part: Part): number => {
  if (part.type === 'text') return part.text.length;
  if (part.type === 'file') return part.source?.text.value.length ?? 0;
  if (part.type === 'agent') return part.source?.value.length ?? 0;
  return 0;
};

const charsFromAssistantPart = (
  part: Part,
): { assistant: number; tool: number } => {
  if (part.type === 'text') return { assistant: part.text.length, tool: 0 };
  if (part.type === 'reasoning') return { assistant: part.text.length, tool: 0 };
  if (part.type !== 'tool') return { assistant: 0, tool: 0 };

  const input = Object.keys(part.state.input).length * 16;
  if (part.state.status === 'pending')
    return { assistant: 0, tool: input + part.state.raw.length };
  if (part.state.status === 'completed')
    return { assistant: 0, tool: input + part.state.output.length };
  if (part.state.status === 'error')
    return { assistant: 0, tool: input + part.state.error.length };
  return { assistant: 0, tool: input };
};

export function computeContextBreakdown(
  parts: Part[],
  inputTokens: number,
): ContextBreakdown[] {
  if (!inputTokens || parts.length === 0) return [];

  let userChars = 0;
  let assistantChars = 0;
  let toolChars = 0;

  for (const part of parts) {
    if (part.type === 'text' || part.type === 'file' || part.type === 'agent') {
      userChars += charsFromUserPart(part);
    }
    const assistantResult = charsFromAssistantPart(part);
    assistantChars += assistantResult.assistant;
    toolChars += assistantResult.tool;
  }

  const tokens = {
    system: 0,
    user: estimateTokens(userChars),
    assistant: estimateTokens(assistantChars),
    tool: estimateTokens(toolChars),
  };

  const estimated =
    tokens.user + tokens.assistant + tokens.tool;

  let scaled: Record<BreakdownKey, number>;
  if (estimated <= inputTokens) {
    scaled = { ...tokens, other: inputTokens - estimated };
  } else {
    const scale = inputTokens / estimated;
    const s = {
      system: 0,
      user: Math.floor(tokens.user * scale),
      assistant: Math.floor(tokens.assistant * scale),
      tool: Math.floor(tokens.tool * scale),
    };
    const total = s.system + s.user + s.assistant + s.tool;
    scaled = { ...s, other: Math.max(0, inputTokens - total) };
  }

  return BREAKDOWN_KEYS
    .map((key) => ({
      key,
      tokens: scaled[key],
      width: (scaled[key] / inputTokens) * 100,
      percent: Math.round((scaled[key] / inputTokens) * 1000) / 10,
    }))
    .filter((x) => x.tokens > 0);
}

export function computeContextBreakdownFromMessages(
  messages: Message[],
  partsByMessage: Map<string, Part[]>,
  inputTokens: number,
  systemPrompt?: string,
): ContextBreakdown[] {
  if (!inputTokens || messages.length === 0) return [];

  let userChars = 0;
  let assistantChars = 0;
  let toolChars = 0;

  for (const msg of messages) {
    const parts = partsByMessage.get(msg.id) ?? [];
    if (msg.role === 'user') {
      for (const part of parts) {
        userChars += charsFromUserPart(part);
      }
    } else if (msg.role === 'assistant') {
      for (const part of parts) {
        const r = charsFromAssistantPart(part);
        assistantChars += r.assistant;
        toolChars += r.tool;
      }
    }
  }

  const systemChars = systemPrompt?.length ?? 0;

  const tokens = {
    system: estimateTokens(systemChars),
    user: estimateTokens(userChars),
    assistant: estimateTokens(assistantChars),
    tool: estimateTokens(toolChars),
  };

  const estimated =
    tokens.system + tokens.user + tokens.assistant + tokens.tool;

  let scaled: Record<BreakdownKey, number>;
  if (estimated <= inputTokens) {
    scaled = { ...tokens, other: inputTokens - estimated };
  } else {
    const scale = inputTokens / estimated;
    const s = {
      system: Math.floor(tokens.system * scale),
      user: Math.floor(tokens.user * scale),
      assistant: Math.floor(tokens.assistant * scale),
      tool: Math.floor(tokens.tool * scale),
    };
    const total = s.system + s.user + s.assistant + s.tool;
    scaled = { ...s, other: Math.max(0, inputTokens - total) };
  }

  return BREAKDOWN_KEYS
    .map((key) => ({
      key,
      tokens: scaled[key],
      width: (scaled[key] / inputTokens) * 100,
      percent: Math.round((scaled[key] / inputTokens) * 1000) / 10,
    }))
    .filter((x) => x.tokens > 0);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === undefined || value === null) return '—';
  return value.toLocaleString();
}

export function formatPercent(value: number | null | undefined): string {
  if (value === undefined || value === null) return '—';
  return `${value.toLocaleString()}%`;
}

export function formatCost(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
