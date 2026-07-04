// Drives the printable-worksheet SEO landing pages from data/registry.json —
// any chinese dataset with `seo.worksheets: true` gets its own collection + group
// pages automatically (see [worksheetSlug]/+page.ts and [worksheetSlug]/[group]/+page.ts).
import registry from '@data/registry.json'
import { formatGroup } from '@std/format'

interface DatasetSeoConfig {
  worksheets?: boolean
  slug?: string
  label?: string
  related?: string[]
}

interface DatasetMeta {
  id: string
  name: string
  path: string
  description: string
  kind: string
  seo?: DatasetSeoConfig
}

interface RawWord {
  id: number
  word: string
  pinyin: string
  english: string
  tags?: string[]
}

interface RawGroup {
  group: number
  tags?: string[]
  items: RawWord[]
}

interface RawDataset {
  groups: RawGroup[]
}

export interface WorksheetWord extends RawWord {
  idx: number
  displayId: string
  tr: string
}

export interface WorksheetGroup {
  group: number
  idx: number
  id: number
  displayId: string
  tags?: string[]
  items: WorksheetWord[]
}

export interface RelatedWorksheetDataset {
  id: string
  slug: string
  name: string
  description: string
}

export interface WorksheetDataset {
  id: string
  slug: string
  name: string
  description: string
  groups: WorksheetGroup[]
  related: RelatedWorksheetDataset[]
}

// --- JSON loading (mirrors src/5_low/dataset.ts) ---

const dataModules = import.meta.glob('@data/chinese/*.json', { eager: true, import: 'default' }) as Record<
  string,
  unknown
>

const dataByPath: Record<string, unknown> = {}
for (const [key, value] of Object.entries(dataModules)) {
  const normalizedPath = key.replace(/^(\.\.\/|\.\/|\/)+/, '')
  dataByPath[normalizedPath] = value
}

const metas = registry as DatasetMeta[]

function buildGroups(raw: RawDataset): WorksheetGroup[] {
  return raw.groups.map((group) => ({
    ...group,
    idx: group.group,
    id: group.group,
    displayId: formatGroup(group.group),
    items: group.items.map((item) => ({
      ...item,
      idx: item.id,
      displayId: String(item.id),
      tr: item.english,
    })),
  }))
}

// Related datasets link to other printable worksheet collections, so only
// datasets with published worksheet pages are shown here.
function resolveRelated(ids: string[] = []): RelatedWorksheetDataset[] {
  return ids
    .map((id) => metas.find((m) => m.id === id))
    .filter((m): m is DatasetMeta => Boolean(m?.seo?.worksheets && m.seo.slug))
    .map((m) => ({ id: m.id, slug: m.seo!.slug!, name: m.seo?.label ?? m.name, description: m.description }))
}

export const worksheetDatasets: WorksheetDataset[] = metas
  .filter((m) => m.kind === 'chinese' && m.seo?.worksheets && m.seo.slug)
  .map((m) => ({
    id: m.id,
    slug: m.seo!.slug!,
    name: m.seo!.label ?? m.name,
    description: m.description,
    groups: buildGroups(dataByPath[m.path] as RawDataset),
    related: resolveRelated(m.seo?.related),
  }))

export function getWorksheetDataset(slug: string): WorksheetDataset | undefined {
  return worksheetDatasets.find((d) => d.slug === slug)
}

export function getWorksheetGroup(slug: string, groupNumber: number): WorksheetGroup | undefined {
  return getWorksheetDataset(slug)?.groups.find((g) => g.group === groupNumber)
}

export function getWorksheetGroupUrl(dataset: Pick<WorksheetDataset, 'slug'>, groupNumber: number): string {
  return `/chinese/${dataset.slug}/group-${groupNumber}/`
}

export function getWorksheetDatasetUrl(dataset: Pick<WorksheetDataset, 'slug'>): string {
  return `/chinese/${dataset.slug}/`
}

export function getWorksheetGroupDrillUrl(
  dataset: Pick<WorksheetDataset, 'slug' | 'id'>,
  groupNumber: number,
  mode: 'hanzi' | 'pinyin' = 'hanzi',
): string {
  return `/chinese/drill/${mode}/?dataset=${dataset.id}&group=${groupNumber}&from=${dataset.slug}`
}

export function getChineseAppUrl(dataset: Pick<WorksheetDataset, 'id'>): string {
  return `/chinese/?dataset=${dataset.id}`
}

export function getWordGroupId(dataset: Pick<WorksheetDataset, 'id'>, groupNumber: number): string {
  return `${dataset.id}:group-${groupNumber}`
}
