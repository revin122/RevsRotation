// Small adapter interface also allows exercising the same SQL against real
// SQLite in tests without requiring the native React Native runtime.
export type SqlExecutor = {
  execute: (
    sql: string,
    params?: (string | number | null)[],
  ) => Promise<{
    rows: Record<string, any>[];
  }>;
};
export type SqlDatabase = SqlExecutor & {
  transaction: (work: (tx: SqlExecutor) => Promise<void>) => Promise<void>;
};

