let requestDelayMs = 0;
let fetchTimeoutMs = 5_000;

let lastSlot: Promise<void> = Promise.resolve();

export function configureFetch(options: {
  requestDelayMs?: number;
  fetchTimeoutMs?: number;
}): void {
  requestDelayMs = options.requestDelayMs ?? 0;
  fetchTimeoutMs = options.fetchTimeoutMs ?? 5_000;
  lastSlot = Promise.resolve();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function throttledFetch(url: string, init?: RequestInit): Promise<Response> {
  if (requestDelayMs > 0) {
    const waitFor = lastSlot;
    let release!: () => void;
    lastSlot = new Promise((r) => {
      release = r;
    });
    await waitFor;
    await sleep(requestDelayMs);
    release();
  }

  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(fetchTimeoutMs),
    redirect: "follow",
  });
}
