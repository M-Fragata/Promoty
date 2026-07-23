export interface ShopeeCategory {
  id: number
  name: string
}

export interface NicheConfig {
  id: string
  name: string
  groupJid: string
  groupInviteLink: string
  keywords: string[]
  banwords: string[]
  limitedWords: string[]
  minDiscount: number
  maxPrice: number
  shopeeKeywordGroups: string[][]
  shopeeCategoriesGroup: ShopeeCategory[][]
  mlCategoryIds: string[]
  mlUrls: string[][]
  amazonCategoryNodes: string[]
  amazonUrls: string[][]
  riachueloUrls: string[][]
}
