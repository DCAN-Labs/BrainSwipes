export default async function loadRuntimeConfig() {
  const res = await fetch('/runtime-config.json', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load runtime-config.json: ${res.status}`);
  }

  return res.json();
}
