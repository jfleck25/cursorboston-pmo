export function logServerEvent(
  scope: string,
  payload: Record<string, string | number | boolean | null | undefined>,
): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      scope,
      ...payload,
    }),
  );
}
