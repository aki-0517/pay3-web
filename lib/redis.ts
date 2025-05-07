import { Redis } from '@upstash/redis'

// インメモリストレージの実装（Redisが利用できない場合のフォールバック）
class MemoryStorage {
  private storage: Map<string, any> = new Map();
  private hashStorage: Map<string, Record<string, any>> = new Map();

  async get(key: string) {
    return this.storage.get(key);
  }

  async set(key: string, value: any, options?: { ex?: number }) {
    this.storage.set(key, value);
    return 'OK';
  }

  async del(key: string) {
    this.storage.delete(key);
    return 1;
  }

  // Redis hsetと同等の実装
  async hset(key: string, fieldOrObject: string | Record<string, any>, value?: any) {
    if (!this.hashStorage.has(key)) {
      this.hashStorage.set(key, {});
    }
    
    const hash = this.hashStorage.get(key)!;
    
    if (typeof fieldOrObject === 'string' && value !== undefined) {
      hash[fieldOrObject] = value;
    } else if (typeof fieldOrObject === 'object') {
      Object.assign(hash, fieldOrObject);
    }
    
    return Object.keys(typeof fieldOrObject === 'string' ? { [fieldOrObject]: value } : fieldOrObject).length;
  }

  // Redis hgetallと同等の実装
  async hgetall(key: string) {
    return this.hashStorage.get(key) || {};
  }
}

// Redis接続を試みるが、環境変数がない場合はメモリストレージを使用
let redisClient: Redis | MemoryStorage;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.log('Redisに接続します...');
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.log('メモリストレージを使用します（開発モード）');
  redisClient = new MemoryStorage();
}

export const redis = redisClient; 