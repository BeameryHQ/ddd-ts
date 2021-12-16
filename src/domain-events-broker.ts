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
    return this.aggregatesWithEvents.find((agg) => agg.id === id) ?? null;
  }

  private static unregisterAggregate(aggregate: IAggregateRoot): void {
    const aggIdx = this.aggregatesWithEvents.findIndex((agg) =>
      agg.equals(aggregate),
    );

    if (aggIdx !== -1) {
      this.aggregatesWithEvents.splice(aggIdx, 1);
    }
  }

  private static dispatchEvents(aggregate: IAggregateRoot): void {
    aggregate.domainEvents.forEach((event) => {
      const eventName = event.constructor.name;

      this.eventHandlers.get(eventName)?.forEach((handle) => {
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
    handler: DomainEventHandler<any>,
  ): void {
    this.eventHandlers.set(
      eventName,
      (this.eventHandlers.get(eventName) || []).concat(handler),
    );
  }

  /**
   * Include Aggregate for having its events dispatched when the unit-of-work has
   * been completed in the infrastructure layer.
   */
  public static registerAggregate(aggregate: IAggregateRoot): void {
    const foundAggregate = this.findRegisteredAggregateById(aggregate.id);

    if (!foundAggregate) {
      this.aggregatesWithEvents.push(aggregate);
    }
  }

  public static dispatchAggregateEvents(aggregate: IAggregateRoot): void {
    // ensure the provided aggregate has been registered for dispatch
    const found = this.findRegisteredAggregateById(aggregate.id);

    if (found) {
      this.dispatchEvents(found);

      found.clearDomainEvents();

      this.unregisterAggregate(found);
    }
  }

  public static clearEventHandlers(): void {
    this.eventHandlers = new Map();
  }

  public static clearRegisteredAggregates(): void {
    this.aggregatesWithEvents = [];
  }
}
