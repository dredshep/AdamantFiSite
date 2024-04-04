/**
 * Safely updates a nested property within a state object, ensuring type safety.
 *
 * @param currentState - The current state object.
 * @param topLevelKey - The key of the top-level property within the state object to update.
 * @param nestedKey - The key of the nested property within the top-level property to update.
 * @param newValue - The new value to set for the nested property.
 * @returns A new state object with the nested property updated.
 */
function updateState<
  CurrentStateType extends Record<string, any>,
  TopLevelKey extends keyof CurrentStateType,
  NestedKey extends keyof CurrentStateType[TopLevelKey]
>(
  currentState: CurrentStateType,
  topLevelKey: TopLevelKey,
  nestedKey: NestedKey,
  newValue: CurrentStateType[TopLevelKey][NestedKey] | Record<string, any>
): CurrentStateType {
  // Determine if newValue is a plain object for a potential merge operation.
  const isObject = (obj: any): obj is Record<string, any> =>
    obj && typeof obj === "object" && !Array.isArray(obj);

  // Perform the update operation.
  const updatedState = {
    ...currentState,
    [topLevelKey]: {
      ...currentState[topLevelKey],
      [nestedKey]:
        isObject(newValue) && isObject(currentState[topLevelKey][nestedKey])
          ? { ...currentState[topLevelKey][nestedKey], ...newValue }
          : newValue,
    },
  };

  return updatedState;
}

export default updateState;
