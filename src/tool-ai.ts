export interface ToolAI {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters?: {
            type: 'object';
            properties: Record<string, ToolPropertyAI>;
            required?: string[];
        };
    };
}

export interface ToolPropertyAI {
    type:  'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null'; // Define the type of the parameter
    enum?: any[]; // Optional enum for predefined values
    description: string;
}
