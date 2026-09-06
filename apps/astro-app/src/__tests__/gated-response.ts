/**
 * A server response the test releases by hand.
 *
 * `await opened` inside an msw handler holds the request open, so the test can
 * assert what the UI or cache shows mid-flight, then call `release()`.
 */
export const gatedResponse = () => {
  let release!: () => void;
  const opened = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { opened, release };
};
