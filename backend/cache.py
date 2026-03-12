from cachetools import TTLCache
import hashlib

# In-memory cache: max 1000 items, 1 hour TTL
query_cache = TTLCache(maxsize=1000, ttl=3600)

def get_cache_key(query: str, tenant_id: str) -> str:
    return hashlib.sha256(f"{query.strip().lower()}|{tenant_id}".encode()).hexdigest()
