export function useSocket() {
  return {
    connected: false,
    emit: () => {},
    on: () => {},
    off: () => {},
  };
}
