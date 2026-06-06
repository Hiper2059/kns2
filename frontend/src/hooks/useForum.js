import { useState, useCallback } from 'react';

export const useForum = (api) => {
  const [forumPosts, setForumPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Võ thuật' });
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [forumScope, setForumScope] = useState('general');
  const [forumCourseId, setForumCourseId] = useState('');
  const [forumCourse, setForumCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [forumPage, setForumPage] = useState(1);
  const [pointsByUser, setPointsByUser] = useState(() => {
    const savedPoints = localStorage.getItem('zmate_points_by_user');
    return savedPoints ? JSON.parse(savedPoints) : {};
  });

  const fetchPointsForUsers = useCallback(async (userIds) => {
    try {
      const query = userIds.map(id => `userIds=${encodeURIComponent(id)}`).join('&');
      const res = await api.get(`/api/analytics/points-batch?${query}`);
      if (res.data) {
        setPointsByUser(prev => {
            const newPoints = { ...prev, ...res.data };
            localStorage.setItem('zmate_points_by_user', JSON.stringify(newPoints));
            return newPoints;
        });
      }
    } catch (err) {
      console.error('Error fetching batch points:', err);
    }
  }, [api]);

  const fetchForumPosts = useCallback(async (scope = 'general', courseId = '') => {
    try {
      let url = '/api/forum';
      const params = new URLSearchParams();
      if (scope === 'course') {
        params.append('scope', 'course');
        if (courseId) params.append('courseId', courseId);
      } else {
        params.append('scope', 'general');
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await api.get(url);
      setForumPosts(res.data || []);

      const userIds = [...new Set((res.data || []).map(p => p.author))];
      if (userIds.length > 0) {
          fetchPointsForUsers(userIds);
      }
    } catch (err) {
      console.error('Error fetching forum posts:', err);
    }
  }, [api, fetchPointsForUsers]);

  return {
    forumPosts, setForumPosts,
    newPost, setNewPost,
    commentsByPost, setCommentsByPost,
    commentDrafts, setCommentDrafts,
    forumScope, setForumScope,
    forumCourseId, setForumCourseId,
    forumCourse, setForumCourse,
    searchTerm, setSearchTerm,
    forumPage, setForumPage,
    pointsByUser,
    fetchForumPosts,
    fetchPointsForUsers
  };
};
