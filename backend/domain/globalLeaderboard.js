const buildGlobalLeaderboardEntries = (users, profileMap = {}) => {
  return (users || []).map((user, index) => {
    const profile = profileMap[String(user._id)] || user.profile || {};
    return {
      rank: index + 1,
      studentId: String(user._id),
      username: user.username,
      displayName: profile.displayName || user.username,
      avatarUrl: profile.avatarUrl || null,
      points: Number(user.points) || 0
    };
  });
};

module.exports = { buildGlobalLeaderboardEntries };
