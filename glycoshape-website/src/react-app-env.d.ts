/// <reference types="react-scripts" />
declare namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_API_URL: string;
      REACT_APP_BUILD_DEV: string;
      
    }
  }

// src/global.d.ts

declare module 'molstar/lib/mol-plugin-ui/spec' {
  export function DefaultPluginUISpec(): any;
}

declare module 'molstar/lib/mol-plugin-ui' {
  export function createPluginUI(config: {
      target: HTMLElement;
      render: (component: any, container: Element) => any;
      spec: any;
  }): Promise<any>;
}

declare module 'molstar/lib/mol-util/color' {
  export function Color(color: number): any;
}

declare module 'molstar/lib/mol-plugin/commands' {
  export const PluginCommands: {
      Canvas3D: {
          SetSettings: (plugin: any, settings: any) => void;
      };
  };
}

declare module 'molstar/lib/mol-util/assets' {
  export const Asset: {
      Url(url: string): string;
  };
}
