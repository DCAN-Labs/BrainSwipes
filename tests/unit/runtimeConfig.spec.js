import { afterEach, describe, expect, it, vi } from 'vitest';

import loadRuntimeConfig from '../../src/runtimeConfig';

describe('loadRuntimeConfig', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the runtime configuration without using the browser cache', async () => {
    const runtimeConfig = {
      firebase: {
        projectId: 'test-project',
      },
    };
    const json = vi.fn().mockResolvedValue(runtimeConfig);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadRuntimeConfig()).resolves.toEqual(runtimeConfig);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      '/runtime-config.json',
      { cache: 'no-store' },
    );
    expect(json).toHaveBeenCalledOnce();
  });

  it('reports the response status when the configuration cannot be loaded', async () => {
    const json = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadRuntimeConfig()).rejects.toThrow(
      'Failed to load runtime-config.json: 404',
    );
    expect(json).not.toHaveBeenCalled();
  });

  it('propagates network failures', async () => {
    const networkError = new TypeError('Network request failed');
    const fetchMock = vi.fn().mockRejectedValue(networkError);
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadRuntimeConfig()).rejects.toBe(networkError);
  });
});
