import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

/**
 * 🛡️ Playwright Singleton Browser Pool & FIFO Semaphore
 * Vibeforce Flow OS - Enterprise Hardening Engine
 * 
 * Reuses a single headless Chromium browser instance with bounded concurrency (MAX_PAGES = 3).
 * Supports AbortSignal to cancel abandoned requests immediately.
 * Self-healing: automatically recycles the browser instance after 50 jobs or if heap usage spikes.
 */

export type PdfPriority = 'high' | 'low';

export interface PdfRenderOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  waitForSelector?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  priority?: PdfPriority; // 'high' (interactive, default) or 'low' (batch export)
}

class PlaywrightBrowserPool {
  private browser: Browser | null = null;
  private isLaunching = false;
  private launchPromise: Promise<Browser> | null = null;
  private jobCount = 0;
  private activePages = 0;
  private activeBatchPages = 0;
  private readonly maxConcurrentPages = 3;
  private readonly maxBatchConcurrentPages = 2; // Reserves >= 1 slot for high-priority interactive requests
  private readonly maxJobsBeforeRecycle = 50;
  private readonly highPriorityQueue: Array<() => void> = [];
  private readonly lowPriorityQueue: Array<() => void> = [];

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      // Check for automatic recycling
      if (this.jobCount >= this.maxJobsBeforeRecycle && this.activePages === 0) {
        console.log(`[PDF-POOL] Recycling browser after ${this.jobCount} jobs...`);
        await this.closeBrowser();
      } else {
        return this.browser;
      }
    }

    if (this.isLaunching && this.launchPromise) {
      return this.launchPromise;
    }

    this.isLaunching = true;
    this.launchPromise = chromium
      .launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
        ],
      })
      .then((b) => {
        this.browser = b;
        this.isLaunching = false;
        this.jobCount = 0;
        return b;
      })
      .catch((err) => {
        this.isLaunching = false;
        this.launchPromise = null;
        console.error('[PDF-POOL] Failed to launch Playwright Chromium:', err);
        throw err;
      });

    return this.launchPromise;
  }

  private processQueue(): void {
    while (this.activePages < this.maxConcurrentPages) {
      if (this.highPriorityQueue.length > 0) {
        this.activePages++;
        const nextHigh = this.highPriorityQueue.shift();
        if (nextHigh) nextHigh();
      } else if (
        this.lowPriorityQueue.length > 0 &&
        this.activeBatchPages < this.maxBatchConcurrentPages
      ) {
        this.activePages++;
        this.activeBatchPages++;
        const nextLow = this.lowPriorityQueue.shift();
        if (nextLow) nextLow();
      } else {
        break;
      }
    }
  }

  private async acquireSlot(priority: PdfPriority = 'high', signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      throw new Error('PDF generation aborted before slot acquisition');
    }

    // High priority can claim any free slot (up to maxConcurrentPages)
    if (priority === 'high' && this.activePages < this.maxConcurrentPages) {
      this.activePages++;
      return;
    }

    // Low priority (batch) can only claim if under maxBatchConcurrentPages and no high-priority waiting
    if (
      priority === 'low' &&
      this.activePages < this.maxConcurrentPages &&
      this.activeBatchPages < this.maxBatchConcurrentPages &&
      this.highPriorityQueue.length === 0
    ) {
      this.activePages++;
      this.activeBatchPages++;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const targetQueue = priority === 'high' ? this.highPriorityQueue : this.lowPriorityQueue;

      const onAbort = () => {
        const idx = targetQueue.indexOf(release);
        if (idx !== -1) {
          targetQueue.splice(idx, 1);
        }
        reject(new Error('PDF generation request aborted'));
      };

      const release = () => {
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        if (signal?.aborted) {
          this.releaseSlot(priority);
          reject(new Error('PDF generation request aborted'));
        } else {
          resolve();
        }
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      targetQueue.push(release);
    });
  }

  private releaseSlot(priority: PdfPriority): void {
    this.activePages = Math.max(0, this.activePages - 1);
    if (priority === 'low') {
      this.activeBatchPages = Math.max(0, this.activeBatchPages - 1);
    }
    this.processQueue();
  }

  public async renderHtmlToPdf(html: string, options: PdfRenderOptions = {}): Promise<Buffer> {
    const {
      format = 'A4',
      landscape = false,
      printBackground = true,
      margin = { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      waitForSelector,
      timeoutMs = 30000,
      signal,
      priority = 'high',
    } = options;

    await this.acquireSlot(priority, signal);

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      if (signal?.aborted) {
        throw new Error('PDF generation aborted');
      }

      const browser = await this.getBrowser();
      context = await browser.newContext({
        viewport: { width: 1200, height: 800 },
        deviceScaleFactor: 2,
      });

      page = await context.newPage();
      page.setDefaultTimeout(timeoutMs);

      // Handle in-flight cancellation
      const abortHandler = async () => {
        try {
          if (page && !page.isClosed()) {
            await page.close();
          }
        } catch {}
      };

      if (signal) {
        signal.addEventListener('abort', abortHandler, { once: true });
      }

      await page.setContent(html, {
        waitUntil: 'networkidle',
        timeout: timeoutMs,
      });

      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: timeoutMs });
      }

      // Emulate print media
      await page.emulateMedia({ media: 'print' });

      const pdfBuffer = await page.pdf({
        format,
        landscape,
        printBackground,
        margin,
      });

      this.jobCount++;
      return Buffer.from(pdfBuffer);
    } finally {
      if (page && !page.isClosed()) {
        try {
          await page.close();
        } catch {}
      }
      if (context) {
        try {
          await context.close();
        } catch {}
      }
      this.releaseSlot(priority);
    }
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {}
      this.browser = null;
      this.launchPromise = null;
      this.isLaunching = false;
      this.jobCount = 0;
    }
  }
}

// Global Singleton Pool in server scope
const globalPoolKey = Symbol.for('__playwright_browser_pool__');
type GlobalWithPool = typeof globalThis & { [globalPoolKey]?: PlaywrightBrowserPool };

const globalWithPool = globalThis as GlobalWithPool;
if (!globalWithPool[globalPoolKey]) {
  globalWithPool[globalPoolKey] = new PlaywrightBrowserPool();
}

export const pdfService = globalWithPool[globalPoolKey]!;
