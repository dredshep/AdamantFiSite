export default function errNotify(
  customMsg: string,
  err: string,
  notify: (type: string, msg: string) => void
) {
  notify("error", `Failed to stake: ${err}`);
  console.log(`Failed to stake: ${err}`);
}
