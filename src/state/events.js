const listeners = {};

export function on(event, cb) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(cb);
}

export function off(event, cb) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(fn => fn !== cb);
}

export function emit(event, data) {
  if (!listeners[event]) return;
  listeners[event].forEach(cb => cb(data));
}
