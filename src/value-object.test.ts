import { ValueObject } from './value-object';

describe('ValueObject', () => {
  it('correctly compares two values with the same attributes', () => {
    class TestVO1 extends ValueObject<{ foo: string }> {}
    class TestVO2 extends ValueObject<{ foo: string }> {}
    class TestVO3 extends ValueObject<string> {}
    class TestVO4 extends ValueObject<string> {}

    const vo1 = new TestVO1({ foo: 'bar' });
    const vo2 = new TestVO2({ foo: 'bar' });
    const vo3 = new TestVO3('bar');
    const vo4 = new TestVO4('bar');

    expect(vo1.equals(vo2)).toBeTrue();
    expect(vo3.equals(vo4)).toBeTrue();
  });

  it('correctly compares two identical values', () => {
    class TestVO1 extends ValueObject<string> {}

    const vo1 = new TestVO1('hello world');
    const vo2 = new TestVO1('hello world');

    expect(vo1.equals(vo1)).toBeTrue();
    expect(vo1.equals(vo2)).toBeTrue();
  });

  it('correctly compares two different values', () => {
    class TestVO1 extends ValueObject<{ foo: string }> {}
    class TestVO2 extends ValueObject<{ foo: string; bar: number }> {}

    const vo1 = new TestVO1({ foo: 'bar' });
    const vo2 = new TestVO1({ foo: 'baz' });

    expect(vo1.equals(vo2)).toBeFalse();

    const vo3 = new TestVO2({ foo: 'bar', bar: 23 });
    const vo4 = new TestVO2({ foo: 'bar', bar: 34 });

    expect(vo3.equals(vo4)).toBeFalse();
  });
});
