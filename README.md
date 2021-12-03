# DDD-TS

A collection of small building blocks to help build multi-tenanted applications using [Domain Driven Design (DDD)](https://martinfowler.com/bliki/DomainDrivenDesign.html) with Typescript.

**Table Of Contents**
<!-- TOC -->

- [Building Blocks](#building-blocks)
  - [Value Object](#value-object)
  - [Entity](#entity)
  - [Aggregate Root](#aggregate-root)
  - [Domain Event](#domain-event)
  - [Domain Events Broker](#domain-events-broker)
- [Examples](#examples)
    - [Value Object](#value-object-1)
    - [Entity](#entity-1)
    - [Aggregate Root](#aggregate-root-1)
    - [Domain Events](#domain-events)
    - [Domain Events Broker](#domain-events-broker-1)
- [Credits](#credits)
- [License](#license)

<!-- /TOC -->

## Building Blocks

This library exposes the following building blocks:

> ℹ️ New to DDD? See the [credits](#credits) for some background context.

### Value Object

Create immutable data objects which can easily be compared.

Value objects adhere to the [`IValueObject<T>`](./src/value-object.ts) interface and can be used to create custom _value object_ objects:

```ts
// value-object-example.ts
import { ValueObject } from 'ddd-ts';

type DataStructure = string;

// Define a Value Object which holds a simple string
export class MyCustomValueObject extends ValueObject<DataStructure> {}
```

### Entity

Create an object whose identity extends beyond its attributes. Entity objects adhere to the [`IEntity`](./src/entity.ts) interface.

As an Entity's identity is based on more than its attributes, this means that an Entity's data structure has to be an Object, as it will automatically include an ID parameter. This also allows you to provide an Id value when re-constituting an Entity from some persistance layer, such as a database.

> Reconstituted and new Entity objects form different parts of an Entity's _lifecycle_ and so we ensure there is support for this clear distinction.

```ts
// entity-example.ts
import { Entity } from 'ddd-ts';

// the `id` property is automatically added by the base class, so we don't need to define it again
interface DataStructure {
  foo: string;
}

// Define an Entity which encapsulates some data
export class MyCustomEntity extends Entity<DataStructure> {}

// ---

// Create a new instance of this Domain object
const foo = new MyCustomEntity({ foo: 'bar' });

// Re-constitute an Entity Domain object by providing an id
const foo = new MyCustomEntity({ id: '123', foo: 'bar' });
```

### Aggregate Root

Aggregate Roots are [Entities](#entity) -- with the same features outline above -- with additional responsibilities: controlling access, visibility, and state of encapsulated objects (e.g. [Entity](#entity) and [ValueObject](#value-object)s).

Aggregate Roots adhere to the [IAggregateRoot](./src/aggregate-root.ts) interface.

```ts
// aggregate-example.ts
import { AggregateRoot } from 'ddd-ts';

// the `id` property is automatically added by the base class, so we don't need to define it again
interface DataStructure {
  foo: string;
}

// Define an Aggregate Root which encapsulates some data
export class MyCustomAggregate extends AggregateRoot<DataStructure> {}

// ---
// As per Entity example above, creating an instance (new or reconstituted follows the exact same process)

// New object
const foo = new MyCustomAggregate({ foo: 'bar' });

// Reconstituted object
const foo = new MyCustomAggregate({ id: '123', foo: 'bar' });
```

Aggregate roots can also register [Domain Events](#domain-event) to notify other parts of your app that something happened.

```ts
// aggregate-example.ts
import { AggregateRoot } from 'ddd-ts';
// Domain Events will be discussed in the next section.
// For now, assume that we have a custom DomainEvant with this name.
import { CustomAggregateFooUpdatedEvent } from './event-example.ts'

// the `id` property is automatically added by the base class, so we don't need to define it again
interface DataStructure {
  foo: string;
}

// Define an Aggregate Root which encapsulates some data
export class MyCustomAggregate extends AggregateRoot<DataStructure> {
  public set foo(newFoo: DataStructure['foo']) {
    this._data.foo = newFoo;

    // The second parameter here is the event Data which is attached to the event.
    const event = CustomAggregateFooUpdatedEvent({ aggregateId: this.id }, newFoo);

    // Add this custom event to the AggregateRoot; and also automatically notify the
    // Broker (see later sections) that this Aggregate has an event to be dispatched.
    //
    // At this point nothing else will happen. We will have to manually instruct the Broker to dispatch
    // this Aggregates events. This is discussed later
    this.addDomainEvent(event);
  }
}
```

### Domain Event

Domain Events enable decoupling parts (e.g. "_sub domains_") of your application.

Domain Events adhere to the [IDomainEvent](./src/domain-event.ts) interface. All Domain Events MUST extend the base Abstract Domain Event class:

> We'll continue the example from the [AggregateRoot](#aggregate-root) above.

```ts
// ./event-example.ts
import { AbstractDomainEvent } from 'ddd-ts';

export type EventData = string;

// Define a custom Domain Event which includes some basic data in the form of a string
export class CustomAggregateFooUpdatedEvent extends AbstractDomainEvent<EventData> {}
```

> ℹ️  Listeners of your custom Domain Events will always receive them after the fact. Therefore it is good practice to always use the past-tense when naming Event objects.


### Domain Events Broker

A simple in-process event broker for firing [Domain Events](#domain-event) for a given [Aggregate Root](#aggregate-root). The Broker coordinates the asynchronous communication across your app via [Domain Events](#domain-event).

> ℹ️  When required, this can be replaced with a more advanced setup using something like RabbitMQ, Kafka, etc.

> ⚠️  We do not yet support external event queues. Support will be added in a future release.

The `DomainEventsBroker` manages all `AggregateRoot`s which have notified it that they have `DomainEvent`(s) to be triggered.

As outlined above, registering `AggregateRoot`s with the `DomainEventsBroker` happens automatically via the relevant `AggregateRoot`. Manual interaction with the `DomainEventsBroker` is only required when:

1. a subscriber/consumer of the Domain Events should be registered; or
1. an [AggregateRoot's](#aggregate-root) Domain Events should be dispatched.

The following 2 examples of both use cases for the `DomainEventsBroker` will continue on from the examples outlined in [Aggregate Root](#aggregate-root) and [Domain Events](#domain-event).

We can register consumers of a particular event with:

```ts
import { DomainEventsBroker } from 'ddd-ts';
import { CustomAggregateFooUpdatedEvent } from './event-example.ts'

// Whenever our custom Domain Event from above is dispatched the event handler will be invoked
DomainEventsBroker.registerEventHandler(
  CustomAggregateFooUpdatedEvent.name,
  (event) => console.log('Foo updated!', event)
);

```

And then, we can dispatch _all_ events for an Aggregate Root when ready by:

```ts
import { MyCustomAggregate } from './aggregate-example.ts'

const agg = new MyCustomAggregate({ foo: 'bar' });

// This will register the Domain Event
agg.foo = 'baz';

// When we are ready to dispatch all Domain Events, we simply call:
DomainEventsBroker.dispatchAggregateEvents(agg);
```

**When to dispatch events?** Whenever makes sense for your application. Generally, a good starting point is to follow the [unit-of-work](https://martinfowler.com/eaaCatalog/unitOfWork.html) pattern, dispatching relevant Aggregate events once persistance of that Aggregate has been successfully completed.


## Examples

Some slightly extended examples, where relevant, to expand on the examples outlined above.

#### Value Object

Value objects can be used to house invariant rules for you custom data object. For example, a value object which enforces timestamps to be created as strings with the [ISO 8601 standard](https://en.wikipedia.org/wiki/ISO_8601).

```ts
// ./timestamp.ts
import { ValueObject } from 'ddd-ts';

// Enforce ISO8601 string representation of datetime fields
export class Timestamp extends ValueObject<string> {
  constructor(timestamp?: unknown) {
    let value;

    if (typeof timestamp === 'string') {
      const d = new Date(timestamp);
      value = d.toISOString();
    } else if (timestamp instanceof Timestamp) {
      value = timestamp.value;
    } else if (timestamp instanceof Date) {
      value = timestamp.toISOString();
    } else if (Number.isInteger(timestamp)) {
      value = new Date(timestamp as number).toISOString();
    } else {
      value = new Date().toISOString();
    }

    super(value);
  }
}

// ./my-other-file.ts
import { Timestamp } from './timestamp';

// Guarantees consistent timestamp formats;
const t1 = new Timestamp();
const t2 = new Timestamp(new Date());

// And offers a means to easily compare Timestamps
if(t1.equals(t2)) {
  // we have the same timestamp
}
```

#### Entity

```ts
// ./person.ts
import { Entity } from 'ddd-ts';

interface PersonData {
  name: string;
  address: string;
  phone: number;
}

export class Person extends Entity<PersonData> {
  public get name(){
    return this._data.name;
  }

  public get address(){
    return this._data.address;
  }

  public get phone(){
    return this._data.phone;
  }
}

// ./example.ts
import { Person } from './person';

// Create a new person
const jane = new Person({
  name: 'Jane Doe',
  address: '21 Baker Street',
  phone: 01234567890
});

// Re-constitute a person from some persistance layer
const john = new Person({
  id: 1,              // <- This enforces continuity over the Entity's lifecycle, as it moves back and forth between in-memory and the persistance layer
  name: 'John Smith',
  address: '22 Baker Street',
  phone: 01234567890
});

// We still have the same equality checks as before.
if(jane.equals(john)) {
  // same person
}

// Access an Entity's attributes:
jane.name       // ok
jane._data.name // fail! Typescript error
```


#### Aggregate Root

See [Entity Examples]()

<!-- Todo Add more example with events? -->

TODO

#### Domain Events

<!-- Todo Would additional examples be useful here? -->

TODO

#### Domain Events Broker

More examples of how the Domain Events Broker can be used, and some of its features (e.g. queue draining, etc), see the [Events Broker tests](./src/domain-events-broker.test.ts).

## Credits

[Eric Evans' original 2003 book](https://www.amazon.co.uk/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215), _the_ original reference on DDD.

[Khalil Stemmler's Blog series on DDD](https://khalilstemmler.com/articles/categories/domain-driven-design/).

[Microsoft's .NET docs on DDD](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice).

The `DomainEventsBroker` implementation is based on [Khalil Stemmler's port](https://khalilstemmler.com/articles/typescript-domain-driven-design/chain-business-logic-domain-events/) of [Udi Dahan's 2009 blog post about Domain Events in C#](https://udidahan.com/2009/06/14/domain-events-salvation/).

## License

MIT
