export const api = {
  get: async (endpoint: string, options: RequestInit = {}) => {
    return request(endpoint, { ...options, method: 'GET' });
  },
  post: async (endpoint: string, body?: any, options: RequestInit = {}) => {
    return request(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  put: async (endpoint: string, body?: any, options: RequestInit = {}) => {
    return request(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  delete: async (endpoint: string, options: RequestInit = {}) => {
    return request(endpoint, { ...options, method: 'DELETE' });
  },
  // Use this when you need to send FormData (e.g. file uploads)
  postForm: async (endpoint: string, formData: FormData, options: RequestInit = {}) => {
    return request(endpoint, {
      ...options,
      method: 'POST',
      // Do NOT set Content-Type header manually for FormData, browser sets it with appropriate boundary
      body: formData,
    });
  }
};

async function request(endpoint: string, options: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('okrgo_token') : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  // Ensure endpoint format is clean. It could be an absolute path starting with '/'
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}
