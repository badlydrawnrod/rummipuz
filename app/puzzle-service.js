function abortError() {
  const error = new Error('Puzzle preparation cancelled.');
  error.name = 'AbortError';
  return error;
}

function freezeResult(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeResult);
    Object.freeze(value);
  }
  return value;
}

/**
 * Asynchronous worker boundary. Each request owns a worker so abort/dispose
 * interrupts synchronous search immediately and cannot cancel other requests.
 * Never falls back to blocking search on the main thread.
 */
export function createPuzzleService({ workerFactory = () => {
  if (typeof Worker !== 'function') throw new Error('This browser requires module worker support to prepare puzzles.');
  return new Worker(new URL('./puzzle-worker.js', import.meta.url), { type: 'module' });
} } = {}) {
  const pending = new Set();
  let disposed = false;
  const request = (operation, input, signal) => new Promise((resolve, reject) => {
    if (disposed) { reject(new Error('Puzzle service has been disposed.')); return; }
    if (signal?.aborted) { reject(abortError()); return; }
    let worker;
    let settled = false;
    const cleanup = () => {
      signal?.removeEventListener('abort', cancel);
      pending.delete(cancel);
      if (worker) {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        worker.removeEventListener('messageerror', onMessageError);
        worker.terminate();
      }
    };
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error); else resolve(freezeResult(value));
    };
    const cancel = () => finish(abortError());
    const onError = (event) => {
      event.preventDefault?.();
      finish(new Error(event.message || 'Puzzle worker failed to load or run.'));
    };
    const onMessageError = () => finish(new Error('Puzzle worker response could not be read.'));
    const onMessage = ({ data }) => {
      if (data?.ok === true && Object.hasOwn(data, 'value')) finish(null, data.value);
      else if (data?.ok === false && typeof data.error?.message === 'string') {
        const error = new Error(data.error.message);
        error.name = data.error.name || 'Error';
        finish(error);
      } else finish(new Error('Malformed puzzle worker response.'));
    };
    try {
      worker = workerFactory();
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      worker.addEventListener('messageerror', onMessageError);
      signal?.addEventListener('abort', cancel, { once: true });
      pending.add(cancel);
      // Handle an abort triggered during construction before listeners existed.
      if (signal?.aborted) { cancel(); return; }
      worker.postMessage({ operation, input });
    } catch (error) { finish(error); }
  });
  return {
    generate: (identity, { signal } = {}) => request('generate', identity, signal),
    solve: (state, { signal, ...options } = {}) => request('solve', { state, options }, signal),
    assist: (state, { signal, ...options } = {}) => request('assist', { state, options }, signal),
    rate: (puzzle, { signal, ...options } = {}) => request('rate', { puzzle, options }, signal),
    dispose() {
      disposed = true;
      for (const cancel of [...pending]) cancel();
    },
  };
}
