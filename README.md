# DDD-TS

Build (multi-tenanted) apps using [Domain Driven Design (DDD)][fowler-ddd], Typescript, and NodeJS with ease.

> ⚠️ This package should be considered an Alpha level release and thus subject to breaking changes as we stabilise the API. A v1.0.0 release will signal a stabilsed API.

---

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg?style=flat-square&logo=Github)](http://makeapullrequest.com)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)](https://github.com/BeameryHQ/ddd-ts/graphs/commit-activity)
[![CICD](https://github.com/BeameryHQ/ddd-ts/actions/workflows/cicd.yml/badge.svg)](https://github.com/BeameryHQ/ddd-ts/actions/workflows/cicd.yml)
[![NPM Version](https://img.shields.io/npm/v/ddd-ts.svg)](https://www.npmjs.com/package/ddd-ts)
[![NPM Total Downlodas](https://img.shields.io/npm/dt/ddd-ts.svg)](https://www.npmjs.com/package/ddd-ts)

---

**Table Of Contents**
- [1. Installation](#1-installation)
- [2. DDD Building Blocks](#2-ddd-building-blocks)
  - [2.1. Value Object](#21-value-object)
  - [2.2. Entity](#22-entity)
  - [2.3. Aggregate Root](#23-aggregate-root)
  - [2.4. Domain Event](#24-domain-event)
  - [2.5. Domain Events Broker](#25-domain-events-broker)
- [3. Examples](#3-examples)
  - [3.1. Value Object](#31-value-object)
  - [3.2. Entity](#32-entity)
  - [3.3. Aggregate Root](#33-aggregate-root)
  - [3.4. Domain Events](#34-domain-events)
  - [3.5. Domain Events Broker](#35-domain-events-broker)
- [4. Development](#4-development)
- [5. Credits](#5-credits)
- [6. License](#6-license)


## 1. Installation

```sh
npm install ddd-ts
# or
yarn add ddd-ts
```

*The package ships with its own type definitions, so no additional type packages are required.*

## 2. DDD Building Blocks

> ℹ️ New to DDD? See the [credits](#credits) for some background context.

This library exposes core building blocks to help build out your DDD application.


### 2.1. Value Object

Create disposable, immutable data objects which can easily be compared.

Value objects (VOs) adhere to the [`IValueObject<T>`](./src/value-object.ts) interface and can be used to create custom _value object_ objects:

```ts
// value-object-01.example.ts
import { ValueObject } from 'ddd-ts';

// can be any type structure
type DataStructure = string;

// Define a Value Object which holds a simple string
class MyCustomValueObject extends ValueObject<DataStructure> {}

const vo = new MyCustomValueObject('Hello World');

vo.value // Hello World
```

We can easily check equality between different VOs:

```ts
// value-object-02.example.ts
import { ValueObject } from 'ddd-ts';

type DataStructure = { a: string };

class MyCustomVO1 extends ValueObject<DataStructure> {}
class MyCustomVO2 extends ValueObject<DataStructure> {}

const vo1 = new MyCustomVO1({ a: 'hello world' });
const vo2 = new MyCustomVO2({ a: 'hello world' });

vo1.equals(vo2) // true
```

See the [Value Object Examples](#value-object-1) for more details.

### 2.2. Entity

Create an object whose identity extends beyond its attributes. Entity objects adhere to the [`IEntity<T>`](./src/entity.ts) interface.

An `Entity`'s identity is based on more than its attributes (see [Value Objects](#value-object)) which means that an Entity's data structure must always be an Object, as its data structure will include a distinguishing ID attribute.

The ID can either be provided during object construction or automatically generated. This allows entities to support the full lifecycle of Domain objects: _creation_ and _re-constitution_, respectively.

Re-constitution happens when creating an instance of your `Entity` from the data stored in a persistence layer, such as a database, where an `id` for that object already exists.

```ts
// entity-01.example.ts
import { Entity } from 'ddd-ts';

// By default, our data (`foo` and `bar` attributes) will be private, and fully encapsulated within our domain object.
// Note 1: See later how to customise this behaviour.
// Note 2: We are also declaring the "creation" lifecycle, as we are not supplying a unique `id` parameter.
type DataStructure = {
  foo: string;
  bar: string;
}

// Creation lifecycle: The only publicly accessibly attribute is the entity's `id`, auto-generated during instantiation.
class MyCustomEntity extends Entity<DataStructure> {}

const entity = new MyCustomEntity({ foo: 'hello', bar: 'world' });

entity.id  // uuid v4
entity.foo // Private: not accessible outside entity
entity.bar // Private: not accessible outside entity
```

<!-- omit from toc -->
#### Entity (Utility) Types

This library also exports (utility) types to help with attribute encapsulation and/or visibility:

- `IEntity`: Base interface, giving you full control over which pieces of data should be declared as being exposed from the domain object;
- `BuildEntityInterface`: Simple helper to make _all_ attributes defined for your `Entity` domain object public.

**Example: Manually declare specific attributes as public**

```ts
// entity-02.example.ts
import { Entity } from 'ddd-ts';
// separate out the type imports for clarity
import type { IEntity } from 'ddd-ts';

type DataStructure = {
  foo: string;
  bar: string;
};

// Use the base Entity interface to customise which attributes are private and which are public
interface IMyCustomEntity extends IEntity {
  // here, "bar" remains private
  foo: string
}

// Use our custom interface to ensure we remember to expose the necessary attributes.
export class MyCustomEntity extends Entity<DataStructure> implements IMyCustomEntity {
  // manually expose the required public attributes
  public get foo() { return this._data.foo; }
}

// Create a new instance of this Domain object
const entity = new MyCustomEntity({ foo: 'hello', bar: 'world' });

// And we can now access its data attributes
entity.id  // uuid v4 (auto generated)
entity.foo // hello
entity.bar // Private: not accessible outside domain object


// Alternatively, we can re-constitute an Entity domain object by providing an id.
// This provides a continuity of identity of a domain object through different sessions or transactions
const entity2 = new MyCustomEntity({ id: '123', foo: 'hello', bar: 'world' });

// And as before, we can access its data attributes
entity2.id  // 123
entity2.foo // hello
entity2.bar // Private: not accessible outside domain object
```

**Example: Declaring all attributes as public**

```ts
// entity-03.example.ts
import { Entity } from 'ddd-ts';
// separate out the type imports for clarity
import type { BuildEntityInterface } from 'ddd-ts';

type DataStructure = {
  foo: string;
  bar: string;
};

// Use the type utility to define an interface which declares all custom data attributes as public
//
// Note: The Type utility only sets the type signature, it doesn't automatically make
//       those data attributes accessible; we need to manually add the necessary getters to our object.
export class MyCustomEntity extends Entity<DataStructure> implements BuildEntityInterface<DataStructure> {
  public get foo() { return this._data.foo; }
  public get bar() { return this._data.bar; }
}

// Create a new instance of this Domain object
const entity = new MyCustomEntity({ foo: 'hello', bar: 'world' });

// And we can now access its data attributes
entity.id  // uuid v4 (auto generated)
entity.foo // hello
entity.bar // world


// Alternatively, we can re-constitute an Entity domain object by providing an id.
// This provides a continuity of identity of a domain object through different sessions or transactions
const entity2 = new MyCustomEntity({ id: '123', foo: 'hello', bar: 'world' });

// And as before, we can access its data attributes
entity2.id  // 123
entity2.foo // hello
entity2.bar // world
```

### 2.3. Aggregate Root

Aggregate Roots are _special_ [Entities](#entity) with additional responsibilities: encapsulating other domain objects (e.g. [Entity](#entity) and [ValueObject](#value-object)s) and controlling their access/visibility to the outside world. Aggregate roots extend the Entity API outlined above, adding support for their additional responsibilities.

<!-- With the exception of [Domain Events](#domain-event), all these additional responsibilities inform the design of such objects from your application's perspective without including any additional API. Therefore, Aggregate Roots can be largely handled in the exact same way as Entities, described above. The specifics of [Domain Events](#domain-event) will be discussed later. -->

Aggregate Roots adhere to the [`IAggregateRoot<T>`](./src/aggregate-root.ts) interface. This interface is an extension of the `IEntity` interface with the added API for [Domain Events](#domain-event) (*see later*).

The specifics of creating an Aggregate Root and which data should be treated as public or private, and how to handle the different lifecyles, is exactly the same as described above with the [Entity](#entity) object. For brevity, the full Entity reference will not be repeated again here.

```ts
// aggregate-01.example.ts
import { AggregateRoot } from 'ddd-ts';

type DataStructure = {
  foo: string;
}

// Define an Aggregate Root which encapsulates some (private) data
class MyCustomAggregate extends AggregateRoot<DataStructure> {}

// ---
// As per Entity example above, creating an instance (new or reconstituted follows the exact same process)

// New object
const foo = new MyCustomAggregate({ foo: 'bar' });

// Reconstituted object
const foo = new MyCustomAggregate({ id: '123', foo: 'bar' });
```

As mentioned above, one of the primary API differences between `AggregateRoot`s and `Entity`s is [Domain Events](#domain-event). `AggregateRoot`s expose an API to register a [Domain Event](#domain-event), which can be used to notify other parts of your app that something happened.

```ts
// aggregate-02.example.ts
import { AggregateRoot } from 'ddd-ts';
// Domain Events will be discussed in the next section.
// For now, assume that we have a custom DomainEvant with this name.
import { CustomAggregateFooUpdatedEvent } from './event-example.ts'

// Define our Domain object's attributes
interface DataStructure {
  foo: string;
}

// Define an Aggregate Root which encapsulates some data
export class MyCustomAggregate extends AggregateRoot<DataStructure> {
  // Define a setter for an attribute which we want to assign our Domain event to when it is changed
  public set foo(newFoo: DataStructure['foo']) {
    this._data.foo = newFoo;

    // The second parameter here is the event Data which is attached to the event.
    const event = new CustomAggregateFooUpdatedEvent({ aggregateId: this.id }, newFoo);

    // Add this custom event to the AggregateRoot; and also automatically notify the
    // Broker (see later) that this Aggregate has an event to be dispatched.
    //
    // At this point nothing else will happen. We will have to manually instruct the Broker to dispatch
    // this Aggregates events. This is discussed later
    this.addDomainEvent(event);
  }
}
```

For any given `AggregateRoot` we can get a list of all Domain Events queued for dispatch and/or clear its queue:

```ts
// aggregate-03.example.ts
// Use our previous example set up to create an Aggregate
export const agg = new MyCustomAggregate({ foo: 'hello world' });

// If we were to check which events we have queued, we wouldn't expect to have any based on
// the previous example as we haven't performed the only action which would queue a domain event: edit ".foo".
console.log(agg.domainEvents) // [] -- length of 0

// Let's edit ".foo" to queue a domain event
agg.foo = 'goodbye world';

console.log(agg.domainEvents) // [CustomAggregateFooUpdatedEvent] -- length of 1, with our custom domain event

// Let's clear the event queue
agg.clearDomainEvents();
console.log(agg.domainEvents) // [] -- length of 0
```


### 2.4. Domain Event

Domain Events enable decoupling parts (e.g. "_sub domains_") of your application.

Domain Events adhere to the [`IDomainEvent<T>`](./src/domain-event.ts) interface. All Domain Events MUST extend the base `AbstractDomainEvent` class:

> We'll continue the example from the [AggregateRoot](#aggregate-root) above.

```ts
// ./event-01.example.ts
import { AbstractDomainEvent } from 'ddd-ts';

export type EventData = string;

// Define a custom Domain Event which includes some basic data in the form of a string
export class CustomAggregateFooUpdatedEvent extends AbstractDomainEvent<EventData> {}
```

> ℹ️  Listeners of your custom Domain Events will always receive them after the fact. Therefore it is good practice to always use the past-tense when naming Event objects.


### 2.5. Domain Events Broker

A simple in-process event broker for firing [Domain Events](#domain-event) for a given [Aggregate Root](#aggregate-root). The Broker coordinates the asynchronous communication across your app via [Domain Events](#domain-event).

The `DomainEventsBroker` manages all `AggregateRoot`s which have notified it that they have `DomainEvent`(s) to be dispatched.

As outlined above, registering `AggregateRoot`s with the `DomainEventsBroker` happens automatically via the relevant `AggregateRoot`. Manual interaction with the `DomainEventsBroker` is only required when:

1. a subscriber/consumer of the Domain Events should be registered; or
2. an [AggregateRoot's](#aggregate-root) Domain Events should be dispatched.

The following examples demonstrate both use cases, and will continue on from the examples outlined in [Aggregate Root](#aggregate-root) and [Domain Events](#domain-event).

We can register consumers of a particular event with:

```ts
// broker-01.example.ts
import { DomainEventsBroker, AbstractDomainEvent } from 'ddd-ts';
import { CustomAggregateFooUpdatedEvent } from './aggregate-02.example.ts'

function handleEvent<T extends AbstractDomainEvent>(event: T){
  console.log('Foo updated!', event);
}

// Whenever our custom Domain Event from above is dispatched the event handler will be invoked
DomainEventsBroker.registerEventHandler(
  CustomAggregateFooUpdatedEvent.name,
  handleEvent,
);

```

And then, we can dispatch _all_ events for an Aggregate Root when ready by:

```ts
// broker-02.example.ts
import { DomainEventsBroker, AbstractDomainEvent } from 'ddd-ts';
// We'll use our `agg` variable which holds an instance
// of our custom Aggregate defined above in a previous example.
import { agg } from './aggregate-03.example.ts';

// When we are ready to dispatch all Domain Events for our given Aggregate, simply call:
DomainEventsBroker.dispatchAggregateEvents(agg);
```

**When to dispatch events?** Whenever makes sense for your application. Generally, a good starting point is to follow the [unit-of-work][fowler-unit-of-work] pattern, dispatching relevant Aggregate events once persistance of that Aggregate has been successfully completed. At this point, the Aggregate will have enforced all _rule invariants_ which represent your domain and the new state will have been persisted.


## 3. Examples

Some slightly extended examples, where relevant, to expand on the examples outlined above.

### 3.1. Value Object

Value objects can (and _should_) be used to house invariant rules for you custom data object. One example could be a value object which enforces timestamps to be created as strings with the [ISO 8601 standard](https://en.wikipedia.org/wiki/ISO_8601).

```ts
// ./timestamp.ts
import { ValueObject } from 'ddd-ts';

type DataStructure = string;

// Enforce ISO8601 string representation of datetime fields
export class Timestamp extends ValueObject<DataStructure> {
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

### 3.2. Entity

```ts
// ./person.ts
import { Entity, IEntity } from 'ddd-ts';

//
// The following approach results in making _all_ custom data attributes
// publicly available outside the custom Entity class.
//

interface IPerson extends IEntity {
  name: string;
  address: string;
  phone: number;
}

export class Person extends Entity<PersonData> implements IPerson {
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
  id: '1234',              // <- This enforces continuity over the Entity's lifecycle, as it moves back and forth between the in-memory and persistance layers
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


### 3.3. Aggregate Root

See [Entity Examples](#entity-1)

<!-- Todo Add more example with events? -->

TODO

### 3.4. Domain Events

<!-- Todo Would additional examples be useful here? -->

TODO

### 3.5. Domain Events Broker

More examples of how the Domain Events Broker can be used, and some of its features (e.g. queue draining, etc), see the [Events Broker tests](./src/domain-events-broker.test.ts).

## 4. Development

See [Contributing](./CONTRIBUTING.md).

## 5. Credits

- [Eric Evans' original 2003 book][evans-ddd], _the_ original reference on DDD.
- [Microsoft's .NET docs on DDD][ms-net-ddd].
- [Khalil Stemmler's Blog series on DDD][khalil-ddd-blog-series].
- The `DomainEventsBroker` implementation is based on [Khalil Stemmler's port][khalil-ddd-events-port] of [Udi Dahan's 2009 blog post about Domain Events in C#][dahan-csharp-ddd-event].

## 6. License

MIT


[fowler-ddd]: https://martinfowler.com/bliki/DomainDrivenDesign.html
[fowler-unit-of-work]: https://martinfowler.com/eaaCatalog/unitOfWork.html
[evans-ddd]: https://www.amazon.co.uk/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215
[khalil-ddd-blog-series]: https://khalilstemmler.com/articles/categories/domain-driven-design/
[khalil-ddd-events-port]: https://khalilstemmler.com/articles/typescript-domain-driven-design/chain-business-logic-domain-events/
[ms-net-ddd]: https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice
[dahan-csharp-ddd-event]: https://udidahan.com/2009/06/14/domain-events-salvation/




