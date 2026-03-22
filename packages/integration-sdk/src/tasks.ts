import type { TenantExecutionContext } from './context';

export type TaskTransportKind = 'jira' | 'linear' | 'internal' | 'mock';

export interface TaskListQuery {
  /** Jira project key, Linear team id, etc. */
  projectKey?: string;
}

export interface TaskRef {
  id: string;
  title: string;
  /** Normalized to Wilson task contract statuses in the agent layer. */
  status: string;
  dueAt: string;
  providerMetadata?: Record<string, string>;
}

export interface CreateTaskFromMailInput {
  messageId?: string;
  titleHint?: string;
}

export interface CreateTaskFromMailResult {
  taskId: string;
  title: string;
  created: boolean;
  sourceMessageId?: string;
}

export interface TaskProvider {
  readonly transportKind: TaskTransportKind;
  listMyTasks(
    ctx: TenantExecutionContext,
    query?: TaskListQuery,
  ): Promise<TaskRef[]>;
  createTaskFromMail(
    ctx: TenantExecutionContext,
    input: CreateTaskFromMailInput,
  ): Promise<CreateTaskFromMailResult>;
}
