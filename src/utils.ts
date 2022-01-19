export function deepFreeze(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  Object.keys(obj).forEach((key) => {
    const child: unknown = (obj as Record<string, unknown>)[key];
    if (child && typeof child === 'object' && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  });

  return Object.freeze(obj);
}
