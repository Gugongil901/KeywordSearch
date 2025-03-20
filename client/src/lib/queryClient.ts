import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Replit 환경에서의 API 호출을 위한 기본 URL 설정
const getBaseUrl = () => {
  // Replit 환경에서는 상대 경로 사용
  // 개발 환경에서는 절대 경로 사용하도록 설정
  return window.location.origin;
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // URL이 절대 경로인지 확인
  const fullUrl = url.startsWith('http') 
    ? url 
    : `${getBaseUrl()}${url}`;
  
  console.log(`API 요청: ${method} ${fullUrl}`);
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // queryKey가 상대 경로인 경우 기본 URL 추가
    const url = (queryKey[0] as string).startsWith('http')
      ? queryKey[0] as string
      : `${getBaseUrl()}${queryKey[0]}`;
    
    console.log(`API 쿼리 요청: ${url}`);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
