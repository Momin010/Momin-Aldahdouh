
export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred' }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
