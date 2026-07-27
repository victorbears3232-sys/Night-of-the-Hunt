// PlayerIdentity.js — a stable, anonymous per-browser hunter identity for
// leaderboard tracking. No account or sign-in is required: a UUID is generated
// once and persisted in localStorage, alongside an editable display name.
// This keeps leaderboard data attributable to a single player across sessions
// without ever asking them to log in.

const ID_KEY = 'hunt_player_id';
const NAME_KEY = 'hunt_player_name';

function uuid() {
  try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) { /* fall through */ }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function storage() {
  try { return window.localStorage; } catch (e) { return null; }
}

export function getPlayerId() {
  const s = storage();
  if (!s) return uuid();
  let id = s.getItem(ID_KEY);
  if (!id) { id = uuid(); s.setItem(ID_KEY, id); }
  return id;
}

export function defaultName(id) {
  const tail = (String(id || '').replace(/-/g, '').slice(0, 4).toUpperCase()) || 'XXXX';
  return 'Hunter-' + tail;
}

export function getPlayerName() {
  const s = storage();
  if (!s) return defaultName(getPlayerId());
  let name = s.getItem(NAME_KEY);
  if (!name) { name = defaultName(getPlayerId()); s.setItem(NAME_KEY, name); }
  return name;
}

export function setPlayerName(name) {
  const s = storage();
  if (!s) return defaultName(getPlayerId());
  const clean = String(name || '').trim().slice(0, 24) || defaultName(getPlayerId());
  s.setItem(NAME_KEY, clean);
  return clean;
}

export function getIdentity() {
  return { id: getPlayerId(), name: getPlayerName() };
}