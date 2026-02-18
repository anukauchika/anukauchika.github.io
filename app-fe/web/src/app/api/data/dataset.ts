export interface Dataset {
  readonly id: string
  readonly code: string
  readonly kind: string
}

export interface Group {
  readonly idx: number
  readonly id: number
  readonly displayId: string
  readonly tags?: string[]
}

export interface Word {
  readonly idx: number
  readonly id: number
  readonly displayId: string
  readonly word: string
  readonly tags?: string[]
}

export function compositeKey(groupId: number, wordId: number): string {
  return `${groupId}::${wordId}`
}
