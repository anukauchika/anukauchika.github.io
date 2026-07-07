import { trackEvent } from './analytics'

// Landing-page analytics intentionally track product paths, not every available
// detail. Each landing surface has one core conversion event and one auxiliary
// event for all secondary paths; use small `target` values to compare choices.
//
// Current taxonomy:
// - root_land_viewed
// - root_land_core_clicked: target = app_main
// - root_land_auxi_clicked: target = printables | practice_app | hsk_words | blog | signin
// - print_land_viewed: collection = hsk_elementary | hsk_intermediate | hsk_advanced
// - print_land_core_clicked: target = print_worksheet, collection = ...
// - print_land_auxi_clicked: target = practice_drill | practice_app | method | group | related_collection | root, collection = ...
//
// Do not add source/UTM/page-url params here by default. GA4 acquisition reports
// should answer traffic-source questions; these events answer path preference.

export type RootLandCoreTarget = 'app_main'
export type RootLandAuxiTarget = 'printables' | 'practice_app' | 'hsk_words' | 'blog' | 'signin'

export type PrintLandCollection = 'hsk_elementary' | 'hsk_intermediate' | 'hsk_advanced'
export type PrintLandCoreTarget = 'print_worksheet'
export type PrintLandAuxiTarget = 'practice_drill' | 'practice_app' | 'method' | 'group' | 'related_collection' | 'root'

const PRINT_COLLECTION_BY_DATASET: Record<string, PrintLandCollection> = {
  'chinese-hskv3-elementary': 'hsk_elementary',
  'chinese-hskv3-intermediate': 'hsk_intermediate',
  'chinese-hskv3-advanced': 'hsk_advanced',
}

function printCollection(datasetId: string): PrintLandCollection | undefined {
  return PRINT_COLLECTION_BY_DATASET[datasetId]
}

function printParams(datasetId: string): { collection?: PrintLandCollection } {
  const collection = printCollection(datasetId)
  return collection ? { collection } : {}
}

export function trackRootLandViewed(): void {
  trackEvent('root_land_viewed')
}

export function trackRootLandCoreClicked(target: RootLandCoreTarget): void {
  trackEvent('root_land_core_clicked', { target })
}

export function trackRootLandAuxiClicked(target: RootLandAuxiTarget): void {
  trackEvent('root_land_auxi_clicked', { target })
}

export function trackPrintLandViewed(datasetId: string): void {
  trackEvent('print_land_viewed', printParams(datasetId))
}

export function trackPrintLandCoreClicked(target: PrintLandCoreTarget, datasetId: string): void {
  trackEvent('print_land_core_clicked', {
    target,
    ...printParams(datasetId),
  })
}

export function trackPrintLandAuxiClicked(target: PrintLandAuxiTarget, datasetId: string): void {
  trackEvent('print_land_auxi_clicked', {
    target,
    ...printParams(datasetId),
  })
}
