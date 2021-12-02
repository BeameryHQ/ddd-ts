export interface IDomainEvent<T = null> {
  // When the event occured
  timestamp: string;
  // id for the Aggregate Root that this event belongs to
  aggregateId: string;
  // support multi-tenant applications
  tenantId: string | null;
  // Optional Event data
  data: T | null;
}

// Prototype for functions that will consume Domain Events
export type DomainEventHandler<T = null> = (
  event: IDomainEvent<T>,
) => void | Promise<void>;

export type IEventConstructorContext = Omit<IDomainEvent, 'timestamp' | 'data'>;

/**
 * Base Domain Event class.
 * All Domain Events should extend this class.
 */
export abstract class AbstractDomainEvent<T = null> implements IDomainEvent<T> {
  public readonly data: IDomainEvent<T>['data'];
  public readonly timestamp: IDomainEvent<T>['timestamp'];
  public readonly aggregateId: IDomainEvent<T>['aggregateId'];
  public readonly tenantId: IDomainEvent<T>['tenantId'];

  constructor(ctx: IEventConstructorContext, data?: T) {
    this.aggregateId = ctx.aggregateId;
    this.timestamp = new Date().toISOString();
    this.tenantId = ctx.tenantId ?? null;
    this.data = data ?? null;
  }
}
