/**
 * Main update state function
 */
function updateState<
  State,
  TopKey extends keyof State,
  NestedKey extends keyof State[TopKey]
>(
  state: State,
  topKey: TopKey,
  nestedKey: NestedKey,
  newValue: State[TopKey][NestedKey]
): State {
  const updatedNestedState = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(state[topKey] as any),
    [nestedKey]: newValue,
  } as State[TopKey];

  const updatedState = {
    ...state,
    [topKey]: updatedNestedState,
  };

  return updatedState;
}

export default updateState;
