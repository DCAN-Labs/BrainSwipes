import loadRuntimeConfig from './runtimeConfig';

export default async function getFirebaseConfig() {
  const cfg = await loadRuntimeConfig();
  return cfg.firebase;
}
