export interface DatasetRepo {
  load(path: string, kind: string): Record<string, unknown> | null
}
