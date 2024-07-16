export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const isEmptyObject = (obj: object) => {
  for (const i in obj) {
    return false;
  }
  return true;
};
