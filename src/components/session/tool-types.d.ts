export type ToolRendererProps = {
  input: Record<string, unknown>;
  metadata: Record<string, unknown>;
  tool: string;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
  defaultOpen?: boolean;
};

export type ToolRenderer = (props: ToolRendererProps) => React.ReactElement | null;
