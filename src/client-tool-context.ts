import { ReactElement } from 'react';
import { MessageAI } from './message-ai.js';
import { ClientTaskDefinition } from './client-task-definition.js';

export type ShowModalType = (
    ContentComponent: (props: {
        onSubmit: (result: string) => void;
    }) => ReactElement
) => void;

export class ClientToolContext {
    constructor(
        public tasks: ClientTaskDefinition[],
        public getCurrentTask: () => ClientTaskDefinition,
        public getTask: (taskName: string) => ClientTaskDefinition | null,
        public setTask: (taskName: string) => void,
        public getCurrentThread: () => string,
        public setThread: (id: string) => void,
        public sendMessages: (messages: MessageAI[]) => Promise<void>,
        public showModal: ShowModalType,
        public hideModal: () => void
    ) {}
}
