export interface Dataset {
  readonly id: string
  readonly code: string
  readonly kind: string
}

export interface Group {
  readonly idx: number
  readonly id: string
  readonly displayId: string
  readonly tags?: string[]
}

export interface Word {
  readonly idx: number
  readonly id: string
  readonly displayId: string
  readonly word: string
  readonly tags?: string[]
}

export function compositeKey(groupId: string, wordId: string): string {
  return `${groupId}::${wordId}`
}
