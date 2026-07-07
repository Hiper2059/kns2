const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildGlobalLeaderboardEntries } = require('../domain/globalLeaderboard');

const rootDir = path.resolve(__dirname, '../..');

test('global leaderboard uu tien displayName va giu dung diem tong', () => {
  const users = [
    { _id: 'student-1', username: 'minhanh', points: 300 },
    { _id: 'student-2', username: 'giahuy', points: 180 }
  ];
  const profileMap = {
    'student-1': { displayName: 'Nguyễn Minh Anh', avatarUrl: 'avatar-1.jpg' }
  };

  assert.deepEqual(buildGlobalLeaderboardEntries(users, profileMap), [
    {
      rank: 1,
      studentId: 'student-1',
      username: 'minhanh',
      displayName: 'Nguyễn Minh Anh',
      avatarUrl: 'avatar-1.jpg',
      points: 300
    },
    {
      rank: 2,
      studentId: 'student-2',
      username: 'giahuy',
      displayName: 'giahuy',
      avatarUrl: null,
      points: 180
    }
  ]);
});

test('backend co endpoint leaderboard rieng, khong sua endpoint theo khoa hoc', () => {
  const appSource = fs.readFileSync(path.join(rootDir, 'backend/app.js'), 'utf8');
  const routeSource = fs.readFileSync(path.join(rootDir, 'backend/routes/leaderboardRoutes.js'), 'utf8');

  assert.match(appSource, /app\.use\('\/api\/leaderboard', leaderboardRoutes\)/);
  assert.match(routeSource, /router\.get\('\/', getGlobalLeaderboard\)/);
});

test('frontend tai leaderboard tu API thay vi gan cung mang rong', () => {
  const appSource = fs.readFileSync(path.join(rootDir, 'frontend/src/App.jsx'), 'utf8');
  const homeSource = fs.readFileSync(path.join(rootDir, 'frontend/src/components/HomeView.jsx'), 'utf8');

  assert.match(appSource, /api\.get\('\/api\/leaderboard'\)/);
  assert.match(appSource, /setRankLeaderboard\(response\.data\.leaderboard \|\| \[\]\)/);
  assert.doesNotMatch(appSource, /const rankLeaderboard = useMemo\(\(\) => \{\s*return \[\]/);
  assert.match(homeSource, /entry\.displayName \|\| entry\.username/);
});
