import { css } from '@linaria/core';
import { useState } from 'react';
import { useServer, type ServerConfig } from '@/context/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible } from '@/components/ui/collapsible';

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 32px 48px;
  max-width: 720px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const sectionTitleStyle = css`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  padding-bottom: 8px;
`;

const serverListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const serverCardStyle = css`
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  overflow: hidden;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--color-border-focus);
  }

  &[data-active='true'] {
    border-color: var(--color-accent);
  }
`;

const serverTriggerStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  color: var(--color-text);
`;

const serverInfoStyle = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const serverNameStyle = css`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const activeBadgeStyle = css`
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--color-accent);
  color: #fff;
  flex-shrink: 0;
`;

const serverUrlStyle = css`
  font-size: 12px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const serverBodyStyle = css`
  padding: 0 14px 14px;
  border-top: 1px solid var(--color-border);
`;

const serverActionsStyle = css`
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 12px;
`;

const formStyle = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
`;

const formRowStyle = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const formActionsStyle = css`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const emptyStateStyle = css`
  color: var(--color-text-tertiary);
  font-size: 14px;
  text-align: center;
  padding: 2rem 0;
`;

const addFormSectionStyle = css`
  margin-bottom: 12px;
`;

type FormData = {
  name: string;
  url: string;
  username: string;
  password: string;
};

const emptyForm: FormData = { name: '', url: '', username: '', password: '' };

function extractHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function ServerAccordion({
  server,
  isActive,
  onConnect,
  onRemove,
}: {
  server: ServerConfig;
  isActive: boolean;
  onConnect: () => void;
  onRemove: () => void;
}) {
  const { updateServer } = useServer();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);

  const startEdit = () => {
    setForm({
      name: server.name,
      url: server.url,
      username: server.username ?? '',
      password: server.password ?? '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(emptyForm);
  };

  const handleSave = () => {
    const trimmedUrl = form.url.trim().replace(/\/+$/, '');
    if (!trimmedUrl) return;
    const serverName = form.name.trim() || extractHost(trimmedUrl);
    updateServer(server.id, {
      name: serverName,
      url: trimmedUrl,
      username: form.username.trim() || undefined,
      password: form.password.trim() || undefined,
    });
    cancelEdit();
  };

  const handleUrlChange = (value: string) => {
    setForm(f => {
      const next = { ...f, url: value };
      if (!f.name) {
        next.name = extractHost(value);
      }
      return next;
    });
  };

  return (
    <Collapsible
      className={serverCardStyle}
      trigger={(
        <div className={serverTriggerStyle}>
          <div className={serverInfoStyle}>
            <span className={serverNameStyle}>
              {server.name}
              {isActive && <span className={activeBadgeStyle}>Active</span>}
            </span>
            <span className={serverUrlStyle}>{server.url}</span>
          </div>
        </div>
      )}
    >
      <div className={serverBodyStyle} style={isActive ? { borderImage: 'none' } : undefined}>
        {!editing && (
          <div className={serverActionsStyle}>
            {!isActive && (
              <Button size="sm" variant="ghost" onClick={onConnect}>
                Connect
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={startEdit}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={onRemove}>
              Delete
            </Button>
          </div>
        )}
        {editing && (
          <ServerForm
            form={form}
            setForm={setForm}
            onUrlChange={handleUrlChange}
            onSave={handleSave}
            onCancel={cancelEdit}
            submitLabel="Save"
          />
        )}
      </div>
    </Collapsible>
  );
}

export function SettingsServers() {
  const { servers, activeId, addServer, removeServer, setActive } = useServer();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);

  const handleUrlChange = (value: string) => {
    setForm(f => {
      const next = { ...f, url: value };
      if (!f.name) {
        next.name = extractHost(value);
      }
      return next;
    });
  };

  const handleAdd = () => {
    const trimmedUrl = form.url.trim().replace(/\/+$/, '');
    if (!trimmedUrl) return;
    const serverName = form.name.trim() || extractHost(trimmedUrl);
    addServer({
      name: serverName,
      url: trimmedUrl,
      username: form.username.trim() || undefined,
      password: form.password.trim() || undefined,
    });
    setForm(emptyForm);
    setShowAddForm(false);
  };

  const cancelAdd = () => {
    setForm(emptyForm);
    setShowAddForm(false);
  };

  return (
    <div className={containerStyle}>
      <div>
        <h3 className={sectionTitleStyle}>Servers</h3>
        <Button size="sm" variant="secondary" onClick={() => setShowAddForm(prev => !prev)} style={{ marginTop: 8 }}>
          {showAddForm ? '− Cancel' : '+ Add Server'}
        </Button>

        {showAddForm && (
          <div className={addFormSectionStyle}>
            <ServerForm
              form={form}
              setForm={setForm}
              onUrlChange={handleUrlChange}
              onSave={handleAdd}
              onCancel={cancelAdd}
              submitLabel="Add"
            />
          </div>
        )}

        {servers.length === 0 && !showAddForm && (
          <div className={emptyStateStyle}>No servers configured</div>
        )}

        <div className={serverListStyle}>
          {servers.map(server => (
            <ServerAccordion
              key={server.id}
              server={server}
              isActive={server.id === activeId}
              onConnect={() => setActive(server.id)}
              onRemove={() => removeServer(server.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ServerForm({
  form,
  setForm,
  onUrlChange,
  onSave,
  onCancel,
  submitLabel,
}: {
  form: FormData;
  setForm: (fn: (prev: FormData) => FormData) => void;
  onUrlChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className={formStyle}>
      <Input
        label="Server URL"
        placeholder="http://localhost:4099"
        value={form.url}
        onChange={e => onUrlChange(e.currentTarget.value)}
        size="sm"
      />
      <Input
        label="Name"
        placeholder="My Server"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.currentTarget.value }))}
        size="sm"
      />
      <div className={formRowStyle}>
        <Input
          label="Username"
          placeholder="Optional"
          value={form.username}
          onChange={e => setForm(f => ({ ...f, username: e.currentTarget.value }))}
          size="sm"
        />
        <Input
          label="Password"
          placeholder="Optional"
          type="password"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.currentTarget.value }))}
          size="sm"
        />
      </div>
      <div className={formActionsStyle}>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={onSave} disabled={!form.url.trim()}>{submitLabel}</Button>
      </div>
    </div>
  );
}
