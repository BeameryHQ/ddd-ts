import { DomainEventsBroker } from './domain-events-broker';
import { IDomainEvent } from './domain-event';
import { IEntity, Entity } from './entity';

export interface IAggregateRoot extends IEntity {
  readonly domainEvents: IDomainEvent<unknown>[];

  clearDomainEvents(): void;
}

/**
 * A cluster of associated objects which act as a single unit for the purpose of data changes.
 * Each `Aggregate` has a single root and then a boundary which defines what the `Aggregate` is repsonsible for.
 *
 * ## Rules
 * - The `Aggregate Root` is a single, specific `Entity`;
 * - The `Aggregate Root` is the only object that outside objects are allow to reference;
 * - Objects within the `Aggregate` can hold "_identity_", which only needs to be distinguishable within the `Aggregate`;
 * - Objects within the `Aggregate` can hold reference to external Objects;
 * - The `Aggregate Root` is responsible for enforcing consistency rules within the boundary;
 * - External objects can not hold reference to objects within the Aggregate boundary; they can only access them transiently via the Aggregate Root
 * - Delete operations should remove _everything_ within the `Aggregate` boundary;
 */
export abstract class AggregateRoot<
    T extends Partial<{ tenantId: string; id: string }> = {
      tenantId: string;
      id: string;
    },
  >
  extends Entity<T>
  implements IAggregateRoot
{
  private _domainEvents: IDomainEvent<unknown>[] = [];

  protected addDomainEvent(event: IDomainEvent<unknown>): void {
    this._domainEvents.push(event);

    // register this aggregate to indicate that its events
    // should be dispatched at some point
    DomainEventsBroker.registerAggregate(this);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  public get domainEvents() {
    return this._domainEvents;
  }
}
