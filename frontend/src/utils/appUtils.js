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

export const normalizeClientRole = role => {
  if (!role) {
    return 'student'
  }
  return role === 'user' ? 'student' : role
}
