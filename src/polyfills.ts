// MessageChannel polyfill for Cloudflare Workers
// This MUST run before any React code is loaded
if (typeof MessageChannel === 'undefined') {
    (globalThis as any).MessageChannel = class MessageChannel {
        port1: any;
        port2: any;

        constructor() {
            this.port1 = {
                postMessage: () => { },
                onmessage: null,
                close: () => { },
                start: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
                dispatchEvent: () => true
            };
            this.port2 = {
                postMessage: () => { },
                onmessage: null,
                close: () => { },
                start: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
                dispatchEvent: () => true
            };
        }
    };
}
