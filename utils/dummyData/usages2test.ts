// Define a type for Usage which can be one of these three strings
export type Usage = "BRIDGE" | "LPSTAKING" | "SWAP";

// This utility type checks if any element is present more than once in a tuple
export type HasDuplicates<T extends readonly any[]> = T extends readonly [
  infer X,
  ...infer Rest
]
  ? X extends Rest[number]
    ? true
    : HasDuplicates<Rest>
  : false;

// Define a type that is either the array or never if there are duplicates
export type UniqueArray<T extends readonly any[]> =
  HasDuplicates<T> extends true ? never : T;

// Usage of UniqueArray type
export type Usages = UniqueArray<[Usage, Usage, Usage]>;

// Example usages
const validUsages: Usages = ["BRIDGE", "LPSTAKING", "SWAP"] as const; // This will be of type Usages if unique
// const invalidUsages: Usages = ["BRIDGE", "BRIDGE", "SWAP"] as const; // This will raise a type error as it should be never

// Helper function to construct a UniqueArray, ensuring type checking
function createUniqueArray<T extends Usage[]>(
  ...elements: UniqueArray<T>
): UniqueArray<T> {
  return elements as UniqueArray<T>;
}

// Proper usage
const uniqueUsages = createUniqueArray("BRIDGE", "LPSTAKING", "SWAP"); // OK
// const invalidUsages = createUniqueArray("BRIDGE", "BRIDGE", "SWAP"); // Error at compile time
