# Chú thích biểu đồ hệ thống KNS

## 01-class-auth-user.puml - Class Diagram xác thực và người dùng

Biểu đồ mô tả nhóm lớp phục vụ chức năng xác thực, phân quyền và quản lý hồ sơ người dùng trong hệ thống KNS. Lớp `User` lưu thông tin tài khoản, vai trò, trạng thái, điểm tích lũy và dữ liệu hồ sơ nhúng. Các lớp `UserProfile`, `TeacherProfile`, `StudentProfile` thể hiện thông tin mở rộng theo từng loại người dùng. Nhóm controller và service cho thấy các phương thức chính dùng để đăng ký, đăng nhập, cập nhật hồ sơ và quản trị người dùng.

## 02-class-learning-core.puml - Class Diagram khóa học, bài học, bài tập

Biểu đồ thể hiện các lớp cốt lõi của phân hệ học tập, bao gồm khóa học, bài học, bài tập, bài nộp và ghi danh. `Course` là trung tâm của luồng học tập, liên kết với `Lesson`, `Assignment` và `Enrollment`. `Submission` lưu kết quả nộp bài của học viên, còn `Enrollment` lưu tiến độ, điểm và đánh giá của học viên trong từng khóa học. Các controller liên quan mô tả các hành động chính như tạo khóa học, tạo bài học, đăng ký học, nộp bài và chấm điểm.

## 03-class-forum-moderation-media.puml - Class Diagram diễn đàn, kiểm duyệt và dữ liệu phụ trợ

Biểu đồ mô tả các lớp phục vụ diễn đàn, bình luận bài học, báo cáo vi phạm, danh mục và video. `ForumPost` và `ForumComment` quản lý bài viết và bình luận trong diễn đàn chung hoặc diễn đàn theo khóa học. `LessonComment` phục vụ bình luận trực tiếp trong bài học và hỗ trợ phản hồi lồng nhau. `ModerationReport` lưu kết quả báo cáo, quyết định kiểm duyệt và độ tin cậy, giúp admin theo dõi và xử lý nội dung vi phạm.

## 04-erd-course-structure.puml - ERD cấu trúc người dùng, danh mục và khóa học

Biểu đồ ERD mô tả cấu trúc dữ liệu nền của phân hệ học tập, gồm người dùng, hồ sơ, danh mục, khóa học, bài học và bài tập. Các quan hệ trung gian như “có hồ sơ”, “giảng dạy”, “phân loại”, “bao gồm” và “giao bài” giúp thể hiện rõ ý nghĩa nghiệp vụ giữa các thực thể. Quan hệ giữa danh mục và khóa học được vẽ bằng nét đứt vì trong schema, khóa học lưu danh mục bằng chuỗi tên danh mục chứ không dùng khóa ngoại ObjectId cứng. Cách thể hiện này giúp sơ đồ gần với ERD phân tích nghiệp vụ hơn, đồng thời vẫn phản ánh đúng cấu trúc dữ liệu của dự án.

## 05-erd-learning-progress.puml - ERD ghi danh, tiến độ học và bài nộp

Biểu đồ ERD mô tả quá trình học viên tham gia khóa học, xem bài học, hoàn thành bài học và nộp bài tập. Thực thể `GHI DANH` đóng vai trò liên kết học viên với khóa học, đồng thời lưu tiến độ, điểm, đánh giá và danh sách bài học đã hoàn thành. Thực thể `BÀI NỘP` liên kết học viên với bài tập và khóa học, phục vụ việc nộp bài, tính điểm tự động và chấm điểm thủ công. Các ghi chú trong sơ đồ làm rõ ràng buộc duy nhất của ghi danh và bài nộp để tránh hiểu sai dữ liệu bị trùng.

## 06-seq-auth-login.puml - Sequence đăng nhập

Biểu đồ mô tả quá trình người dùng đăng nhập vào hệ thống KNS. Frontend nhận thông tin tài khoản và gửi yêu cầu tới API xác thực. Backend tìm người dùng trong MongoDB, kiểm tra mật khẩu và trạng thái tài khoản. Nếu hợp lệ, hệ thống sinh token, lưu thông tin phiên đăng nhập và trả về dữ liệu cần thiết để frontend đưa người dùng vào hệ thống.

## 07-seq-auth-refresh-logout.puml - Sequence làm mới token và đăng xuất

Biểu đồ mô tả hai thao tác liên quan đến phiên đăng nhập: làm mới access token và đăng xuất. Khi access token hết hạn, frontend gửi refresh token để backend đối chiếu với dữ liệu đã lưu và cấp token mới. Khi người dùng đăng xuất, backend xóa thông tin token trong database, còn frontend xóa token khỏi localStorage. Luồng này giúp duy trì phiên đăng nhập an toàn và kết thúc phiên đúng cách.

## 08-seq-student-enroll-course.puml - Sequence học viên đăng ký khóa học

Biểu đồ mô tả quá trình học viên xem danh sách khóa học và đăng ký một khóa học. Frontend lấy danh sách khóa học từ API và hiển thị cho học viên lựa chọn. Khi học viên đăng ký, backend kiểm tra khóa học, kiểm tra trạng thái ghi danh hiện có và tạo bản ghi `Enrollment` nếu hợp lệ. Kết quả được trả về frontend để cập nhật trạng thái khóa học cho học viên.

## 09-seq-student-learn-complete.puml - Sequence học viên xem và hoàn thành bài học

Biểu đồ mô tả luồng học viên mở một bài học, xem nội dung và đánh dấu hoàn thành. Frontend lấy bài học theo slug, sau đó hiển thị thông tin bài học, khóa học và danh sách bài học liên quan. Khi học viên hoàn thành bài học, backend kiểm tra bản ghi ghi danh, cập nhật danh sách bài đã hoàn thành, tiến độ học tập và điểm. Luồng này giúp hệ thống theo dõi quá trình học của từng học viên trong khóa học.

## 10-seq-student-submit-assignment.puml - Sequence học viên nộp bài tập

Biểu đồ mô tả quá trình học viên nộp bài tập dạng tự luận hoặc trắc nghiệm. Frontend gửi nội dung bài làm hoặc đáp án quiz tới API bài tập. Backend kiểm tra bài tập, quyền nộp bài của học viên và tự động tính điểm nếu bài tập là quiz. Sau đó hệ thống lưu hoặc cập nhật `Submission` theo cặp bài tập và học viên, bảo đảm mỗi học viên chỉ có một bài nộp mới nhất cho cùng một bài tập.

## 11-seq-teacher-create-course-lesson.puml - Sequence giảng viên tạo khóa học và bài học

Biểu đồ mô tả luồng giảng viên tạo mới khóa học và thêm bài học vào khóa học. Frontend gửi dữ liệu khóa học tới API, backend kiểm tra quyền giảng viên hoặc admin rồi lưu `Course` vào MongoDB. Sau khi khóa học được tạo, giảng viên có thể tiếp tục tạo bài học với tiêu đề, nội dung, video và thứ tự hiển thị. Backend kiểm tra quyền sở hữu khóa học trước khi tạo `Lesson` để bảo vệ dữ liệu giảng dạy.

## 12-seq-teacher-create-grade-assignment.puml - Sequence giảng viên tạo và chấm bài tập

Biểu đồ mô tả các bước giảng viên tạo bài tập, xem bài nộp và chấm điểm học viên. Khi tạo bài tập, backend kiểm tra quyền truy cập khóa học và lưu dữ liệu `Assignment`. Giảng viên có thể tải danh sách `Submission` của một bài tập để xem kết quả nộp bài. Sau khi nhập điểm và nhận xét, backend cập nhật điểm, phản hồi, trạng thái `graded` và thời điểm chấm bài.

## 13-seq-forum-post-comment.puml - Sequence đăng bài và bình luận diễn đàn

Biểu đồ mô tả luồng người dùng đăng bài viết và bình luận trong diễn đàn. Frontend gửi dữ liệu bài viết hoặc bình luận tới API diễn đàn. Backend kiểm tra trạng thái đăng nhập, quyền truy cập diễn đàn lớp nếu bài viết thuộc một khóa học, sau đó lưu dữ liệu vào MongoDB. Kết quả được trả về frontend để cập nhật danh sách bài viết và bình luận ngay trên giao diện.

## 14-seq-moderation-report-admin.puml - Sequence báo cáo vi phạm và admin xử lý

Biểu đồ mô tả quá trình người dùng báo cáo nội dung vi phạm và admin theo dõi báo cáo. Khi nhận báo cáo, backend có thể gọi dịch vụ AI Moderation để đánh giá nội dung và sinh quyết định đề xuất. Kết quả được lưu vào `ModerationReport` để admin xem lại trong trang quản trị. Sau khi xử lý, admin có thể xóa báo cáo hoặc tiếp tục thực hiện các thao tác quản trị nội dung khác.

## 15-seq-admin-manage-master-data.puml - Sequence admin quản lý người dùng, danh mục và video

Biểu đồ mô tả các thao tác quản trị dữ liệu nền của hệ thống. Khi admin mở trang quản trị, frontend tải dữ liệu người dùng, danh mục và video từ API. Tùy thao tác, admin có thể tạo hoặc cập nhật người dùng, thêm/xóa danh mục hoặc thêm/xóa video. Backend kiểm tra quyền admin trước khi ghi dữ liệu vào MongoDB và trả kết quả để frontend cập nhật màn hình.

## 16-act-auth-role-routing.puml - Activity đăng nhập và điều hướng theo vai trò

Biểu đồ hoạt động mô tả quy trình người dùng truy cập hệ thống, đăng nhập và được điều hướng theo vai trò. Nếu đã có token hợp lệ, hệ thống khôi phục phiên làm việc; nếu chưa có, người dùng phải đăng nhập. Sau khi xác thực thành công, hệ thống kiểm tra vai trò để cho phép truy cập khu vực phù hợp như trang quản trị, Studio giảng viên hoặc khu học tập. Luồng này giúp kiểm soát quyền truy cập ngay từ đầu phiên làm việc.

## 17-act-student-learning-flow.puml - Activity luồng học tập của học viên

Biểu đồ hoạt động mô tả hành trình chính của học viên trong hệ thống KNS. Học viên chọn khóa học, đăng ký nếu chưa tham gia, mở bài học và theo dõi nội dung học tập. Khi đủ điều kiện, học viên đánh dấu hoàn thành bài học để hệ thống cập nhật tiến độ và điểm. Nếu khóa học có bài tập, học viên tiếp tục làm bài và nộp kết quả để giảng viên hoặc hệ thống xử lý.

## 18-act-teacher-management-flow.puml - Activity luồng quản lý của giảng viên

Biểu đồ hoạt động mô tả các bước giảng viên quản lý nội dung học tập. Sau khi được xác nhận quyền truy cập, giảng viên có thể xem danh sách khóa học của mình, tạo khóa học mới, thêm bài học và tạo bài tập. Khi có bài nộp từ học viên, giảng viên mở danh sách bài nộp để nhập điểm và phản hồi. Quy trình này thể hiện vòng đời cơ bản của việc xây dựng và vận hành một khóa học.

## 19-act-admin-moderation-flow.puml - Activity luồng quản trị và kiểm duyệt

Biểu đồ hoạt động mô tả các nhóm chức năng chính của admin trong hệ thống. Admin có thể quản lý người dùng, phân quyền, thay đổi trạng thái tài khoản và xử lý dữ liệu liên quan. Ngoài ra, admin theo dõi bài viết, bình luận và báo cáo vi phạm để xóa, phạt hoặc khôi phục nội dung khi cần. Luồng này thể hiện vai trò kiểm soát dữ liệu nền và bảo đảm môi trường học tập an toàn.

## 20-erd-forum-moderation-media.puml - ERD diễn đàn, kiểm duyệt, danh mục và video

Biểu đồ ERD mô tả dữ liệu của diễn đàn, bình luận bài học, kiểm duyệt nội dung, danh mục và video. `BÀI VIẾT DIỄN ĐÀN` có thể thuộc diễn đàn chung hoặc diễn đàn của một khóa học, đồng thời có nhiều bình luận diễn đàn. `BÌNH LUẬN BÀI HỌC` liên kết trực tiếp với bài học và có thể tự tham chiếu để tạo luồng phản hồi. Các quan hệ với danh mục và báo cáo kiểm duyệt được vẽ bằng nét đứt vì đây là liên kết bằng chuỗi hoặc quan hệ đa hình, không phải khóa ngoại cứng trong schema MongoDB.
