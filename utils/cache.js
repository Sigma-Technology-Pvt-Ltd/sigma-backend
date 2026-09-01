/**
 * In-Memory TTL Cache for rarely-changing CMS endpoints.
 * Default TTL: 10 minutes (600 seconds).
 */
class MemoryCache {
    constructor() {
        this.store = new Map();
    }

    get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        if (Date.now() > item.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }

    set(key, value, ttlSeconds = 600) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + (ttlSeconds * 1000)
        });
    }

    del(keyOrPattern) {
        if (typeof keyOrPattern === 'string' && keyOrPattern.includes('*')) {
            const prefix = keyOrPattern.replace('*', '');
            for (const key of this.store.keys()) {
                if (key.startsWith(prefix)) {
                    this.store.delete(key);
                }
            }
        } else {
            this.store.delete(keyOrPattern);
        }
    }

    flush() {
        this.store.clear();
    }
}

const cache = new MemoryCache();
export default cache;
