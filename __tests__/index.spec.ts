import { Cache } from '../src';

describe('Cache', () => {
  it('should create de cache', () => {
    const cache = new Cache();
    expect(cache).toBeInstanceOf(Cache);
  });

  it('should add items to the cache', async () => {
    const cache = new Cache();

    const method = jest.fn(async (key) => `${key}_value`);

    const value = await cache.get('key', () => method('key'));
    const value2 = await cache.get('key', () => method('key'));

    expect(value).toBe('key_value');
    expect(value2).toBe('key_value');
    expect(method).toHaveBeenCalledTimes(1);
  });

  it('should remove items from the cache', async () => {
    const cache = new Cache();

    const method = jest.fn(async (key) => `${key}_value`);

    const value = await cache.get('key', () => method('key'));
    expect(value).toBe('key_value');

    await cache.del('key');
    const value2 = await cache.get('key', () => method('key'));

    expect(value2).toBe('key_value');
    expect(method).toHaveBeenCalledTimes(2);
  });

  it('should empty the cache', async () => {
    const cache = new Cache();

    const method = jest.fn(async (key) => `${key}_value`);

    const value = await cache.get('key', () => method('key'));
    expect(value).toBe('key_value');

    await cache.reset();
    const value2 = await cache.get('key', () => method('key'));

    expect(value2).toBe('key_value');
    expect(method).toHaveBeenCalledTimes(2);
  });

  it('should prune the cache', async () => {
    const onDispose = jest.fn();

    const cache = new Cache({
      maxAge: 10,
      dispose: onDispose,
    });

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const method = jest.fn(async (key) => `${key}_value`);

    const value = await cache.get('key', () => method('key'));
    expect(value).toBe('key_value');

    await delay(100);

    await cache.prune();

    const isUnd = await cache.get('key');
    expect(isUnd).toBeUndefined();

    expect(method).toHaveBeenCalledTimes(1);
    expect(onDispose).toHaveBeenCalledTimes(1);
  });

  it('should not put failed items in the cache', async () => {
    const cache = new Cache();
    let callCount = 0;

    const method = jest.fn(async (key) => {
      if (callCount === 0) {
        callCount++;
        throw new Error(`${key}_fail`);
      }
      return `${key}_value`;
    });

    const put = cache.get('key', () => method('key'));

    await put.catch((err) => {
      expect(err.message).toBe('key_fail');
    });

    const value = await cache.get('key', () => method('key'));
    expect(value).toBe('key_value');

    expect(method).toHaveBeenCalledTimes(2);
  });

  it('should make the funnel', async () => {
    const cache = new Cache();
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    let callCount = 0;

    const method = jest.fn(async (key) => {
      await delay(100);
      const ret = `${key}_value_${callCount}`;
      callCount++;
      return ret;
    });

    const valueP = cache.get('key', () => method('key'));
    const valueP2 = cache.get('key', () => method('key'));

    const value = await valueP;
    const value2 = await valueP2;

    expect(value).toBe('key_value_0');
    expect(value2).toBe('key_value_0');

    expect(method).toHaveBeenCalledTimes(1);
  });

  it('should support sync getters', async () => {
    const cache = new Cache();

    const method = jest.fn((key) => `${key}_value`);

    const value = await cache.get('key', () => method('key'));
    const value2 = await cache.get('key', () => method('key'));

    expect(value).toBe('key_value');
    expect(value2).toBe('key_value');
    expect(method).toHaveBeenCalledTimes(1);
  });

  it('should not put failed sync items in the cache', async () => {
    const cache = new Cache();
    let callCount = 0;

    const method = jest.fn((key) => {
      if (callCount === 0) {
        callCount++;
        throw new Error(`${key}_fail`);
      }
      return `${key}_value`;
    });

    const put = cache.get('key', () => method('key'));

    await put.catch((err) => {
      expect(err.message).toBe('key_fail');
    });

    const value = await cache.get('key', () => method('key'));
    expect(value).toBe('key_value');

    expect(method).toHaveBeenCalledTimes(2);
  });
});
