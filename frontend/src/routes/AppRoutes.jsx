import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import PageFallback from '../components/PageFallback'

const ForumView = lazy(() => import('../components/ForumView'))
const HomeView = lazy(() => import('../components/HomeView'))
const LessonFullPage = lazy(() => import('../components/LessonFullPage'))
const LmsView = lazy(() => import('../components/LmsView'))
const ManageView = lazy(() => import('../components/ManageView'))
const ProfilePage = lazy(() => import('../components/ProfilePage'))
const TeacherView = lazy(() => import('../components/TeacherView'))
const AuthPage = lazy(() => import('../pages/AuthPage'))

const ProtectedRoute = ({ currentUser, children }) => {
  const location = useLocation()
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

const AppRoutes = ({
  allCategories,
  currentUser,
  currentRank,
  currentUserPoints,
  nextRank,
  pointsToNext,
  rankLeaderboard,
  categoryVideos,
  currentRole,
  handleDeleteVideo,
  lmsCategory,
  handleSelectLmsCategory,
  courses,
  teacherCourses,
  selectedCourse,
  handleSelectLmsCourse,
  courseLessons,
  courseAssignments,
  assignmentDrafts,
  handleAssignmentDraftChange,
  handleSubmitAssignment,
  handleSubmitQuizAssignment,
  enrollmentByCourse,
  teacherEnrollments,
  handleEnroll,
  handleOpenProfile,
  openLessonRoute,
  handleOpenCourseForum,
  fetchTeacherEnrollments,
  handleDeleteLesson,
  newPost,
  setNewPost,
  handlePostSubmit,
  paginatedForumPosts,
  commentsByPost,
  commentDrafts,
  handleCommentDraftChange,
  handleAddComment,
  handleReportContent,
  handleTogglePostReaction,
  searchTerm,
  setSearchTerm,
  forumPage,
  forumTotalPages,
  setForumPage,
  filteredForumPosts,
  forumScope,
  forumCourse,
  selectedTeacherCourseId,
  handleSelectTeacherCourse,
  newCourseData,
  setNewCourseData,
  handleCreateCourse,
  newLessonData,
  setNewLessonData,
  handleCreateLesson,
  newAssignmentData,
  onNewAssignmentDataChange,
  handleCreateAssignment,
  editAssignmentId,
  editAssignmentData,
  handleEditAssignmentStart,
  setEditAssignmentData,
  handleEditAssignmentCancel,
  handleUpdateAssignment,
  handleDeleteAssignment,
  assignmentSubmissions,
  handleLoadAssignmentSubmissions,
  handleGradeSubmission,
  editLessonId,
  editLessonData,
  handleStartEditLesson,
  setEditLessonData,
  handleCancelEditLesson,
  handleUpdateLesson,
  handleUploadCourseEditorVideo,
  handleUploadLessonEditorVideo,
  handleUploadEditLessonEditorVideo,
  isLoadingUsers,
  isLoadingReports,
  isLoadingDeletedPosts,
  isLoadingDeletedComments,
  isLoadingAnalytics,
  handleSelectCourse,
  fetchManagedUsers,
  fetchModerationReports,
  fetchDeletedPosts,
  fetchDeletedComments,
  fetchAdminForumComments,
  isLoadingForumComments,
  deletedReasonFilter,
  setDeletedReasonFilter,
  newUserData,
  setNewUserData,
  handleCreateUser,
  newVideoData,
  setNewVideoData,
  handleAddVideo,
  customCategories,
  handleAddCategory,
  handleRemoveCategory,
  managedUsers,
  handleRoleChange,
  handleStatusChange,
  handleDeleteUser,
  moderationReports,
  handleDeleteModerationReport,
  handleClearModerationReports,
  forumPosts,
  adminForumComments,
  handleAdminDeletePost,
  handlePunishForumComment,
  deletedPosts,
  handleRestorePost,
  handlePermanentDeletePost,
  deletedComments,
  handleRestoreComment,
  handlePermanentDeleteComment,
  adminAnalytics,
  adminUploadUrl,
  isAdminUploadLoading,
  handleAdminUploadVideo,
  setAdminUploadUrl,
  api,
  myProfile,
  profileDraft,
  myProfileLoading,
  profileMode,
  navigate,
  setActiveTab,
  setProfileMode,
  fetchMyProfile,
  handleSaveProfile,
  setProfileDraft,
  handleProfileAvatarChange,
  profileUser,
  profileLoading,
  handleOpenMyProfile,
  lessonRouteLesson,
  lessonRouteCourse,
  lessonRouteLessons,
  lessonRouteLoading,
  closeLessonRoute,
  handleCompleteLesson,
  canCompleteLesson,
  isLessonCompleted,
  handleLessonUpdated,
  showToast,
  confirmAction
}) => (
<Suspense fallback={<PageFallback />}>
  <Routes>
    <Route path='/login' element={<AuthPage mode="login" />} />
    <Route path='/register' element={<AuthPage mode="register" />} />
    <Route path='/*' element={
      <ProtectedRoute currentUser={currentUser}>
        <Routes>
          <Route path='/' element={
            <HomeView
              categories={allCategories}
              currentUser={currentUser}
              currentRank={currentRank}
              currentUserPoints={currentUserPoints}
              nextRank={nextRank}
              pointsToNext={pointsToNext}
              rankLeaderboard={rankLeaderboard}
              categoryVideos={categoryVideos}
              currentRole={currentRole}
              onDeleteVideo={handleDeleteVideo}
            />
          } />

          <Route path='/courses' element={
            <LmsView
              categories={allCategories}
              selectedCategory={lmsCategory}
              onSelectCategory={handleSelectLmsCategory}
              courses={courses}
              teacherCourses={teacherCourses}
              selectedCourse={selectedCourse}
              onSelectCourse={handleSelectLmsCourse}
              lessons={courseLessons}
              assignments={courseAssignments}
              newAssignmentData={newAssignmentData}
              onNewAssignmentDataChange={onNewAssignmentDataChange}
              onCreateAssignment={handleCreateAssignment}
              editAssignmentId={editAssignmentId}
              editAssignmentData={editAssignmentData}
              onEditAssignmentStart={handleEditAssignmentStart}
              onEditAssignmentChange={setEditAssignmentData}
              onEditAssignmentCancel={handleEditAssignmentCancel}
              onUpdateAssignment={handleUpdateAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              assignmentDrafts={assignmentDrafts}
              onAssignmentDraftChange={handleAssignmentDraftChange}
              onSubmitAssignment={handleSubmitAssignment}
              onSubmitQuizAssignment={handleSubmitQuizAssignment}
              enrollmentByCourse={enrollmentByCourse}
              teacherEnrollments={teacherEnrollments}
              onEnroll={handleEnroll}
              currentRole={currentRole}
              currentUser={currentUser}
              onOpenProfile={handleOpenProfile}
              onOpenLesson={openLessonRoute}
              onOpenCourseForum={handleOpenCourseForum}
              onLoadEnrollments={fetchTeacherEnrollments}
              onDeleteLesson={handleDeleteLesson}
              showToast={showToast}
            />
          } />

          <Route path='/courses/:courseId' element={
            <LmsView
              categories={allCategories}
              selectedCategory={lmsCategory}
              onSelectCategory={handleSelectLmsCategory}
              courses={courses}
              teacherCourses={teacherCourses}
              selectedCourse={selectedCourse}
              onSelectCourse={handleSelectLmsCourse}
              lessons={courseLessons}
              assignments={courseAssignments}
              newAssignmentData={newAssignmentData}
              onNewAssignmentDataChange={onNewAssignmentDataChange}
              onCreateAssignment={handleCreateAssignment}
              editAssignmentId={editAssignmentId}
              editAssignmentData={editAssignmentData}
              onEditAssignmentStart={handleEditAssignmentStart}
              onEditAssignmentChange={setEditAssignmentData}
              onEditAssignmentCancel={handleEditAssignmentCancel}
              onUpdateAssignment={handleUpdateAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              assignmentDrafts={assignmentDrafts}
              onAssignmentDraftChange={handleAssignmentDraftChange}
              onSubmitAssignment={handleSubmitAssignment}
              onSubmitQuizAssignment={handleSubmitQuizAssignment}
              enrollmentByCourse={enrollmentByCourse}
              teacherEnrollments={teacherEnrollments}
              onEnroll={handleEnroll}
              currentRole={currentRole}
              currentUser={currentUser}
              onOpenProfile={handleOpenProfile}
              onOpenLesson={openLessonRoute}
              onOpenCourseForum={handleOpenCourseForum}
              onLoadEnrollments={fetchTeacherEnrollments}
              onDeleteLesson={handleDeleteLesson}
              showToast={showToast}
            />
          } />

          <Route path='/forum' element={
            <ForumView
              newPost={newPost}
              onNewPostChange={setNewPost}
              categories={allCategories}
              onPostSubmit={handlePostSubmit}
              paginatedForumPosts={paginatedForumPosts}
              commentsByPost={commentsByPost}
              commentDrafts={commentDrafts}
              onCommentDraftChange={handleCommentDraftChange}
              onAddComment={handleAddComment}
              onReportContent={handleReportContent}
              onTogglePostReaction={handleTogglePostReaction}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              forumPage={forumPage}
              forumTotalPages={forumTotalPages}
              onPageChange={setForumPage}
              filteredForumPosts={filteredForumPosts}
              forumScope={forumScope}
              forumCourse={forumCourse}
            />
          } />

          <Route path='/teacher' element={
            currentRole === 'teacher' ? (
              <TeacherView
                categories={allCategories}
                courses={teacherCourses}
                lessons={courseLessons}
                selectedCourseId={selectedTeacherCourseId}
                onSelectCourseId={handleSelectTeacherCourse}
                newCourseData={newCourseData}
                onNewCourseDataChange={setNewCourseData}
                onCreateCourse={handleCreateCourse}
                newLessonData={newLessonData}
                onNewLessonDataChange={setNewLessonData}
                onCreateLesson={handleCreateLesson}
                assignments={courseAssignments}
                newAssignmentData={newAssignmentData}
                onNewAssignmentDataChange={onNewAssignmentDataChange}
                onCreateAssignment={handleCreateAssignment}
                editAssignmentId={editAssignmentId}
                editAssignmentData={editAssignmentData}
                onEditAssignmentStart={handleEditAssignmentStart}
                onEditAssignmentChange={setEditAssignmentData}
                onEditAssignmentCancel={handleEditAssignmentCancel}
                onUpdateAssignment={handleUpdateAssignment}
                onDeleteAssignment={handleDeleteAssignment}
                assignmentSubmissions={assignmentSubmissions}
                onLoadAssignmentSubmissions={handleLoadAssignmentSubmissions}
                onGradeSubmission={handleGradeSubmission}
                editLessonId={editLessonId}
                editLessonData={editLessonData}
                onEditLessonStart={handleStartEditLesson}
                onEditLessonChange={setEditLessonData}
                onEditLessonCancel={handleCancelEditLesson}
                onUpdateLesson={handleUpdateLesson}
                onDeleteLesson={handleDeleteLesson}
                onUploadCourseEditorVideo={handleUploadCourseEditorVideo}
                onUploadLessonEditorVideo={handleUploadLessonEditorVideo}
                onUploadEditLessonEditorVideo={handleUploadEditLessonEditorVideo}
              />
            ) : (
              <div className="empty-state">Chỉ tài khoản giảng viên mới truy cập được Studio giảng viên.</div>
            )
          } />

          <Route path='/admin' element={
            currentRole === 'admin' ? (
              <ManageView
                isLoadingUsers={isLoadingUsers}
                isLoadingReports={isLoadingReports}
                isLoadingDeletedPosts={isLoadingDeletedPosts}
                isLoadingDeletedComments={isLoadingDeletedComments}
                isLoadingAnalytics={isLoadingAnalytics}
                courses={courses}
                selectedCourse={selectedCourse}
                onSelectCourse={handleSelectCourse}
                courseLessons={courseLessons}
                onOpenLesson={openLessonRoute}
                onDeleteLesson={handleDeleteLesson}
                onFetchUsers={fetchManagedUsers}
                onFetchReports={fetchModerationReports}
                onFetchDeletedPosts={fetchDeletedPosts}
                onFetchDeletedComments={fetchDeletedComments}
                onFetchForumComments={fetchAdminForumComments}
                isLoadingForumComments={isLoadingForumComments}
                deletedReasonFilter={deletedReasonFilter}
                onReasonChange={setDeletedReasonFilter}
                newUserData={newUserData}
                onNewUserDataChange={setNewUserData}
                onCreateUser={handleCreateUser}
                newVideoData={newVideoData}
                onVideoDataChange={setNewVideoData}
                onAddVideo={handleAddVideo}
                categories={allCategories}
                customCategories={customCategories}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
                managedUsers={managedUsers}
                currentUser={currentUser}
                onRoleChange={handleRoleChange}
                onStatusChange={handleStatusChange}
                onDeleteUser={handleDeleteUser}
                moderationReports={moderationReports}
                onDeleteModerationReport={handleDeleteModerationReport}
                onClearModerationReports={handleClearModerationReports}
                forumPosts={forumPosts}
                forumComments={adminForumComments}
                onAdminDeletePost={handleAdminDeletePost}
                onPunishForumComment={handlePunishForumComment}
                deletedPosts={deletedPosts}
                onRestorePost={handleRestorePost}
                onPermanentDeletePost={handlePermanentDeletePost}
                deletedComments={deletedComments}
                onRestoreComment={handleRestoreComment}
                onPermanentDeleteComment={handlePermanentDeleteComment}
                analytics={adminAnalytics}
                adminUploadUrl={adminUploadUrl}
                isAdminUploadLoading={isAdminUploadLoading}
                onAdminUploadVideo={handleAdminUploadVideo}
                onClearAdminUploadUrl={() => setAdminUploadUrl('')}
                onOpenProfile={handleOpenProfile}
                api={api}
                showToast={showToast}
                confirmAction={confirmAction}
              />
            ) : (
              <div className="empty-state">Cậu cần đăng nhập bằng tài khoản admin để vào trang /admin.</div>
            )
          } />

          <Route path='/profile' element={
            <ProfilePage
              profileUser={myProfile}
              profileDraft={profileDraft}
              isLoading={myProfileLoading}
              mode={profileMode}
              currentUser={currentUser}
              isOwnProfile
              onClose={() => {
                navigate('/')
                setActiveTab('home')
              }}
              onEdit={() => {
                setProfileMode('edit')
                fetchMyProfile()
              }}
              onSave={handleSaveProfile}
              onChange={setProfileDraft}
              onAvatarChange={handleProfileAvatarChange}
            />
          } />

          <Route path='/profile/:userId' element={
            <ProfilePage
              profileUser={profileUser}
              profileDraft={profileUser?.profile || {}}
              isLoading={profileLoading}
              mode="view"
              currentUser={currentUser}
              isOwnProfile={profileUser?.username === currentUser}
              onClose={() => {
                navigate(-1)
              }}
              onEdit={handleOpenMyProfile}
              onSave={handleSaveProfile}
              onChange={setProfileDraft}
              onAvatarChange={handleProfileAvatarChange}
            />
          } />

          <Route path='/lesson/:slug' element={
            <LessonFullPage
              lesson={lessonRouteLesson}
              course={lessonRouteCourse}
              lessons={lessonRouteLessons}
              courses={courses}
              isLoading={lessonRouteLoading}
              onClose={closeLessonRoute}
              onOpenLesson={openLessonRoute}
              onSelectCourse={handleSelectLmsCourse}
              onCompleteLesson={handleCompleteLesson}
              canComplete={canCompleteLesson}
              isCompleted={isLessonCompleted}
              onLessonUpdated={handleLessonUpdated}
              api={api}
              currentUser={currentUser}
              currentRole={currentRole}
              onReportContent={handleReportContent}
              showToast={showToast}
              confirmAction={confirmAction}
            />
          } />
        </Routes>
      </ProtectedRoute>
    } />
  </Routes>
</Suspense>
)

export default AppRoutes

