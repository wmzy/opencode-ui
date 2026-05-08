import { css, cx } from '@linaria/core';
import { useRef, useEffect, useCallback, useState } from 'react';
import type { Message, UserMessage, AssistantMessage } from '@/types/message';
import type { Part } from '@/types/part';
import { SessionTurn } from './session-turn';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

const containerStyle = css`
  flex: 1;
  min-height: 0;
  position: relative;
`;

const scrollContentStyle = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  padding-bottom: 80px;
  min-height: 100%;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 12px;
    padding-bottom: 60px;
    gap: 12px;
  }
`;

const loadMoreStyle = css`
  display: flex;
  justify-content: center;
  padding: 8px 0;
`;

const emptyStateStyle = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-tertiary);
  padding: 48px 16px;
  text-align: center;
  min-height: 300px;
`;

const emptyIconStyle = css`
  font-size: 3rem;
  opacity: 0.5;
`;

const emptyTitleStyle = css`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-secondary);
`;

const emptySubtitleStyle = css`
  font-size: 0.875rem;
  max-width: 400px;
`;

const scrollBottomBtnStyle = css`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  padding: 6px 12px;
  border-radius: 20px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: opacity 0.2s;

  &:hover {
    color: var(--color-text);
    background: var(--color-bg-tertiary);
  }
`;

const skeletonGroupStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  max-width: 85%;
`;

const userSkeletonStyle = css`
  align-self: flex-end;
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
  border-color: transparent;
`;

type UserActions = {
  fork?: (input: { sessionID: string; messageID: string }) => Promise<void> | void;
  revert?: (input: { sessionID: string; messageID: string }) => Promise<void> | void;
};

export type MessageTimelineProps = {
  messages: Message[];
  partsByMessage: Map<string, Part[]>;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  actions?: UserActions;
  streamingMessageID?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  className?: string;
};

function buildTurnPairs(messages: Message[]): Array<{ user: UserMessage; assistants: AssistantMessage[] }> {
  const pairs: Array<{ user: UserMessage; assistants: AssistantMessage[] }> = [];
  let currentPair: { user: UserMessage; assistants: AssistantMessage[] } | null = null;

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (currentPair) pairs.push(currentPair);
      currentPair = { user: msg as UserMessage, assistants: [] };
    } else if (msg.role === 'assistant' && currentPair) {
      currentPair.assistants.push(msg as AssistantMessage);
    }
  }

  if (currentPair) pairs.push(currentPair);
  return pairs;
}

function LoadingSkeletons() {
  return (
    <>
      <div className={cx(skeletonGroupStyle, userSkeletonStyle)}>
        <Skeleton width="60%" height="14px" />
      </div>
      <div className={skeletonGroupStyle}>
        <Skeleton width="80%" height="14px" />
        <Skeleton width="70%" height="14px" />
        <Skeleton width="50%" height="14px" />
      </div>
    </>
  );
}

export function MessageTimeline({
  messages,
  partsByMessage,
  loading = false,
  hasMore = false,
  onLoadMore,
  actions,
  streamingMessageID,
  emptyTitle = 'Start a conversation',
  emptySubtitle = 'Send a message to begin chatting with the AI assistant.',
  className,
}: MessageTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const autoScrollRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollBottom(!isNearBottom);
    autoScrollRef.current = isNearBottom;
  }, []);

  useEffect(() => {
    if (autoScrollRef.current && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (autoScrollRef.current) {
      scrollToBottom();
    }
  }, [partsByMessage, scrollToBottom]);

  const turnPairs = buildTurnPairs(messages);

  if (!loading && messages.length === 0) {
    return (
      <div className={cx(containerStyle, className)}>
        <div className={emptyStateStyle}>
          <div className={emptyIconStyle}>💬</div>
          <div className={emptyTitleStyle}>{emptyTitle}</div>
          <div className={emptySubtitleStyle}>{emptySubtitle}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx(containerStyle, className)}>
      <ScrollArea className={css`height: 100%;`} onScroll={handleScroll}>
        <div ref={scrollRef} style={{ height: '100%', overflow: 'auto' }}>
          <div ref={contentRef} className={scrollContentStyle}>
            {hasMore && (
              <div className={loadMoreStyle}>
                <Button variant="ghost" size="sm" onClick={onLoadMore}>
                  Load earlier messages
                </Button>
              </div>
            )}
            {turnPairs.map((pair) => {
              const isStreaming = pair.assistants.some(
                (a) => a.time?.completed === undefined || a.id === streamingMessageID,
              );
              const assistantPartsMap = new Map<string, Part[]>();
              for (const a of pair.assistants) {
                const p = partsByMessage.get(a.id);
                if (p) assistantPartsMap.set(a.id, p);
              }

              return (
                <div key={pair.user.id}>
                  <SessionTurn
                    message={pair.user}
                    parts={partsByMessage.get(pair.user.id) ?? []}
                    actions={actions}
                  />
                  {pair.assistants.length > 0 && (
                    <SessionTurn
                      message={pair.assistants[0]}
                      parts={[]}
                      assistantMessages={pair.assistants}
                      assistantParts={assistantPartsMap}
                      isStreaming={isStreaming}
                      summaryDiffs={(pair.user as import('@/types/message').UserMessage).summary?.diffs}
                    />
                  )}
                </div>
              );
            })}
            {loading && <LoadingSkeletons />}
          </div>
        </div>
      </ScrollArea>
      {showScrollBottom && (
        <button className={scrollBottomBtnStyle} onClick={scrollToBottom}>
          ↓ New messages
        </button>
      )}
    </div>
  );
}
