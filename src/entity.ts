import { v4 as uuid } from 'uuid';

export interface IEntity {
  readonly id: string;
  // multi-tenant application support
  // Note: `null` if not required/single-tenant
  readonly tenantId: string | null;

  equals(object?: IEntity): boolean;
}

export type IEntityCoreData = {
  [key: string]: unknown;
  id?: IEntity['id'];
  tenantId?: IEntity['tenantId'];
};

const isEntity = <T extends IEntityCoreData>(v: unknown): v is Entity<T> =>
  v instanceof Entity;

/**
 * An object whose definition is based on `identity` over just its attributes.
 *
 * Also known as `Reference Objects`.
 */
export abstract class Entity<T extends IEntityCoreData = IEntityCoreData>
  implements IEntity
{
  private readonly _id: IEntity['id'];

  private readonly _tenantId: IEntity['tenantId'];

  protected readonly _data: Omit<T, 'id' | 'tenantId'>;

  constructor(data: T) {
    // Optional `id`: allow for re-consituting objects from persistence
    this._id = data?.id ?? uuid();
    this._tenantId = data?.tenantId ?? null;

    delete data?.id;
    delete data?.tenantId;

    this._data = data ?? {};
  }

  public get id() {
    return this._id;
  }

  public get tenantId() {
    return this._tenantId;
  }

  public equals(object?: Entity<T>): boolean {
    if (object === null || object === undefined || !isEntity(object)) {
      return false;
    }

    return Object.is(this, object) || this._id === object.id;
  }
}

//
// Utility Types
//

/**
 * Create the public interface of the resulting Entity.
 *
 * This allows you to depend on an abstraction over a concretion.
 */
export type BuildEntityInterface<T> = IEntity & Exclude<T, 'IEntityCoreData'>;
