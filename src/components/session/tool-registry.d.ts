import type { ToolRenderer } from './tool-types';

export function registerTool(spec: { name: string; render: ToolRenderer }): void;
export function getToolRenderer(name: string): ToolRenderer | undefined;
export function getRegisteredTools(): string[];
