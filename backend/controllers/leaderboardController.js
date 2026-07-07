const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const { getProfileMapByUserIds } = require('../services/userProfileService');
const { buildGlobalLeaderboardEntries } = require('../domain/globalLeaderboard');

const getGlobalLeaderboard = catchAsync(async (req, res) => {
  const users = await User.find({
    role: 'student',
    points: { $gt: 0 },
    $or: [{ status: 'active' }, { status: { $exists: false } }]
  })
    .sort({ points: -1, createdAt: 1 })
    .limit(10)
    .select('_id username profile points')
    .lean();

  const profileMap = await getProfileMapByUserIds(users.map(user => user._id));
  const leaderboard = buildGlobalLeaderboardEntries(users, profileMap);

  res.json({ leaderboard });
});

module.exports = { getGlobalLeaderboard };
