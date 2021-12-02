import {
  AbstractDomainEvent,
  IDomainEvent,
  IEventConstructorContext,
} from './domain-event';

/* provide a basic example event; no additional data */
class PrimaryStubEvent extends AbstractDomainEvent {}
class SecondaryStubEvent extends AbstractDomainEvent {}

const stubEventContext: IEventConstructorContext = {
  aggregateId: '',
  tenantId: '',
};

describe('Aggregate DomainEvents', () => {
  beforeEach(() => {
    // Even though we use `.doMock` which should act locally, Jest is still holding some
    // external state somewhere which seems to only be cleared with this call.
    jest.unmock('./domain-events-broker');
  });

  it('can register events for a single Aggregate', async () => {
    jest.doMock('./domain-events-broker');

    const { AggregateRoot } = await import('./aggregate-root');
    const { DomainEventsBroker } = await import('./domain-events-broker');

    class RegisterSingleEventTestAggregate extends AggregateRoot<void> {
      public addEvent(event: IDomainEvent): void {
        this.addDomainEvent(event);
      }
    }

    const myEvent = new PrimaryStubEvent(stubEventContext);
    const myAggregrate = new RegisterSingleEventTestAggregate();

    myAggregrate.addEvent(myEvent);

    expect(myAggregrate.domainEvents).toHaveLength(1);
    expect(DomainEventsBroker.registerAggregate).toHaveBeenCalledTimes(1);
  });

  it('can register events for multiple Aggregates at the same time', async () => {
    jest.doMock('./domain-events-broker');

    const { AggregateRoot } = await import('./aggregate-root');
    const { DomainEventsBroker } = await import('./domain-events-broker');

    class RegisterMultpleEventTestAggregateA extends AggregateRoot<void> {
      public addEvent(event: IDomainEvent): void {
        this.addDomainEvent(event);
      }
    }
    class RegisterMultpleEventTestAggregateB extends RegisterMultpleEventTestAggregateA {}

    const myEventA = new PrimaryStubEvent(stubEventContext);
    const myEventB = new PrimaryStubEvent(stubEventContext);
    const aggregateA = new RegisterMultpleEventTestAggregateA();
    const aggregateB = new RegisterMultpleEventTestAggregateB();

    aggregateA.addEvent(myEventA);
    aggregateB.addEvent(myEventB);

    expect(aggregateA.domainEvents).toHaveLength(1);
    expect(aggregateB.domainEvents).toHaveLength(1);
    expect(DomainEventsBroker.registerAggregate).toHaveBeenCalledTimes(2);
  });

  it('drains the event queue once the events have been dispatched', async () => {
    const { AggregateRoot } = await import('./aggregate-root');
    const { DomainEventsBroker } = await import('./domain-events-broker');

    class RegisterSingleEventTestAggregate extends AggregateRoot<void> {
      public addEvent(event: IDomainEvent): void {
        this.addDomainEvent(event);
      }
    }

    const myEventA = new PrimaryStubEvent(stubEventContext);
    const myEventB = new SecondaryStubEvent(stubEventContext);
    const myAggregrate = new RegisterSingleEventTestAggregate();

    myAggregrate.addEvent(myEventA);
    myAggregrate.addEvent(myEventB);

    expect(myAggregrate.domainEvents).toHaveLength(2);

    DomainEventsBroker.dispatchAggregateEvents(myAggregrate);

    expect(myAggregrate.domainEvents).toHaveLength(0);
  });

  it('can dispatch registered events for a given Aggregate', async () => {
    const { AggregateRoot } = await import('./aggregate-root');
    const { DomainEventsBroker } = await import('./domain-events-broker');

    class DispatchEventsTestAggregate extends AggregateRoot<void> {
      public addEvent(event: IDomainEvent): void {
        this.addDomainEvent(event);
      }
    }

    const myEvent = new PrimaryStubEvent(stubEventContext);
    const myAggregrate = new DispatchEventsTestAggregate();
    const eventHandler = jest.fn();

    DomainEventsBroker.registerEventHandler(
      PrimaryStubEvent.name,
      eventHandler,
    );
    myAggregrate.addEvent(myEvent);

    DomainEventsBroker.dispatchAggregateEvents(myAggregrate);
    expect(eventHandler).toHaveBeenCalledTimes(1);
  });

  it('sends dispatched events to multiple subscribed event handlers', async () => {
    const { AggregateRoot } = await import('./aggregate-root');
    const { DomainEventsBroker } = await import('./domain-events-broker');

    class DispatchEventsTestAggregateA extends AggregateRoot<void> {
      public addEvent(event: IDomainEvent): void {
        this.addDomainEvent(event);
      }
    }

    const myEventA = new PrimaryStubEvent(stubEventContext);

    const myAggregrateA = new DispatchEventsTestAggregateA();

    const eventHandlerA = jest.fn();
    const eventHandlerB = jest.fn();

    myAggregrateA.addEvent(myEventA);

    DomainEventsBroker.registerEventHandler(
      PrimaryStubEvent.name,
      eventHandlerA,
    );
    DomainEventsBroker.registerEventHandler(
      PrimaryStubEvent.name,
      eventHandlerB,
    );

    DomainEventsBroker.dispatchAggregateEvents(myAggregrateA);

    expect(eventHandlerA).toHaveBeenCalledTimes(1);
    expect(eventHandlerB).toHaveBeenCalledTimes(1);
  });

  it('does not leak registered events across Aggregate boundaries', async () => {
    const { AggregateRoot } = await import('./aggregate-root');
    const { DomainEventsBroker } = await import('./domain-events-broker');

    class DispatchEventsTestAggregateA extends AggregateRoot<void> {
      public addEvent(event: IDomainEvent): void {
        this.addDomainEvent(event);
      }
    }
    class DispatchEventsTestAggregateB extends DispatchEventsTestAggregateA {}

    const myEventA = new PrimaryStubEvent(stubEventContext);
    const myEventB = new SecondaryStubEvent(stubEventContext);

    const myAggregrateA = new DispatchEventsTestAggregateA();
    const myAggregrateB = new DispatchEventsTestAggregateB();

    const eventHandlerA = jest.fn();
    const eventHandlerB = jest.fn();

    myAggregrateA.addEvent(myEventA);
    myAggregrateB.addEvent(myEventB);

    DomainEventsBroker.registerEventHandler(
      PrimaryStubEvent.name,
      eventHandlerA,
    );
    DomainEventsBroker.registerEventHandler(
      SecondaryStubEvent.name,
      eventHandlerB,
    );

    // Only dispatch events for a single Aggregate
    DomainEventsBroker.dispatchAggregateEvents(myAggregrateA);

    // Events attached to the dispatched Aggregate should have been invoked
    expect(eventHandlerA).toHaveBeenCalledTimes(1);
    // Events attached to the NON-dispatched Aggregate should NOT have been invoked
    expect(eventHandlerB).toHaveBeenCalledTimes(0);
  });
});
