import { css, cx } from '@linaria/core';
import { useState, useEffect, useCallback } from 'react';
import { useSdk } from '@/context/sdk';
import { Button } from '@/components/ui/button';

type QuestionItem = {
  id: string;
  sessionID: string;
  messageID: string;
  text: string;
  time: {
    created: number;
  };
};

type QuestionDockProps = {
  sessionId: string;
  className?: string;
};

const dockStyle = css`
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 240px;
  overflow-y: auto;
`;

const questionCardStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
`;

const questionTextStyle = css`
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.5;
`;

const questionActionsStyle = css`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const inputStyle = css`
  flex: 1;
  padding: 6px 10px;
  font-size: 13px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: var(--color-accent);
  }
`;

export function SessionQuestionDock({ sessionId, className }: QuestionDockProps) {
  const { client } = useSdk();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const data = (await client.question.list()) as QuestionItem[];
        if (!active) return;
        const filtered = data.filter((q) => q.sessionID === sessionId);
        setQuestions(filtered);
      } catch {
        // polling failure - retry next interval
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [client, sessionId]);

  const handleReply = useCallback(
    async (questionId: string) => {
      const answer = responses[questionId]?.trim();
      if (!answer) return;
      try {
        await client.question.reply(questionId, { body: { answers: [answer] } });
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        setResponses((prev) => {
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
      } catch {
        // reply failure - user can retry
      }
    },
    [client, responses],
  );

  const handleReject = useCallback(
    async (questionId: string) => {
      try {
        await client.question.reject(questionId);
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      } catch {
        // reject failure - user can retry
      }
    },
    [client],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, questionId: string) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleReply(questionId);
      }
    },
    [handleReply],
  );

  if (questions.length === 0) return null;

  return (
    <div className={cx(dockStyle, className)}>
      {questions.map((q) => (
        <div key={q.id} className={questionCardStyle}>
          <div className={questionTextStyle}>{q.text}</div>
          <div className={questionActionsStyle}>
            <input
              className={inputStyle}
              placeholder="Type your answer…"
              value={responses[q.id] ?? ''}
              onChange={(e) =>
                setResponses((prev) => ({ ...prev, [q.id]: e.target.value }))}
              onKeyDown={(e) => handleKeyDown(e, q.id)}
            />
            <Button size="sm" onClick={() => handleReply(q.id)}>
              Send
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleReject(q.id)}>
              Skip
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
