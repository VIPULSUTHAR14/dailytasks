let isRefreshing = false;
let RefreshSubscribers: ((token: string) => void)[] = [];

export async function apifetch(url: string, options: RequestInit = {}) {
    options.headers = options.headers || {};
    const response = await fetch(url, options);
    const subscriberTokenRefresh = (cb: (token: string) => void): void => {
        RefreshSubscribers.push(cb);
    }

    const onTokenRefresh = (newAccessToken: string): void => {
        RefreshSubscribers.forEach((cb) => cb(newAccessToken));
        RefreshSubscribers = [];
    }

    if (response.status === 401) {
        if (!isRefreshing) {
            isRefreshing = true;
            try {
                const RefreshResponse = await fetch('/api/token/refresh', { method: "POST" });
                if (RefreshResponse.ok) {
                    const { accessToken }: { accessToken: string } = await RefreshResponse.json();
                    isRefreshing = false;
                    onTokenRefresh(accessToken);
                    (options.headers as Record<string, string>)['Authorization'] = `bearer ${accessToken}`;
                    return fetch(url, options);
                } else {
                    isRefreshing = false;
                    window.location.href = '/Login';
                    return response;
                }

            } catch (error: unknown) {
                isRefreshing = false;
                console.log(error);
                window.location.href = '/Login'
                return response;
            }
        }
        return new Promise<Response>((resolve) => {
            subscriberTokenRefresh((token: string) => {
                (options.headers as Record<string, string>)['Authorization'] = `bearer ${token}`;
                resolve(fetch(url, options));
            })
        })
    }
    return response;
}