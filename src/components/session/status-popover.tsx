import { css, cx } from '@linaria/core';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useServer } from '@/context/server';
import { useSdk } from '@/context/sdk';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

const triggerWrapperStyle = css`
  position: relative;
`;

const triggerBtnStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 0.15s;
  cursor: pointer;
  color: var(--color-text-secondary);
  background: none;
  border: none;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }
`;

const statusDotStyle = css`
  position: absolute;
  top: -1px;
  right: -1px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
`;

const popoverStyle = css`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  width: 360px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
`;

const tabListStyle = css`
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--color-border);
  padding: 0 12px;
`;

const tabStyle = css`
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;

  &:hover {
    color: var(--color-text);
  }

  &[data-active='true'] {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
  }
`;

const panelStyle = css`
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
`;

const serverRowStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const serverInfoStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const serverUrlStyle = css`
  font-size: 13px;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const serverStatusStyle = css`
  font-size: 11px;
  color: var(--color-text-tertiary);
`;

const statusDotLargeStyle = css`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const itemRowStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  transition: background-color 0.15s;

  &:hover {
    background: var(--color-bg-tertiary);
  }
`;

const itemNameStyle = css`
  font-size: 13px;
  color: var(--color-text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const emptyStyle = css`
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 24px 12px;
`;

type McpStatus = {
  status: 'connected' | 'disconnected' | 'failed' | 'needs_auth';
};

type LspItem = {
  id: string;
  name: string;
  status: 'connected' | 'error';
};

type ConfigData = {
  plugin?: string[];
};

export function StatusPopover() {
  const { status: serverStatus, active } = useServer();
  const { client } = useSdk();
  const [open, setOpen] = useState(false);
  const [mcpData, setMcpData] = useState<Record<string, McpStatus> | null>(null);
  const [lspData, setLspData] = useState<LspItem[] | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mcp, lsp, config] = await Promise.all([
        client.mcp.status() as Promise<Record<string, McpStatus>>,
        client.lsp.status() as Promise<LspItem[]>,
        client.config.get() as Promise<ConfigData>,
      ]);
      setMcpData(mcp);
      setLspData(lsp);
      setConfigData(config);
    } catch {
      // ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleMcpToggle = useCallback(
    async (name: string) => {
      const currentStatus = mcpData?.[name]?.status;
      try {
        if (currentStatus === 'connected') {
          await client.mcp.disconnect(name);
        } else {
          await client.mcp.connect(name);
        }
        await fetchData();
      } catch {
        // ignore toggle errors
      }
    },
    [client, mcpData, fetchData],
  );

  const statusDotColor =
    serverStatus === 'connected'
      ? 'var(--color-success)'
      : serverStatus === 'disconnected' || serverStatus === 'error'
        ? 'var(--color-error)'
        : 'var(--color-text-tertiary)';

  const mcpConnectedCount = mcpData
    ? Object.values(mcpData).filter((m) => m.status === 'connected').length
    : 0;

  const lspCount = lspData?.length ?? 0;
  const pluginCount = configData?.plugin?.length ?? 0;

  const getMcpStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'var(--color-success)';
      case 'failed':
        return 'var(--color-error)';
      case 'needs_auth':
        return 'var(--color-warning)';
      default:
        return 'var(--color-text-tertiary)';
    }
  };

  const getLspStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'var(--color-success)';
      case 'error':
        return 'var(--color-error)';
      default:
        return 'var(--color-text-tertiary)';
    }
  };

  return (
    <div className={triggerWrapperStyle} ref={wrapperRef}>
      <button
        className={triggerBtnStyle}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Status"
        type="button"
      >
        <div style={{ position: 'relative', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6" />
            <circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="none" />
          </svg>
          <div className={statusDotStyle} style={{ background: statusDotColor }} />
        </div>
      </button>
      {open && (
        <div className={popoverStyle}>
          <Tabs defaultValue="servers">
            <TabList className={tabListStyle}>
              <Tab value="servers" className={tabStyle}>
                Servers
              </Tab>
              <Tab value="mcp" className={tabStyle}>
                {mcpConnectedCount > 0 ? `${mcpConnectedCount} ` : ''}MCP
              </Tab>
              <Tab value="lsp" className={tabStyle}>
                {lspCount > 0 ? `${lspCount} ` : ''}LSP
              </Tab>
              <Tab value="plugins" className={tabStyle}>
                {pluginCount > 0 ? `${pluginCount} ` : ''}Plugins
              </Tab>
            </TabList>

            <TabPanel value="servers" className={panelStyle}>
              <div className={serverRowStyle}>
                <div
                  className={statusDotLargeStyle}
                  style={{ background: statusDotColor }}
                />
                <div className={serverInfoStyle}>
                  <div className={serverUrlStyle}>{active.url}</div>
                  <div className={serverStatusStyle}>
                    {serverStatus === 'connected'
                      ? 'Connected'
                      : serverStatus === 'connecting'
                        ? 'Connecting...'
                        : serverStatus === 'disconnected'
                          ? 'Disconnected'
                          : 'Error'}
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="mcp" className={panelStyle}>
              {!mcpData || loading ? (
                <div className={emptyStyle}>Loading...</div>
              ) : Object.keys(mcpData).length === 0 ? (
                <div className={emptyStyle}>No MCP servers configured</div>
              ) : (
                Object.entries(mcpData).map(([name, data]) => (
                  <div key={name} className={itemRowStyle}>
                    <div
                      className={statusDotLargeStyle}
                      style={{ background: getMcpStatusColor(data.status) }}
                    />
                    <span className={itemNameStyle}>{name}</span>
                    <Switch
                      checked={data.status === 'connected'}
                      onCheckedChange={() => handleMcpToggle(name)}
                      size="sm"
                    />
                  </div>
                ))
              )}
            </TabPanel>

            <TabPanel value="lsp" className={panelStyle}>
              {!lspData || loading ? (
                <div className={emptyStyle}>Loading...</div>
              ) : lspData.length === 0 ? (
                <div className={emptyStyle}>No LSP servers running</div>
              ) : (
                lspData.map((item) => (
                  <div key={item.id} className={itemRowStyle}>
                    <div
                      className={statusDotLargeStyle}
                      style={{ background: getLspStatusColor(item.status) }}
                    />
                    <span className={itemNameStyle}>{item.name || item.id}</span>
                  </div>
                ))
              )}
            </TabPanel>

            <TabPanel value="plugins" className={panelStyle}>
              {!configData || loading ? (
                <div className={emptyStyle}>Loading...</div>
              ) : !configData.plugin || configData.plugin.length === 0 ? (
                <div className={emptyStyle}>No plugins enabled</div>
              ) : (
                configData.plugin.map((plugin) => (
                  <div key={plugin} className={itemRowStyle}>
                    <div
                      className={statusDotLargeStyle}
                      style={{ background: 'var(--color-success)' }}
                    />
                    <span className={itemNameStyle}>{plugin}</span>
                  </div>
                ))
              )}
            </TabPanel>
          </Tabs>
        </div>
      )}
    </div>
  );
}
