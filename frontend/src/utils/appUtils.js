import { defaultCategoryVideos } from '../data/skills'

export const groupVideosByCategory = videos => {
  const grouped = { ...defaultCategoryVideos }
  ;(videos || []).forEach(video => {
    const category = video.category || Object.keys(grouped)[0]
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(video)
  })
  return grouped
}

export const getRankInfo = (points, rankTiers) => {
  const safePoints = Number(points) || 0
  let currentRank = rankTiers[0]

  for (const tier of rankTiers) {
    if (safePoints >= tier.min) {
      currentRank = tier
    }
  }

  const nextRank = rankTiers.find(tier => tier.min > safePoints)
  return {
    currentRank,
    nextRank,
    pointsToNext: nextRank ? nextRank.min - safePoints : 0
  }
}

export const getYouTubeVideoId = url => {
  if (!url) return ''
  const cleanUrl = url.split('?')[0]
  const [, id = ''] = cleanUrl.split('/embed/')
  return id
}

export const normalizeText = value =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
