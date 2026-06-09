/// <reference types="@wix/cli-app" />
/// <reference types="vite/client" />

declare module '*.json' {
  const value: Record<string, string>;
  export default value;
}

declare module '*.png' {
  const src: string | { src: string };
  export default src;
}
