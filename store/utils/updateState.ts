/**
 * Main update state function
 */
function updateState<
  State extends Record<string, unknown>,
  TopKey extends keyof State,
  NestedKey extends keyof State[TopKey]
>(
  state: State,
  topKey: TopKey,
  nestedKey: NestedKey,
  newValue: State[TopKey][NestedKey]
): State {
  const updatedNestedState = {
    ...(state[topKey] as Record<string, unknown>),
    [nestedKey]: newValue,
  } as State[TopKey];

  const updatedState: State = {
    ...state,
    [topKey]: updatedNestedState,
  };

  return updatedState;
}

export default updateState;
