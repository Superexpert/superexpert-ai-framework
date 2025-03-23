import { LLMModelDefinition } from "./llm-model-definition";
import { LLMModelConfiguration } from "./llm-model-configuration";
import { LLMAdapter } from "./llm-adapter";
import { MessageAI } from "./message-ai";


interface ToolParameter {
    name: string;
    description: string;
    enum?: string[]; // Optional enum of allowed values
  }
  
  interface Tool {
    name: string;
    description: string;
    parameters: ToolParameter[];
    function: (this: ServerToolContext, ...args: any[]) => any; // Define 'this' type
  }
  

/************
 * Utility function to reorder arguments based on the parameter definitions
 *
 * This function takes the parameters defined in the server tool and the args
 * passed to the tool, and reorders the args to match the order of the parameters.
 */
function reorderArgs(
  parameters: ToolParameter[],
  args: Record<string, any>
) {
  return parameters.map((parameter) => {
    if (!(parameter.name in args)) {
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


const registeredServerTools: Record<string, Tool> = {};

export function registerServerTool(tool: Tool) {
  registeredServerTools[tool.name] = tool;
}

export function getServerToolList() {
  return Object.values(registeredServerTools).map((tool) => ({
    id: tool.name,
    description: tool.description,
  }));
}

export function getServerTools() {
  return registeredServerTools;
}

export interface ServerToolContext {
  user: { id: string; now: Date; timeZone: string };
  agent: { id: string; name: string };
  messages: MessageAI[];
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
  const orderedArgs = reorderArgs(tool.parameters, args);

  return tool.function.call(context, ...orderedArgs);
}





/************
 * Server Data Tools
 *
 * These are tools that run on the server that provide additional instructions.
 * They are registered in the plugin registry and can be called by name.
 *
 */



const registeredServerDataTools: Record<string, Tool> = {};

export function registerServerDataTool(tool: Tool) {
  registeredServerDataTools[tool.name] = tool;
}

export function getServerDataToolList() {
  return Object.values(registeredServerDataTools).map((tool) => ({
    id: tool.name,
    description: tool.description,
  }));
}

export function getServerDataTools() {
  return registeredServerDataTools;
}

export interface ServerDataToolContext {
  user: { id: string; now: Date; timeZone: string };
  agent: { id: string; name: string };
  messages: MessageAI[];
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
  const orderedArgs = reorderArgs(tool.parameters, args);

  return tool.function.call(context, ...orderedArgs);
}




/************
 * Client Tools
 *
 * These are tools that run on the client that performs actions such.
 * as opening a modal form.
 */



const registeredClientTools: Record<string, Tool> = {};

export function registerClientTool(tool: Tool) {
  registeredClientTools[tool.name] = tool;
}

export function getClientToolList() {
  return Object.values(registeredClientTools).map((tool) => ({
    id: tool.name,
    description: tool.description,
  }));
}

export function getClientTools() {
  return registeredClientTools;
}

export interface ClientToolContext {
  user: { id: string; now: Date; timeZone: string };
  agent: { id: string; name: string };
  messages: MessageAI[];
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
  const orderedArgs = reorderArgs(tool.parameters, args);

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

export function getLLMList() {
  return Object.values(registeredLLMs).map((llm) => ({
    id: llm.definition.id,
    description: llm.definition.description,
  }));
}


export function getLLM(id: string): LLM | undefined {
  return registeredLLMs[id];
}



// // Create a class-based singleton registry to ensure proper initialization and sharing
// class Registry {
//   private static instance: Registry;
//   public llms: Record<string, LLMPlugin> = {};
//   public serverDataTools: ServerDataToolsConstructor[] = [];
//   public serverTools: ServerToolsConstructor[] = [];
//   public clientTools: ClientToolsConstructor[] = [];
//   public themes: Record<string, Theme> = {};

//   private constructor() {}

//   public static getInstance(): Registry {
//     if (!Registry.instance) {
//       Registry.instance = new Registry();
//     }
//     return Registry.instance;
//   }
// }

// // Get the singleton registry
// const getRegistry = () => {
//   // Use global for server-side persistence
//   if (typeof window === "undefined") {
//     if (!global._registry) {
//       global._registry = Registry.getInstance();
//     }
//     return global._registry;
//   }

//   // Use module-level singleton for client-side
//   return Registry.getInstance();
// };

// // Add this to the global type
// declare global {
//   // eslint-disable-next-line no-var
//   var _registry: Registry | undefined;
// }

// // Export a consistent registry reference
// const registry = getRegistry();

// /*******
//  * Themes
//  */
// type CSSModule = { readonly [key: string]: string };
// export type Theme = {
//   id: string;
//   name: string;
//   theme: CSSModule;
// };

// export function registerTheme(theme: Theme) {
//   if (registry.themes[theme.id]) {
//     return;
//   }
//   registry.themes[theme.id] = theme;
// }

// export function getTheme(id: string): CSSModule {
//   return registry.themes[id].theme;
// }

// export function getThemes() {
//   return Object.values(registry.themes);
// }

// /************
//  * Tools
//  */

// type ServerDataToolsConstructor = new (
//   user: User,
//   agent: { id: string; name: string }
// ) => ServerDataBase;

// type ServerToolsConstructor = new (
//   user: User,
//   agent: { id: string; name: string }
// ) => ServerToolsBase;

// type ClientToolsConstructor = new (
//   clientContext: ClientContext
// ) => ClientToolsBase;

// export interface LLMPlugin {
//   definition: LLMModelDefinition;
//   adapter: new (
//     modelId: string,
//     modelConfiguration?: LLMModelConfiguration
//   ) => LLMAdapter;
// }

// export function registerLLM(plugin: LLMPlugin) {
//   if (registry.llms[plugin.definition.id]) {
//     return;
//   }
//   registry.llms[plugin.definition.id] = plugin;
// }

// export function registerServerDataTool(plugin: ServerDataToolsConstructor) {
//   // Get constructor name
//   const pluginName = plugin.name;

//   // Check if a tool with the same name is already registered
//   const exists = registry.serverDataTools.some(
//     (tool) => tool.name === pluginName
//   );
//   if (!exists) {
//     registry.serverDataTools.push(plugin);
//   }
// }

// // export function registerServerTool(plugin: ServerToolsConstructor) {
// //    // Get constructor name
// //    const pluginName = plugin.name;

// //    // Check if a tool with the same name is already registered
// //    const exists = registry.serverTools.some(tool => tool.name === pluginName);
// //    if (!exists) {
// //        registry.serverTools.push(plugin);
// //    }
// // }

// export function registerClientTool(plugin: ClientToolsConstructor) {
//   // Get constructor name
//   const pluginName = plugin.name;

//   // Check if a tool with the same name is already registered
//   const exists = registry.clientTools.some((tool) => tool.name === pluginName);
//   if (!exists) {
//     registry.clientTools.push(plugin);
//   }
// }

// export function getLLMPlugin(modelId: string): LLMPlugin | undefined {
//   return registry.llms[modelId];
// }

// export function getLLMModels(): LLMModelDefinition[] {
//   return Object.values(registry.llms).map((plugin) => plugin.definition);
// }

// export function getLLMModel(id: string): LLMModelDefinition | undefined {
//   return registry.llms[id].definition;
// }

// export function getClientTools(): ClientToolsConstructor[] {
//   return registry.clientTools;
// }

// export function getServerDataTools(): ServerDataToolsConstructor[] {
//   return registry.serverDataTools;
// }

// // export function getServerTools(): ServerToolsConstructor[] {
// //     return registry.serverTools;
// // }
