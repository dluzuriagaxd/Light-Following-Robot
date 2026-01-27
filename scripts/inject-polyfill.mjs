import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const polyfillContent = `// MessageChannel polyfill for Cloudflare Workers
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
  const workerDir = join(process.cwd(), 'dist', '_worker.js');
  const indexFile = join(workerDir, 'index.js');
  const polyfillFile = join(workerDir, 'polyfill.mjs');

  console.log('📝 Creating MessageChannel polyfill module...');

  // Ensure worker directory exists before writing (though build should have created it)
  if (existsSync(workerDir)) {
    writeFileSync(polyfillFile, polyfillContent, 'utf-8');
    console.log('✅ Created dist/_worker.js/polyfill.mjs');

    if (existsSync(indexFile)) {
      console.log('📝 Injecting import into index.js...');
      let content = readFileSync(indexFile, 'utf-8');

      if (!content.includes('import "./polyfill.mjs";')) {
        content = 'import "./polyfill.mjs";\n' + content;
        writeFileSync(indexFile, content, 'utf-8');
        console.log('✅ Injected import into dist/_worker.js/index.js');
      } else {
        console.log('ℹ️ Import already present in index.js');
      }
    } else {
      console.warn('⚠️ dist/_worker.js/index.js not found. Skipping injection. Entry point might be named differently.');
    }
  } else {
    console.warn('⚠️ dist/_worker.js directory not found. Skipping polyfill injection.');
  }

} catch (error) {
  console.error('❌ Error injecting polyfill:', error.message);
  process.exit(1);
}
