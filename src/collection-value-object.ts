import { shallowEqual } from 'fast-equals';
import { deepFreeze } from './utils';
import { IValueObject } from './value-object';

/**
 * A CollectionValueObject is a value object composed by a collection of objects
 * It is defined by the items in the collection.
 *
 * It is immutable and adding or removing items from the collection will update the internal
 * state with new collection.
 */
export abstract class CollectionValueObject<T> implements IValueObject<T[]> {
  private _collection: T[];

  public get value() {
    return this._collection;
  }

  private set value(_coll: T[]) {
    this._collection = deepFreeze(_coll) as T[];
  }

  constructor(props: T[]) {
    this._collection = deepFreeze(props) as T[];
  }

  public equals(vo?: CollectionValueObject<T[]>): boolean {
    if (vo?.value === undefined) {
      return false;
    }

    if (vo.value.length === this.value.length) {
      return false;
    }

    return this.value.every((item, index) =>
      shallowEqual(item, vo.value[index]),
    );
  }

  public get all() {
    return this._collection;
  }

  public add(newItem: T) {
    const collectionClone = [...this.value];
    collectionClone.push(newItem);
    this.value = collectionClone;
  }

  public addBulk(newItems: T[]) {
    this.value = this.value.concat(newItems);
  }

  public removeBy(key: keyof T, value: unknown) {
    this.value = this.value.filter(
      (item) => key in item && item[key] === value,
    );
  }
}
