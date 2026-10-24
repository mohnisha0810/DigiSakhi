// Mock browser storage and environment for Node.js test execution
export class MockLocalStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

export class MockBroadcastChannel {
  name: string;
  private listeners: Array<(event: any) => void> = [];

  constructor(name: string) {
    this.name = name;
  }

  postMessage(data: any): void {
    // Synchronous dispatch to active listeners for testing
    this.listeners.forEach((fn) => fn({ data }));
  }

  addEventListener(type: string, listener: any): void {
    if (type === 'message') {
      this.listeners.push(listener);
    }
  }

  removeEventListener(type: string, listener: any): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  close(): void {
    this.listeners = [];
  }
}

export function setupTestEnvironment(): MockLocalStorage {
  const mockStorage = new MockLocalStorage();
  (globalThis as any).localStorage = mockStorage;
  (globalThis as any).window = {
    localStorage: mockStorage,
    BroadcastChannel: MockBroadcastChannel,
  };
  (globalThis as any).BroadcastChannel = MockBroadcastChannel;
  return mockStorage;
}
