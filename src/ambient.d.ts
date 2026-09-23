// Ambient declarations for optional dependencies

interface Window {
  cth: any;
}

declare module 'react-markdown' {
  const ReactMarkdown: any;
  export default ReactMarkdown;
}

declare module 'remark-gfm' {
  const remarkGfm: any;
  export default remarkGfm;
}

declare module 'hast' {
  export type Root = any;
  export type Element = any;
}

declare module '@openai/agents-realtime' {
  export const tool: any;
  export class RealtimeAgent {
    constructor(...args: any[]);
    [key: string]: any;
  }
  export class RealtimeSession {
    constructor(...args: any[]);
    [key: string]: any;
  }
  export class OpenAIRealtimeWebRTC {
    constructor(...args: any[]);
    [key: string]: any;
  }
}

declare module '@uiw/react-codemirror' {
  const CodeMirror: any;
  export default CodeMirror;
}

declare module '@codemirror/view' {
  export const EditorView: any;
}

declare module '@codemirror/language' {
  export const HighlightStyle: any;
  export const syntaxHighlighting: any;
}

declare module '@lezer/highlight' {
  export const tags: any;
}

declare module '@codemirror/lang-json' {
  export const json: any;
}

declare module '@xterm/xterm' {
  export class Terminal {
    constructor(...args: any[]);
    [key: string]: any;
  }
  export interface ITerminalOptions {
    [key: string]: any;
  }
  export interface ILink {
    [key: string]: any;
  }
}

declare module '@xterm/addon-fit' {
  export class FitAddon {
    constructor(...args: any[]);
    fit(): void;
    [key: string]: any;
  }
}

declare module '@xterm/addon-webgl' {
  export class WebglAddon {
    constructor(...args: any[]);
    [key: string]: any;
  }
}

declare module '@xterm/addon-unicode11' {
  export class Unicode11Addon {
    constructor(...args: any[]);
    [key: string]: any;
  }
}

declare module '@monaco-editor/react' {
  export const DiffEditor: any;
  export const loader: any;
  export type OnMount = any;
  const Editor: any;
  export default Editor;
}

declare module 'monaco-editor' {
  export const editor: any;
  export const languages: any;
}
