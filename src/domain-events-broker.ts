/* eslint-disable @typescript-eslint/no-explicit-any */
import { IAggregateRoot } from './aggregate-root';
import { DomainEventHandler } from './domain-event';

/**
 * In-process message bus.
 */
export class DomainEventsBroker {
  private static eventHandlers = new Map<string, DomainEventHandler<any>[]>();

  private static aggregatesWithEvents: IAggregateRoot[] = [];

  private static findRegisteredAggregateById(
    id: string,
  ): IAggregateRoot | null {
    return (
      DomainEventsBroker.aggregatesWithEvents.find((agg) => agg.id === id) ??
      null
    );
  }

  private static unregisterAggregate(aggregate: IAggregateRoot): void {
    const aggIdx = DomainEventsBroker.aggregatesWithEvents.findIndex((agg) =>
      agg.equals(aggregate),
    );

    if (aggIdx !== -1) {
      DomainEventsBroker.aggregatesWithEvents.splice(aggIdx, 1);
    }
  }

  private static dispatchEvents(aggregate: IAggregateRoot): void {
    aggregate.domainEvents.forEach((event) => {
      const eventName = event.constructor.name;

      DomainEventsBroker.eventHandlers.get(eventName)?.forEach((handle) => {
        // eslint-disable-next-line no-void
        void handle(event);
      });
    });
  }

  /**
   * Register event handler for a given event name
   */
  public static registerEventHandler(
    eventName: string,
    handler: DomainEventHandler,
  ): void {
    DomainEventsBroker.eventHandlers.set(
      eventName,
      (DomainEventsBroker.eventHandlers.get(eventName) || []).concat(handler),
    );
  }

  /**
   * Include Aggregate for having its events dispatched when the unit-of-work has
   * been completed in the infrastructure layer.
   */
  public static registerAggregate(aggregate: IAggregateRoot): void {
    const foundAggregate = this.findRegisteredAggregateById(aggregate.id);

    if (!foundAggregate) {
      DomainEventsBroker.aggregatesWithEvents.push(aggregate);
    }
  }

  public static dispatchAggregateEvents(aggregate: IAggregateRoot): void {
    // ensure the provided aggregate has been registered for dispatch
    const found = DomainEventsBroker.findRegisteredAggregateById(aggregate.id);

    if (found) {
      DomainEventsBroker.dispatchEvents(found);

      found.clearDomainEvents();

      DomainEventsBroker.unregisterAggregate(found);
    }
  }

  public static clearEventHandlers(): void {
    DomainEventsBroker.eventHandlers = new Map();
  }

  public static clearRegisteredAggregates(): void {
    DomainEventsBroker.aggregatesWithEvents = [];
  }
}
