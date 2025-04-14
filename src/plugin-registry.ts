import { LLMModelDefinition } from "./llm-model-definition";
import { LLMModelConfiguration } from "./llm-model-configuration";
import { LLMAdapter } from "./llm-adapter";
import { MessageAI } from "./message-ai";
import { ClientToolContext } from "./client-tool-context";
import { PrismaClient } from "@prisma/client";

interface ToolParameter {
  name: string;
  type:
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "array"
    | "object"
    | "null"; // Define the type of the parameter
  description: string;
  required?: boolean | true; // Optional, defaults to true
  enum?: any[]; // Optional enum of allowed values
  default?: any; // Optional default value
}

const sortTools = (
  a: { id: string; category: string | undefined },
  b: { id: string; category: string | undefined }
) => {
  // Define the order for categories
  const categoryOrder = (category?: string) => {
    if (category === "system") return 0; // 'system' category has highest priority
    if (category === undefined) return 2; // Undefined categories have lowest priority
    return 1; // All other categories
  };

  const orderA = categoryOrder(a.category);
  const orderB = categoryOrder(b.category);

  // Compare based on category order
  if (orderA !== orderB) {
    return orderA - orderB;
  }

  // If categories are the same, sort by 'id'
  return a.id.localeCompare(b.id);
};

/************
 * Utility function to reorder arguments based on the parameter definitions
 *
 * This function takes the parameters defined in the server tool and the args
 * passed to the tool, and reorders the args to match the order of the parameters.
 *
 * Necessary because some LLMs (ahem, Gemini) do not always send args in right order.
 */
function reorderArgs(parameters: ToolParameter[], args: Record<string, any>) {
  return parameters.map((parameter) => {
    if (!(parameter.name in args) && parameter.required !== false) {
      // If the parameter is not in args and is required, throw an error
      throw new Error(`Missing argument for parameter "${parameter.name}"`);
    }
    return args[parameter.name];
  });
}

/************
 * Server Tools
 *
 * These are tools that run on the server and can be called by the client.
 * They are registered in the plugin registry and can be called by name.
 *
 * The server tools are used to perform actions that require server-side processing,
 * such as database queries, API calls, etc.
 */

interface ServerTool {
  name: string;
  category?: string;
  description: string;
  parameters?: ToolParameter[];
  function: (this: ServerToolContext, ...args: any[]) => any; // Define 'this' type
}

const registeredServerTools: Record<string, ServerTool> = {};

export function registerServerTool(tool: ServerTool) {
  registeredServerTools[tool.name] = tool;
}

export function getServerToolList() {
  return Object.values(registeredServerTools)
    .map((tool) => ({
      id: tool.name,
      category: tool.category,
      description: tool.description,
    }))
    .sort(sortTools); // Sort the tools by category and id
}

export function getServerTools() {
  return registeredServerTools;
}

export interface ServerToolContext {
  user: { id: string; now: Date; timeZone: string };
  agent: { id: string; name: string };
  db: PrismaClient;
}

export function callServerTool(
  toolName: string,
  context: ServerToolContext,
  args: Record<string, any>
) {
  const tool = registeredServerTools[toolName];
  if (!tool) {
    throw new Error(`Tool "${toolName}" not found.`);
  }

  // Re-order args based on the order defined in tool.parameters
  const orderedArgs = reorderArgs(tool.parameters || [], args);

  return tool.function.call(context, ...orderedArgs);
}

/************
 * Server Data Tools
 *
 * These are tools that run on the server that provide additional instructions.
 * They are registered in the plugin registry and can be called by name.
 *
 */

interface ServerDataTool {
  name: string;
  category?: string; // Optional category for sorting
  description: string;
  parameters?: ToolParameter[];
  function: (this: ServerDataToolContext, ...args: any[]) => any; // Define 'this' type
}

const registeredServerDataTools: Record<string, ServerDataTool> = {};

export function registerServerDataTool(tool: ServerDataTool) {
  registeredServerDataTools[tool.name] = tool;
}

export function getServerDataToolList() {
  return Object.values(registeredServerDataTools)
    .map((tool) => ({
      id: tool.name,
      category: tool.category,
      description: tool.description,
    }))
    .sort(sortTools); // Sort the tools by category and id
}

export function getServerDataTools() {
  return registeredServerDataTools;
}

export interface ServerDataToolContext {
  user: { id: string; now: Date; timeZone: string };
  agent: { id: string; name: string };
  messages: MessageAI[];
  db: PrismaClient;
}

export function callServerDataTool(
  toolName: string,
  context: ServerDataToolContext,
  args: Record<string, any>
) {
  const tool = registeredServerDataTools[toolName];
  if (!tool) {
    throw new Error(`Tool "${toolName}" not found.`);
  }

  // Re-order args based on the order defined in tool.parameters
  const orderedArgs = reorderArgs(tool.parameters || [], args);

  return tool.function.call(context, ...orderedArgs);
}

/************
 * Client Tools
 *
 * These are tools that run on the client that performs actions such.
 * as opening a modal form.
 */

interface ClientTool {
  name: string;
  category?: string; // Optional category for sorting
  description: string;
  parameters?: ToolParameter[];
  function: (this: ClientToolContext, ...args: any[]) => any; // Define 'this' type
}

const registeredClientTools: Record<string, ClientTool> = {};

export function registerClientTool(tool: ClientTool) {
  registeredClientTools[tool.name] = tool;
}

export function getClientToolList() {
  return Object.values(registeredClientTools)
    .map((tool) => ({
      id: tool.name,
      category: tool.category,
      description: tool.description,
    }))
    .sort(sortTools); // Sort the tools by category and id
}

export function getClientTools() {
  return registeredClientTools;
}

export function getClientTool(id: string) {
  return registeredClientTools[id];
}

export function callClientTool(
  toolName: string,
  context: ClientToolContext,
  args: Record<string, any>
) {
  const tool = registeredClientTools[toolName];
  if (!tool) {
    throw new Error(`Tool "${toolName}" not found.`);
  }

  // Re-order args based on the order defined in tool.parameters
  const orderedArgs = reorderArgs(tool.parameters || [], args);

  return tool.function.call(context, ...orderedArgs);
}

/*******
 * Themes
 */

const registeredThemes: Record<string, Theme> = {};

type CSSModule = { readonly [key: string]: string };

export type Theme = {
  id: string;
  name: string;
  description: string;
  imagePreview: string;
  theme: CSSModule;
};

export function registerTheme(theme: Theme) {
  registeredThemes[theme.id] = theme;
}

export function getTheme(id: string): Theme {
  return registeredThemes[id];
}

export function getThemeList() {
  return Object.values(registeredThemes).map((theme) => ({
    id: theme.name,
    name: theme.name,
    imagePreview: theme.imagePreview,
    description: theme.description,
  }));
}

/************
 * LLMs
 *
 * Register Large Language Models.
 */

export interface LLM {
  definition: LLMModelDefinition;
  adapter: new (
    modelId: string,
    modelConfiguration?: LLMModelConfiguration
  ) => LLMAdapter;
}

const registeredLLMs: Record<string, LLM> = {};

export function registerLLM(llm: LLM) {
  registeredLLMs[llm.definition.id] = llm;
}

export function getLLMDefinitions() {
  return Object.values(registeredLLMs).map((llm) => llm.definition);
}

export function getLLM(id: string): LLM | undefined {
  return registeredLLMs[id];
}
