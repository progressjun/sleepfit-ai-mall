export interface ApiResult<T> {
  data: T;
  source: "mock" | "success";
}

export async function postJson<T>(url: string, payload: unknown): Promise<ApiResult<T>> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? "요청 처리 중 오류가 발생했습니다.");
  }

  return (await response.json()) as ApiResult<T>;
}
