import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Polyfill to inject at the top of _worker.js/index.js
const polyfill = `// MessageChannel polyfill for Cloudflare Workers - INJECTED BY POST-BUILD SCRIPT
if (typeof MessageChannel === 'undefined') {
  globalThis.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = {
        postMessage: () => {},
        onmessage: null,
        close: () => {},
        start: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true
      };
      this.port2 = {
        postMessage: () => {},
        onmessage: null,
        close: () => {},
        start: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true
      };
    }
  };
}

`;

try {
    const workerPath = join(process.cwd(), 'dist', '_worker.js', 'index.js');
    console.log('📝 Injecting MessageChannel polyfill into _worker.js/index.js...');

    const workerContent = readFileSync(workerPath, 'utf-8');
    const modifiedContent = polyfill + workerContent;

    writeFileSync(workerPath, modifiedContent, 'utf-8');
    console.log('✅ Successfully injected MessageChannel polyfill!');
} catch (error) {
    console.error('❌ Error injecting polyfill:', error.message);
    process.exit(1);
}
