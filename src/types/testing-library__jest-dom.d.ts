// Minimal stub for @testing-library/jest-dom to satisfy tsc during migration
declare module 'testing-library__jest-dom' {}
declare module '@testing-library/jest-dom' {
  // provide a minimal augmentation for Jest matchers used in tests
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      [key: string]: any;
    }
  }
  const _default: any;
  export default _default;
}
