import { afterEach, describe, expect, it, vi } from 'vitest';

import loadRuntimeConfig from '../../src/runtimeConfig';

describe('loadRuntimeConfig', () => {
  afterEach(() => {
    // Prevent a mocked fetch implementation from leaking into another test.
    vi.unstubAllGlobals();
  });

  it('loads the runtime configuration without using the browser cache', async () => {
    // This represents the public configuration returned by runtime-config.json.
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

    // The loader should return the parsed configuration unchanged.
    await expect(loadRuntimeConfig()).resolves.toEqual(runtimeConfig);

    // The Runtime configuration must always be fetched so deployment can
    // change Firebase projects without rebuilding the JavaScript bundle.
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      '/runtime-config.json',
      { cache: 'no-store' },
    );
    expect(json).toHaveBeenCalledOnce();
  });

  it('reports the response status when the configuration cannot be loaded', async () => {
    // Simulate the web server response when the runtime-config.json is missing.
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

    // An unsuccessful HTTP response should no be parsed as valid configuration.
    expect(json).not.toHaveBeenCalled();
  });

  it('propagates network failures', async () => {
    // Make sure a rejected fetch from something like an offline browser or an
    const networkError = new TypeError('Network request failed');
    // unreachable server is used instead of a HTTP error response.
    const fetchMock = vi.fn().mockRejectedValue(networkError);
    vi.stubGlobal('fetch', fetchMock);

    // Preserve the original error so application bootstrap can report it.
    await expect(loadRuntimeConfig()).rejects.toBe(networkError);
  });
});
