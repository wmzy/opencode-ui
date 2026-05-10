// wyw-in-js follows all value imports from Linaria-using .tsx files and parses
// them with Babel. This file must contain only Babel-compatible syntax (no
// TypeScript-specific keywords like `export type` or `import type`).
// Types live in tool-types.d.ts.

/** @type {Map<string, {name: string, render: Function}>} */
const registry = new Map();

/**
 * @param {{ name: string, render: Function }} spec
 */
export function registerTool(spec) {
  registry.set(spec.name, spec);
}

/**
 * @param {string} name
 * @returns {Function | undefined}
 */
export function getToolRenderer(name) {
  return registry.get(name)?.render;
}

/**
 * @returns {string[]}
 */
export function getRegisteredTools() {
  return Array.from(registry.keys());
}
