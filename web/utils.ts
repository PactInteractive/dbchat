let uniqueIdCounter = -1;
export function getUniqueId() {
  uniqueIdCounter++;
  return uniqueIdCounter;
}

export function assert<T>(condition: T | null | undefined | false, message: string): asserts condition is T {
  if (condition === null || condition === undefined || condition === false) {
    console.error(`[ASSERT] ${message}:`, condition);
    if (new URLSearchParams(window.location.search).get('debug')) {
      debugger;
    }
    throw new Error(message);
  }
}

export function wait(delayInMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayInMs));
}
