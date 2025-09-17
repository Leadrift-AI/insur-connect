export async function fetchWithId(input: RequestInfo, init: RequestInit = {}) {
  const id = crypto.randomUUID();
  const headers = new Headers(init.headers || {});
  headers.set('x-request-id', id);

  console.log(`[Request] ${id}: ${typeof input === 'string' ? input : input.url}`);

  const startTime = Date.now();

  try {
    const response = await fetch(input, { ...init, headers });
    const latency = Date.now() - startTime;

    console.log(`[Response] ${id}: ${response.status} (${latency}ms)`);

    return response;
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`[Error] ${id}: ${error} (${latency}ms)`);
    throw error;
  }
}