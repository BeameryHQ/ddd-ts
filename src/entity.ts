import { v4 as uuid } from 'uuid';

// eslint-disable-next-line no-use-before-define
const isEntity = <T extends IBaseEntityData = IBaseEntityData>(
  v: unknown,
): v is Entity<T> => v instanceof Entity;

export interface IEntity {
  readonly id: string;
  // support multi-tenant applications
  // Note: empty string if tenant isn't required
  readonly tenantId: string;

  equals(object?: IEntity): boolean;
}

type IBaseEntityData = Partial<{
  tenantId: IEntity['tenantId'];
  id: IEntity['id'];
}>;

/**
 * An object whose definition is based on `identity` over just its attributes.
 *
 * Also known as `Reference Objects`.
 */
export abstract class Entity<T extends IBaseEntityData = IBaseEntityData>
  implements IEntity
{
  private readonly _id: IEntity['id'];
  private readonly _tenantId: IEntity['tenantId'];

  protected readonly _data: Omit<T, 'id' | 'tenantId'>;

  // Make `id` optional: allow for re-consituting objects from persistence
  constructor(data: T) {
    this._tenantId = data?.tenantId ?? '';
    this._id = data?.id ?? uuid();

    // remove captured fields, if they exist
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
 * Create the type for the custom (data) attributes of an Entity.
 *
 * Note: The attribute getters/setters will still have to be defined manually within your Entity object.
 */
export type BuildEntityDataType<T> = T & IBaseEntityData;

/**
 * Create the public interface of the resulting Entity.
 * This allows you to depend on an abstraction over a concretion.
 */
export type BuildEntityInterface<T> = IEntity &
  Exclude<
    // The nested `Exclude` "cleans" up the type if a consumer passes the result of the `BuildEntityDataType` helper
    BuildEntityDataType<Exclude<T, 'IBaseEntityData'>>,
    'IBaseEntityData'
  >;
