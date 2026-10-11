// Offline support is independent of game state, preferences, and progression.
export async function initialiseOffline({
  serviceWorker = globalThis.navigator?.serviceWorker,
  secure = globalThis.isSecureContext,
  onStatus = () => {},
} = {}) {
  if (!secure) {
    onStatus('Offline use requires HTTPS or localhost.');
    return null;
  }
  if (!serviceWorker) {
    onStatus('Offline use is not supported by this browser.');
    return null;
  }
  onStatus('Preparing offline use…');
  try {
    const registration = await serviceWorker.register(new URL('./service-worker.js', import.meta.url), {
      type: 'module', scope: new URL('./', import.meta.url).href, updateViaCache: 'none',
    });
    const refresh = () => {
      if (registration.active?.state === 'activated') {
        onStatus(registration.waiting
          ? 'Ready for offline use. Close all Rummipuz windows to apply an update.'
          : 'Ready for offline use on this device.');
      } else if (registration.installing?.state === 'redundant') {
        onStatus('Offline setup could not finish. Reload while connected to try again.');
      }
    };
    const watched = new Set();
    const watch = () => {
      for (const worker of [registration.installing, registration.active]) {
        if (!worker || watched.has(worker)) continue;
        watched.add(worker);
        worker.addEventListener('statechange', () => {
          if (worker.state === 'redundant' && !registration.active) {
            onStatus('Offline setup could not finish. Reload while connected to try again.');
          } else refresh();
        });
      }
      refresh();
    };
    registration.addEventListener('updatefound', watch);
    serviceWorker.addEventListener('controllerchange', refresh);
    watch();
    return registration;
  } catch {
    onStatus('Offline setup is unavailable. Reload while connected to try again.');
    return null;
  }
}
