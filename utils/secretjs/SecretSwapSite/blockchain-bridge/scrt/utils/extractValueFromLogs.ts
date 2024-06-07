import { TxResponse } from "secretjs";

export default function extractValueFromLogs(
  txResponse: TxResponse,
  key: string,
  lastValue?: boolean,
): string {
  // Find the event with type 'wasm'
  const wasmEvent = txResponse.events.find((e) => e.type === "wasm");

  if (!wasmEvent) {
    return ""; // Return an empty string if no wasm event is found
  }

  // Convert attributes to an array and filter them by key
  let wasmAttributes = Array.from(wasmEvent.attributes || []);

  if (lastValue) {
    wasmAttributes = wasmAttributes.reverse(); // Reverse to get the last value if specified
  }

  // Find the attribute with the specified key, converting Uint8Array to string
  const attribute = wasmAttributes.find((a) =>
    new TextDecoder().decode(a.key) === key
  );

  // Return the value as a string, or an empty string if not found or undefined
  return attribute ? new TextDecoder().decode(attribute.value) : "";
}
