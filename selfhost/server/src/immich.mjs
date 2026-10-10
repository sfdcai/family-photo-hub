/** Immich access with either an API key or email + password (session token, re-login on expiry). */
let session = { key: "", token: "" };

async function login(cfg) {
  const res = await fetch(`${cfg.immichUrl}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: cfg.immichEmail, password: cfg.immichPassword }) });
  if (!res.ok) throw new Error(res.status === 401 ? "Immich rejected the email or password" : `Immich login ${res.status}`);
  const j = await res.json();
  session = { key: `${cfg.immichUrl}|${cfg.immichEmail}`, token: j.accessToken };
  return session.token;
}

export async function immichHeaders(cfg, fresh = false) {
  if (cfg.immichKey) return { "x-api-key": cfg.immichKey };
  if (!cfg.immichEmail || !cfg.immichPassword) throw new Error("Immich email and password (or API key) are not set");
  const token = !fresh && session.key === `${cfg.immichUrl}|${cfg.immichEmail}` && session.token ? session.token : await login(cfg);
  return { authorization: `Bearer ${token}` };
}

/** fetch against Immich; on 401 with password login, logs in again once. */
export async function immichFetch(cfg, path, init = {}) {
  if (!cfg.immichUrl) throw new Error("Immich address is not set");
  let res = await fetch(`${cfg.immichUrl}${path}`, { ...init, headers: { accept: "application/json", "content-type": "application/json", ...(init.headers || {}), ...(await immichHeaders(cfg)) } });
  if (res.status === 401 && !cfg.immichKey) res = await fetch(`${cfg.immichUrl}${path}`, { ...init, headers: { accept: "application/json", "content-type": "application/json", ...(init.headers || {}), ...(await immichHeaders(cfg, true)) } });
  return res;
}
export const resetImmichSession = () => { session = { key: "", token: "" }; };
