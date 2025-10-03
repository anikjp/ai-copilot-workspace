"""
Rate Limiting System
===================

Comprehensive rate limiting implementation with support for:
- Per-user rate limiting
- Per-agent rate limiting  
- Redis backend for distributed systems
- Sliding window algorithm
- Rate limit headers in responses
- Circuit breaker patterns
"""

import time
import logging
from typing import Dict, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import asyncio
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RateLimitType(Enum):
    """Types of rate limits"""
    USER = "user"
    AGENT = "agent"
    GLOBAL = "global"
    IP = "ip"


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting"""
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    requests_per_day: int = 10000
    burst_limit: int = 10  # Max requests in a short burst
    window_size: int = 60  # Window size in seconds
    enabled: bool = True


@dataclass
class RateLimitResult:
    """Result of a rate limit check"""
    allowed: bool
    remaining: int
    reset_time: int
    retry_after: Optional[int] = None
    limit_type: Optional[RateLimitType] = None
    limit_value: Optional[str] = None


class RateLimiter:
    """Main rate limiter class with Redis and in-memory backends"""
    
    def __init__(self, redis_client=None, fallback_to_memory=True):
        self.redis_client = redis_client
        self.fallback_to_memory = fallback_to_memory
        self.memory_store = {}  # Fallback in-memory store
        self.circuit_breakers = {}  # Circuit breaker state
        
    async def check_rate_limit(
        self, 
        limit_type: RateLimitType, 
        limit_value: str, 
        config: RateLimitConfig
    ) -> RateLimitResult:
        """Check if request is within rate limits"""
        
        if not config.enabled:
            return RateLimitResult(
                allowed=True,
                remaining=config.requests_per_minute,
                reset_time=int(time.time() + config.window_size),
                limit_type=limit_type,
                limit_value=limit_value
            )
        
        try:
            if self.redis_client:
                return await self._check_redis_rate_limit(limit_type, limit_value, config)
            else:
                return await self._check_memory_rate_limit(limit_type, limit_value, config)
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            if self.fallback_to_memory:
                return await self._check_memory_rate_limit(limit_type, limit_value, config)
            else:
                # Fail open - allow request if rate limiting fails
                return RateLimitResult(
                    allowed=True,
                    remaining=config.requests_per_minute,
                    reset_time=int(time.time() + config.window_size),
                    limit_type=limit_type,
                    limit_value=limit_value
                )
    
    async def _check_redis_rate_limit(
        self, 
        limit_type: RateLimitType, 
        limit_value: str, 
        config: RateLimitConfig
    ) -> RateLimitResult:
        """Check rate limit using Redis backend"""
        
        # Create Redis keys for different time windows
        now = int(time.time())
        minute_key = f"rate_limit:{limit_type.value}:{limit_value}:minute:{now // 60}"
        hour_key = f"rate_limit:{limit_type.value}:{limit_value}:hour:{now // 3600}"
        day_key = f"rate_limit:{limit_type.value}:{limit_value}:day:{now // 86400}"
        
        # Use Redis pipeline for atomic operations
        pipe = self.redis_client.pipeline()
        
        # Check minute limit
        pipe.incr(minute_key)
        pipe.expire(minute_key, 60)
        
        # Check hour limit
        pipe.incr(hour_key)
        pipe.expire(hour_key, 3600)
        
        # Check day limit
        pipe.incr(day_key)
        pipe.expire(day_key, 86400)
        
        results = await pipe.execute()
        
        minute_count = results[0]
        hour_count = results[2]
        day_count = results[4]
        
        # Check limits
        if (minute_count > config.requests_per_minute or 
            hour_count > config.requests_per_hour or 
            day_count > config.requests_per_day):
            
            # Calculate retry after
            retry_after = 60 if minute_count > config.requests_per_minute else None
            if not retry_after and hour_count > config.requests_per_hour:
                retry_after = 3600
            if not retry_after and day_count > config.requests_per_day:
                retry_after = 86400
            
            return RateLimitResult(
                allowed=False,
                remaining=0,
                reset_time=now + (retry_after or 60),
                retry_after=retry_after,
                limit_type=limit_type,
                limit_value=limit_value
            )
        
        # Calculate remaining requests
        remaining = min(
            config.requests_per_minute - minute_count,
            config.requests_per_hour - hour_count,
            config.requests_per_day - day_count
        )
        
        return RateLimitResult(
            allowed=True,
            remaining=max(0, remaining),
            reset_time=now + 60,  # Reset in 1 minute
            limit_type=limit_type,
            limit_value=limit_value
        )
    
    async def _check_memory_rate_limit(
        self, 
        limit_type: RateLimitType, 
        limit_value: str, 
        config: RateLimitConfig
    ) -> RateLimitResult:
        """Check rate limit using in-memory store (fallback)"""
        
        now = time.time()
        key = f"{limit_type.value}:{limit_value}"
        
        if key not in self.memory_store:
            self.memory_store[key] = []
        
        # Clean old entries
        cutoff_time = now - config.window_size
        self.memory_store[key] = [
            timestamp for timestamp in self.memory_store[key] 
            if timestamp > cutoff_time
        ]
        
        # Check if limit exceeded
        if len(self.memory_store[key]) >= config.requests_per_minute:
            return RateLimitResult(
                allowed=False,
                remaining=0,
                reset_time=int(now + config.window_size),
                retry_after=config.window_size,
                limit_type=limit_type,
                limit_value=limit_value
            )
        
        # Add current request
        self.memory_store[key].append(now)
        
        # Calculate remaining
        remaining = config.requests_per_minute - len(self.memory_store[key])
        
        return RateLimitResult(
            allowed=True,
            remaining=max(0, remaining),
            reset_time=int(now + config.window_size),
            limit_type=limit_type,
            limit_value=limit_value
        )
    
    async def get_rate_limit_status(
        self, 
        limit_type: RateLimitType, 
        limit_value: str, 
        config: RateLimitConfig
    ) -> Dict[str, Any]:
        """Get current rate limit status without consuming a request"""
        
        try:
            if self.redis_client:
                return await self._get_redis_status(limit_type, limit_value, config)
            else:
                return await self._get_memory_status(limit_type, limit_value, config)
        except Exception as e:
            logger.error(f"Rate limit status check failed: {e}")
            return {
                "error": str(e),
                "fallback": True
            }
    
    async def _get_redis_status(
        self, 
        limit_type: RateLimitType, 
        limit_value: str, 
        config: RateLimitConfig
    ) -> Dict[str, Any]:
        """Get rate limit status from Redis"""
        
        now = int(time.time())
        minute_key = f"rate_limit:{limit_type.value}:{limit_value}:minute:{now // 60}"
        hour_key = f"rate_limit:{limit_type.value}:{limit_value}:hour:{now // 3600}"
        day_key = f"rate_limit:{limit_type.value}:{limit_value}:day:{now // 86400}"
        
        pipe = self.redis_client.pipeline()
        pipe.get(minute_key)
        pipe.get(hour_key)
        pipe.get(day_key)
        
        results = await pipe.execute()
        
        minute_count = int(results[0] or 0)
        hour_count = int(results[1] or 0)
        day_count = int(results[2] or 0)
        
        return {
            "minute": {
                "count": minute_count,
                "limit": config.requests_per_minute,
                "remaining": max(0, config.requests_per_minute - minute_count)
            },
            "hour": {
                "count": hour_count,
                "limit": config.requests_per_hour,
                "remaining": max(0, config.requests_per_hour - hour_count)
            },
            "day": {
                "count": day_count,
                "limit": config.requests_per_day,
                "remaining": max(0, config.requests_per_day - day_count)
            },
            "limit_type": limit_type.value,
            "limit_value": limit_value
        }
    
    async def _get_memory_status(
        self, 
        limit_type: RateLimitType, 
        limit_value: str, 
        config: RateLimitConfig
    ) -> Dict[str, Any]:
        """Get rate limit status from memory store"""
        
        now = time.time()
        key = f"{limit_type.value}:{limit_value}"
        
        if key not in self.memory_store:
            current_count = 0
        else:
            # Clean old entries
            cutoff_time = now - config.window_size
            self.memory_store[key] = [
                timestamp for timestamp in self.memory_store[key] 
                if timestamp > cutoff_time
            ]
            current_count = len(self.memory_store[key])
        
        return {
            "minute": {
                "count": current_count,
                "limit": config.requests_per_minute,
                "remaining": max(0, config.requests_per_minute - current_count)
            },
            "limit_type": limit_type.value,
            "limit_value": limit_value
        }


class CircuitBreaker:
    """Circuit breaker for rate limiting"""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open
    
    def is_open(self) -> bool:
        """Check if circuit breaker is open"""
        if self.state == "open":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "half-open"
                return False
            return True
        return False
    
    def record_success(self):
        """Record successful request"""
        self.failure_count = 0
        self.state = "closed"
    
    def record_failure(self):
        """Record failed request"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "open"


# Global rate limiter instance
rate_limiter = RateLimiter()
