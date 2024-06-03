export default (customMsg: string, err: string, notify: any) => {
  notify('error', `Failed to stake: ${err}`);
  console.log(`Failed to stake: ${err}`);
};
