import { MessageAI } from './message-ai.js';
import { ToolAI }     from './tool-ai.js';
import { ChunkAI }    from './chunk-ai.js';
import { LLMModelConfiguration } from './llm-model-configuration.js';
import { getServerLogger } from './logger.js';

export abstract class LLMAdapter {
  constructor(
    public modelId: string,
    public modelConfiguration: LLMModelConfiguration | undefined,
    protected readonly log: ReturnType<typeof getServerLogger>
  ) {}

  /* abstract hooks ---------------------------------------------------------- */
  public abstract mapMessages(input: MessageAI[]): unknown[];
  public abstract mapTools   (input: ToolAI[]):  unknown[];

  public abstract generateResponse(
    instructions: string,
    messages: MessageAI[],
    tools: ToolAI[],
    options?: object,
  ): AsyncGenerator<ChunkAI>;

  /* ------------------------------------------------------------------------ */
  /* retryWithBackoff – warns on transient failures, errors on final failure  */
  /* ------------------------------------------------------------------------ */
  protected async *retryWithBackoff<T>(
    operation: () => Promise<AsyncGenerator<T>>,
    maxRetries = 3,
  ): AsyncGenerator<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        /* delegate to caller’s async-generator and yield chunks */
        yield* await operation();
        return;
      } catch (err) {
        const delay = (attempt + 1) * 1000;   // 1 s, 2 s, 3 s …

        if (attempt < maxRetries) {
          /* warn, but don’t raise alarm */
          this.log.warn(
            `LLM call failed – will retry (${attempt+1}/${maxRetries})`,
            { err: { message: (err as Error).message }, attempt, delay },
          );
          await new Promise(r => setTimeout(r, delay));
          continue;                           // next loop iteration
        }

        /* final failure → escalate to error */
        this.log.error(
            err as Error,
            'LLM call exhausted retries',
        );
        throw err;  // bubble to caller
      }
    }
  }
}