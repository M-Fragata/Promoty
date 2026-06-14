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
  mlCategoryIds: string[]
  amazonCategoryNodes: string[]
}
