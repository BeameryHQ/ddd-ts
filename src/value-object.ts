import { shallowEqual } from 'fast-equals';

export interface IValueObject<T = unknown> {
  get value(): T;
  equals(vo?: IValueObject): boolean;
}

/**
 * A small immutable object whose equality is not based on identity but purely on its attributes.
 *
 * ## Rules
 * - Value objects are immutable;
 * - Value objects can reference other objects;
 *
 * ## Notes:
 * - Value objects can/should hold validation for their data. When we have validation rules.
 */
export abstract class ValueObject<T> implements IValueObject<T> {
  protected readonly _data: T;

  constructor(props: T) {
    this._data = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo?.value === undefined) {
      return false;
    }

    return shallowEqual(this._data, vo.value);
  }

  public get value() {
    return this._data;
  }
}
