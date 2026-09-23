// MAHR Office global type declarations
interface Window {
  cth: any;
}

declare module '*.tmj?raw' {
  const content: string;
  export default content;
}

declare module '*.png?url' {
  const content: string;
  export default content;
}
