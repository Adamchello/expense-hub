// Fabric pattern: immutable builder over an array of values.
// Each method returns a new builder; `.build()` returns the array.
export const mock = <T>(data: T[]) => ({
  updateAt: (index: number, value: T) =>
    mock([...data.slice(0, index), value, ...data.slice(index + 1)]),
  repeat: (count: number, value: T) =>
    mock([...data, ...Array.from({ length: count }, () => value)]),
  append: (...values: T[]) => mock([...data, ...values]),
  build: () => data,
});
