import { v4 as uuid } from 'uuid';
import { Entity } from './entity';

describe('Entity', () => {
  it("sets it's own id for new objects", () => {
    class TestEntity extends Entity {}
    const obj = new TestEntity();

    expect(obj.id).toBeString();
    expect(obj.id.length).toBeGreaterThan(0);
  });

  it('retains id for reconstituted objects', () => {
    class TestEntity extends Entity {}
    const preexistingId = uuid();
    const obj = new TestEntity({ id: preexistingId });

    expect(obj.id).toStrictEqual(preexistingId);
  });

  it('correctly compares two entities with the same id', () => {
    class TestEntity extends Entity {}
    class TestEntityWithData extends Entity<{ id?: string; foo: string }> {}

    const preexistingId = uuid();
    const obj1 = new TestEntity({ id: preexistingId });
    const obj2 = new TestEntity({ id: preexistingId });
    // this time with additional data
    const obj3 = new TestEntityWithData({ id: preexistingId, foo: 'bar' });

    expect(obj1.equals(obj2)).toBeTrue();
    expect(obj1.equals(obj3)).toBeTrue();
  });

  it('correctly compares two identical entities', () => {
    class TestEntity extends Entity {}

    const obj1 = new TestEntity();

    expect(obj1.equals(obj1)).toBeTrue();
  });

  it('correctly compares two different entities', () => {
    class TestEntity extends Entity {}

    const preexistingId = uuid();
    const obj1 = new TestEntity({ id: preexistingId });
    const obj2 = new TestEntity();

    expect(obj1.equals(obj2)).toBeFalse();
  });
});
