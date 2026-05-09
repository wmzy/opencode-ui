import { css, cx } from '@linaria/core';
import { useMemo } from 'react';
import type { Message } from '@/types/message';
import type { Part } from '@/types/part';
import type { Session } from '@/types/session';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CircularProgress } from '@/components/ui/circular-progress';
import {
  computeContextMetrics,
  computeContextBreakdownFromMessages,
  formatNumber,
  formatPercent,
  formatCost,
  type ContextBreakdown,
} from '@/lib/context-metrics';

type SessionContextTabProps = {
  messages: Message[];
  partsByMessage: Map<string, Part[]>;
  session?: Session;
  className?: string;
};

const BREAKDOWN_COLORS: Record<string, string> = {
  system: 'var(--color-info)',
  user: 'var(--color-success)',
  assistant: 'var(--color-accent)',
  tool: 'var(--color-warning)',
  other: 'var(--color-text-tertiary)',
};

const BREAKDOWN_LABELS: Record<string, string> = {
  system: 'System',
  user: 'User',
  assistant: 'Assistant',
  tool: 'Tool',
  other: 'Other',
};

const containerStyle = css`
  height: 100%;
  padding: 16px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const statsGridStyle = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 32rem) {
    grid-template-columns: 1fr 1fr;
  }
`;

const statStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const statLabelStyle = css`
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary);
`;

const statValueStyle = css`
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
`;

const sectionTitleStyle = css`
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
`;

const usageSectionStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const usageLabelStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const usageTitleStyle = css`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
`;

const usageSubtitleStyle = css`
  font-size: 11px;
  color: var(--color-text-tertiary);
`;

const breakdownSectionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const breakdownBarStyle = css`
  height: 8px;
  width: 100%;
  border-radius: 9999px;
  background-color: var(--color-bg-tertiary);
  overflow: hidden;
  display: flex;
`;

const legendStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
`;

const legendItemStyle = css`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
`;

const legendDotStyle = css`
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
`;

const legendPercentStyle = css`
  color: var(--color-text-tertiary);
`;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={statStyle}>
      <div className={statLabelStyle}>{label}</div>
      <div className={statValueStyle}>{value}</div>
    </div>
  );
}

function BreakdownBar({ segments }: { segments: ContextBreakdown[] }) {
  return (
    <div className={breakdownBarStyle}>
      {segments.map((segment) => (
        <div
          key={segment.key}
          style={{
            width: `${segment.width}%`,
            backgroundColor: BREAKDOWN_COLORS[segment.key],
            height: '100%',
          }}
        />
      ))}
    </div>
  );
}

function BreakdownLegend({ segments }: { segments: ContextBreakdown[] }) {
  return (
    <div className={legendStyle}>
      {segments.map((segment) => (
        <div key={segment.key} className={legendItemStyle}>
          <div
            className={legendDotStyle}
            style={{ backgroundColor: BREAKDOWN_COLORS[segment.key] }}
          />
          <span>{BREAKDOWN_LABELS[segment.key]}</span>
          <span className={legendPercentStyle}>{segment.percent}%</span>
        </div>
      ))}
    </div>
  );
}

export function SessionContextTab({
  messages,
  partsByMessage,
  session,
  className,
}: SessionContextTabProps) {
  const metrics = useMemo(
    () => computeContextMetrics(messages),
    [messages],
  );

  const breakdown = useMemo(() => {
    if (!metrics.lastAssistant) return [];
    const inputTokens = metrics.lastAssistant.tokens.input;
    if (!inputTokens) return [];
    return computeContextBreakdownFromMessages(
      messages,
      partsByMessage,
      inputTokens,
      undefined,
    );
  }, [messages, partsByMessage, metrics.lastAssistant]);

  const lastAssistant = metrics.lastAssistant;

  return (
    <ScrollArea className={cx(containerStyle, className)}>
      <div className={statsGridStyle}>
        <Stat label="Session" value={session?.title ?? '—'} />
        <Stat label="Messages" value={formatNumber(metrics.messageCount)} />
        <Stat label="Provider" value={metrics.providerID ?? '—'} />
        <Stat label="Model" value={metrics.modelID ?? '—'} />
        <Stat label="Total tokens" value={formatNumber(metrics.totalTokens)} />
        <Stat
          label="Input tokens"
          value={formatNumber(metrics.inputTokens)}
        />
        <Stat
          label="Output tokens"
          value={formatNumber(metrics.outputTokens)}
        />
        <Stat
          label="Reasoning tokens"
          value={formatNumber(metrics.reasoningTokens)}
        />
        <Stat
          label="Cache read tokens"
          value={formatNumber(metrics.cacheReadTokens)}
        />
        <Stat
          label="Cache write tokens"
          value={formatNumber(metrics.cacheWriteTokens)}
        />
        <Stat label="User messages" value={formatNumber(metrics.userCount)} />
        <Stat
          label="Assistant messages"
          value={formatNumber(metrics.assistantCount)}
        />
        <Stat label="Total cost" value={formatCost(metrics.totalCost)} />
        <Stat
          label="Usage"
          value={formatPercent(metrics.usagePercent)}
        />
        {lastAssistant && (
          <Stat
            label="Last activity"
            value={
              lastAssistant.time.completed
                ? new Date(lastAssistant.time.completed).toLocaleString()
                : new Date(lastAssistant.time.created).toLocaleString()
            }
          />
        )}
      </div>

      {metrics.usagePercent != null && (
        <div>
          <div className={sectionTitleStyle}>Token usage</div>
          <div className={usageSectionStyle}>
            <CircularProgress percentage={metrics.usagePercent} size={56} strokeWidth={4} />
            <div className={usageLabelStyle}>
              <span className={usageTitleStyle}>
                {formatPercent(metrics.usagePercent)} of context window
              </span>
              <span className={usageSubtitleStyle}>
                {formatNumber(metrics.inputTokens)} input tokens
              </span>
            </div>
          </div>
        </div>
      )}

      {breakdown.length > 0 && (
        <div className={breakdownSectionStyle}>
          <div className={sectionTitleStyle}>Context breakdown</div>
          <BreakdownBar segments={breakdown} />
          <BreakdownLegend segments={breakdown} />
        </div>
      )}
    </ScrollArea>
  );
}
