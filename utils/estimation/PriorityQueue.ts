export class PriorityQueue<T> {
  private items: { element: T; priority: number }[] = [];

  constructor(private compare: (a: T, b: T) => number) {}

  enqueue(element: T) {
    this.items.push({ element, priority: this.compare(element, element) });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}
