const isValidYouTubeUrl = value => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  const patterns = [
    /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{6,}$/,
    /^https:\/\/youtu\.be\/[A-Za-z0-9_-]{6,}$/,
    /^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]{6,}$/
  ];

  return patterns.some(pattern => pattern.test(trimmed));
};

const toEmbedUrl = inputUrl => {
  const trimmed = inputUrl.trim();
  if (trimmed.includes('/embed/')) {
    return trimmed;
  }

  if (trimmed.includes('youtu.be/')) {
    const videoId = trimmed.split('youtu.be/')[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  const url = new URL(trimmed);
  const videoId = url.searchParams.get('v');
  return `https://www.youtube.com/embed/${videoId}`;
};

module.exports = { isValidYouTubeUrl, toEmbedUrl };
