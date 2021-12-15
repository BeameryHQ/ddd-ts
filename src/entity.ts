import { v4 as uuid } from 'uuid';

// eslint-disable-next-line no-use-before-define
const isEntity = (v: unknown): v is Entity<any> => v instanceof Entity;

export interface IEntity {
  readonly id: string;
  // support multi-tenant applications
  // Note: empty string if tenant isn't required
  readonly tenantId: string;

  equals(object?: IEntity): boolean;
}

interface defaultConstructorData {
  tenantId: string;
  id: string;
}

/**
 * An object whose definition is based on `identity` over just its attributes.
 *
 * Also known as `Reference Objects`.
 */
export abstract class Entity<
  T extends Partial<defaultConstructorData> = Partial<defaultConstructorData>,
> implements IEntity
{
  private readonly _id: IEntity['id'];
  private readonly _tenantId: IEntity['tenantId'];

  protected readonly _data: Omit<T, 'id' | 'tenantId'>;

  // Make `id` optional accounting for re-consituting objects from persistence
  constructor(data?: T) {
    this._tenantId = data?.tenantId ?? '';
    this._id = data?.id ?? uuid();

    // remove captured fields, if they exist
    delete data?.id;
    delete data?.tenantId;

    // @ts-expect-error
    // fixme: check typing
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
