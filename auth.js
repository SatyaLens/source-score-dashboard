(function () {
    const API_ORIGIN = 'https://source-score.onrender.com';
    const API_BASE = API_ORIGIN + '/api/v1';
    const AUTH_TOKEN_URL = API_ORIGIN + '/auth/token';
    const CLIENT_ID = 'web-dashboard';
    const AUTH_CACHE_KEY = 'sourceScoreJwtToken';

    let tokenRequest = null;
    let tokenInvalidationTimer = null;

    function invalidateAuthToken(tokenToInvalidate) {
        try {
            if (tokenToInvalidate) {
                const raw = localStorage.getItem(AUTH_CACHE_KEY);
                const cached = raw ? JSON.parse(raw) : null;
                if (!cached || cached.token !== tokenToInvalidate) return;
            }
            localStorage.removeItem(AUTH_CACHE_KEY);
        } catch (err) {
            localStorage.removeItem(AUTH_CACHE_KEY);
        }
    }

    function scheduleTokenInvalidation(cached) {
        if (tokenInvalidationTimer) clearTimeout(tokenInvalidationTimer);
        if (!cached || !cached.expiresAt) return;
        const delay = Math.max(cached.expiresAt - Date.now(), 0);
        tokenInvalidationTimer = setTimeout(() => invalidateAuthToken(cached.token), delay);
    }

    function parseJwtPayload(token) {
        try {
            const payload = token.split('.')[1];
            if (!payload) return null;
            const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
            return JSON.parse(atob(padded));
        } catch (err) {
            return null;
        }
    }

    function getTokenExpiresAt(token) {
        const payload = parseJwtPayload(token);
        if (!payload || payload.ExpiresAt == null) throw new Error('Token payload missing ExpiresAt');

        const expiresAt = payload.ExpiresAt;
        if (typeof expiresAt === 'number') {
            return expiresAt > 1000000000000 ? expiresAt : expiresAt * 1000;
        }

        if (typeof expiresAt === 'string' && /^\d+$/.test(expiresAt)) {
            const numericExpiresAt = Number(expiresAt);
            return numericExpiresAt > 1000000000000 ? numericExpiresAt : numericExpiresAt * 1000;
        }

        const parsedExpiresAt = Date.parse(expiresAt);
        if (Number.isNaN(parsedExpiresAt)) throw new Error('Token ExpiresAt is invalid');
        return parsedExpiresAt;
    }

    function getCachedAuthToken() {
        try {
            const raw = localStorage.getItem(AUTH_CACHE_KEY);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            if (!cached || !cached.token || !cached.expiresAt) {
                invalidateAuthToken();
                return null;
            }
            if (Date.now() >= cached.expiresAt) {
                invalidateAuthToken(cached.token);
                return null;
            }
            scheduleTokenInvalidation(cached);
            return cached;
        } catch (err) {
            invalidateAuthToken();
            return null;
        }
    }

    function cacheAuthToken(token) {
        const expiresAt = getTokenExpiresAt(token);
        if (Date.now() >= expiresAt) throw new Error('Received expired token');
        const cached = { token, expiresAt };
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cached));
        scheduleTokenInvalidation(cached);
        return token;
    }

    async function fetchAuthToken() {
        const res = await fetch(AUTH_TOKEN_URL, {
            method: 'POST',
            headers: { 'Client-ID': CLIENT_ID }
        });
        if (!res.ok) throw new Error(`Token HTTP ${res.status}`);
        const data = await res.json();
        if (!data || !data.token) throw new Error('Token response missing token');
        return cacheAuthToken(data.token);
    }

    async function getAuthToken() {
        const cached = getCachedAuthToken();
        if (cached) return cached.token;
        if (!tokenRequest) {
            tokenRequest = fetchAuthToken().finally(() => {
                tokenRequest = null;
            });
        }
        return tokenRequest;
    }

    async function getApiHeaders() {
        const token = await getAuthToken();
        return {
            'Client-ID': CLIENT_ID,
            'Authorization': `Bearer ${token}`
        };
    }

    scheduleTokenInvalidation(getCachedAuthToken());

    window.SourceScoreAuth = {
        apiBase: API_BASE,
        getApiHeaders,
        getAuthToken,
        invalidateAuthToken
    };
})();
