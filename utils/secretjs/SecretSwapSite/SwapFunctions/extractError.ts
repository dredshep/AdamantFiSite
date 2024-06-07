export const extractError = (result: { raw_log?: string; code: number }) => {
  if (
    result?.raw_log &&
    result.raw_log.includes("Operation fell short of expected_return")
  ) {
    return "Swap fell short of expected return (slippage error)";
  }
  if (result?.raw_log) {
    return result.raw_log;
  }
  console.error(result);
  return `Unknown error`;
};
