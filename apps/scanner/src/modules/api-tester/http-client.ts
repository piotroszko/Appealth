export class HttpClient {
  private lastSlot: Promise<void> = Promise.resolve();

  constructor(
    private readonly requestDelayMs = 0,
    private readonly fetchTimeoutMs = 5000,
  ) {}

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    if (this.requestDelayMs > 0) {
      const waitFor = this.lastSlot;
      let release!: () => void;
      this.lastSlot = new Promise((r) => {
        release = r;
      });
      await waitFor;
      await sleep(this.requestDelayMs);
      release();
    }

    return fetch(url, {
      ...init,
      signal: AbortSignal.timeout(this.fetchTimeoutMs),
      redirect: init?.redirect ?? "follow",
    });
  }

  async tryFetch(url: string, init: RequestInit): Promise<string | null> {
    try {
      const res = await this.fetch(url, init);
      return await res.text();
    } catch {
      return null;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
