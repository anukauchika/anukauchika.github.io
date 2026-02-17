import type { Dataset } from './dataset'

export interface DatasetMeta extends Dataset {
  readonly name: string
  readonly appTitle: string
  readonly path: string
  readonly description: string
  readonly tags: string[]
}
