Ứng dụng webapp quản trị OKR

Có các trang sau:
1. Trang chủ giới thiệu
Mục đích: Giới thiệu tổng quan về hệ thống OKR, tính năng, lợi ích; thu hút người dùng đăng nhập/đăng ký.

Dữ liệu hiển thị:

Logo, tên ứng dụng, slogan.

Hero section: hình ảnh/video minh họa, nút CTA “Dùng thử miễn phí” / “Đăng nhập”.

Các tính năng chính (dạng card hoặc grid): Quản lý mục tiêu, Theo dõi tiến độ, Khen thưởng, Báo cáo, v.v.

Hình ảnh dashboard mẫu hoặc mockup.

Lợi ích cho doanh nghiệp (tăng năng suất, minh bạch…).

Footer: liên hệ, chính sách, bản quyền.

Thành phần: Header (logo, menu Đăng nhập/Đăng ký), nội dung dạng landing page, footer.

Hành động: Điều hướng đến trang Đăng nhập/Đăng ký, có thể scroll đến các phần.


2. Đăng ký/Đăng nhập
Mục đích: Xác thực người dùng; hỗ trợ tạo tài khoản mới.

Dữ liệu hiển thị:

Tab Đăng nhập: Form gồm Email, Mật khẩu, checkbox “Ghi nhớ đăng nhập”, link “Quên mật khẩu”.

Tab Đăng ký: Form gồm Họ tên, Email, Số điện thoại, Mật khẩu, Xác nhận mật khẩu, nút “Đăng ký”.

Thông báo lỗi (sai email/mật khẩu, email đã tồn tại, mật khẩu không khớp).

Hành động: Gửi thông tin xác thực, xử lý đăng nhập/đăng ký, chuyển hướng đến Dashboard (trang 12) sau khi thành công. Link “Quên mật khẩu” sang trang 3.


3. Quên mật khẩu
Mục đích: Gửi email đặt lại mật khẩu khi người dùng quên.

Dữ liệu hiển thị:

Hướng dẫn: “Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu”.

Ô nhập Email.

Nút “Gửi yêu cầu”.

Thông báo thành công (kiểm tra email) hoặc lỗi (email không tồn tại).

Link quay lại trang Đăng nhập.

Hành động: Validate email, gửi request đến server, gửi email chứa token reset. Chuyển hướng về trang thông báo hoặc giữ nguyên.


4. Đặt lại mật khẩu
Mục đích: Cho phép người dùng tạo mật khẩu mới sau khi nhận link hợp lệ.

Dữ liệu hiển thị:

Mật khẩu mới (có hiển thị độ mạnh).

Xác nhận mật khẩu mới.

Nút “Đặt lại mật khẩu”.

Thông báo lỗi (mật khẩu không khớp, yếu, token hết hạn).

Link đến trang Đăng nhập sau khi thành công.

Hành động: Kiểm tra token từ URL, xác nhận hợp lệ, cập nhật mật khẩu mới. Chuyển hướng sang Đăng nhập.


5. Thông tin cá nhân
Mục đích: Xem và cập nhật thông tin của người dùng hiện tại.

Dữ liệu hiển thị:

Avatar (có thể upload/đổi).

Họ tên, email, số điện thoại, phòng ban.

Vị trí, cấp trên (người cấp trên quản lý trực tiếp).

Ngày sinh, địa chỉ.

Thông tin bổ sung: số sao hiện có (liên kết trang quản lý sao), tổng số Kudo nhận được.

Nút “Lưu thay đổi”, “Đổi mật khẩu”.

Hành động: Upload avatar, cập nhật thông tin, đổi mật khẩu (mở modal).


6. Phòng ban
Mục đích: Quản lý danh sách phòng ban trong công ty (chỉ dành cho Admin/Manager).

Dữ liệu hiển thị:

Danh sách phòng ban dạng bảng: Tên phòng ban, Số lượng nhân sự, Hành động (sửa, xóa).

Nút “Thêm phòng ban” (mở modal/form).

Thanh tìm kiếm, lọc theo trạng thái (hoạt động/ngừng).

Phân trang.

Hành động: Thêm mới, sửa, xóa (cảnh báo), xem nhân sự trong phòng (chuyển sang trang Nhân sự có filter).


7. Nhân sự
Mục đích: Quản lý danh sách nhân viên, phân công phòng ban.

Dữ liệu hiển thị:

Bảng nhân sự: Avatar + Họ tên, Vị trí, Phòng ban, Email, Số điện thoại, Trạng thái, Hành động, Quyền.

Có phân trang.

Thanh tìm kiếm (theo tên, email, mã), lọc theo phòng ban, trạng thái.

Nút “Thêm nhân sự” (form: nhập đầy đủ thông tin, gửi email mời).

Import/Export Excel.

Trên mỗi dòng: “Xóa”.

Hành động: CRUD nhân sự, gửi email thông báo, đồng bộ với phòng ban.


8. Quản lý chu kì OKRs
Mục đích: Tạo và quản lý các chu kỳ OKR (theo quý, năm, tháng).

Dữ liệu hiển thị:

Danh sách chu kỳ: Tên chu kỳ (Q1-2025, Năm 2025...), Ngày bắt đầu – Ngày kết thúc, Hành động (sửa, xóa).

Nút “Tạo chu kỳ mới” (form: tên, ngày).

Hành động: Tạo, sửa, xóa.

9. Quản lý sao
Danh sách Tiêu chí ghi nhận (sử dụng trong Kudo box)
Bảng list các tiêu chí, nội dung: STT,	Tiêu chí,	Sử dụng cho, Số sao,	Hành động
Sử dụng cho có các mục:
Văn hóa
Mục tiêu
Dự án
Công việc

Có nút thêm tiêu chí, click mở form tạo.
Hành động có sửa, xóa


10. Kho quà tặng
Mục đích: Quản lý danh sách quà có thể đổi bằng sao (dành cho Admin).

Dữ liệu hiển thị: sẽ có 2 mục là Quản lý đổi quà và Quản lý danh sách quà tặng.

Danh sách đổi quà (phân trang, tìm kiếm, lọc theo thời gian, trạng thái):
Người đổi quà	Tên quà	Số lượng	Thời gian	Trạng thái
Xử lý và cập nhật trạng thái cho lượt đổi quà này.


Bảng Danh sách quà tặng: Ảnh, Tên quà, Mô tả, Giá sao, Hành động (sửa, xóa).

Nút “Thêm quà” (upload ảnh, nhập thông tin).

Tìm kiếm.

Hành động: CRUD quà.




11. Trang tổng quan, báo cáo
Mục đích: Hiển thị tổng quan tiến độ OKR toàn công ty, các chỉ số.

Dữ liệu hiển thị:

Tiến độ hoàn thành mục tiêu: Biểu đồ thanh ngang (thanh ngang chia làm 3 màu, độ dài thể hiện % của màu đó) thể hiện tiến độ hoàn thành mục tiêu:
0-40% : Đỏ
40-70% : Vàng
70-100% : Xanh

Tình trạng Check-in: Thanh ngang 2 màu thể hiện % check-in đúng hạn và % check-in sai hạn.

Biểu đồ phản hồi, ghi nhận xem mọi người trong công ty có giao tiếp với nhau liên tục, thường xuyên hay không, để tăng tính kết nối giữa mọi người và các phòng ban.

Đánh giá công ty/phòng ban: Biểu đồ thanh ngang các màu màu thể hiện % đánh giá công ty/phòng ban:
Tự tin:
Không tự tin
Thiếu tự tin
Tự tin
Rất tự tin

Tốc độ:
Rất chậm
Chậm
Nhanh
Rất nhanh

Nỗ lực:
Không nỗ lực
Thiếu nỗ lực
Có nỗ lực
Rất nỗ lực

Hiệu suất:
Kém
Chưa tốt
Tốt
Rất tốt

13. Trang OKRs
Mục đích: Quản lý toàn bộ hệ thống OKR theo cấu trúc phân cấp: Objective (Mục tiêu) và các Key Results (Kết quả then chốt) bên dưới. Cho phép xem, tạo, sửa, xóa cả Objective và Key Results trên cùng một giao diện.

Dữ liệu hiển thị & Bố cục
A. Thanh bộ lọc & tác vụ chung (đầu trang)

Bộ lọc: Theo chu kỳ OKR (dropdown), theo cấp độ (Công ty / Phòng ban / Cá nhân), theo phòng ban, theo chủ sở hữu.

Ô tìm kiếm (tìm theo tên Objective hoặc Key Result).

Nút "Tạo Objective mới" (mở form nhập Objective).

Nút "Xuất danh sách OKRs" (Excel/PDF).

B. Danh sách Objectives dạng thẻ hoặc bảng mở rộng (accordion)
Mỗi Objective được hiển thị như một khối, bên trong chứa danh sách Key Results.

Thông tin của mỗi Objective:

Tên Objective (có icon đại diện theo cấp độ: 🏢 Công ty, 🧑‍🤝‍🧑 Phòng ban, 👤 Cá nhân)

Mô tả ngắn (tooltip hoặc hiển thị dòng)

Chủ sở hữu (avatar + tên, phòng ban)

Chu kỳ (Q1-2025...)

Tiến độ tổng hợp (thanh progress, tính trung bình từ các KR)

Trạng thái: 🟢 Đang thực hiện / 🔴 Trễ / ✅ Hoàn thành

Ngày bắt đầu – kết thúc

Nút hành động trên Objective: ✏️ Sửa, 🗑️ Xóa, ➕ Thêm Key Result, 📋 Sao chép

Danh sách Key Results bên dưới mỗi Objective (dạng bảng nhỏ hoặc card ngang):
Mỗi KR hiển thị:

Tên Key Result

Đơn vị đo lường (%, số tiền, số lượng…)

Giá trị khởi tạo → Giá trị hiện tại → Giá trị mục tiêu

Tiến độ % (thanh progress nhỏ, màu sắc theo mức: xanh >70%, vàng 30-70%, đỏ <30%)

Lần cập nhật gần nhất (ngày check-in)

Nút hành động trên KR: ✏️ Sửa, 🗑️ Xóa, 📝 Check-in (mở modal)

C. Modal "Check-in" khi nhấn vào nút Check-in của một KR

Hiển thị tên KR, giá trị hiện tại, mục tiêu.

Ô nhập giá trị mới (kiểm tra kiểu số, có thể hiển thị thanh kéo).

Ô nhập comment (bắt buộc hoặc không tùy cấu hình).

Nút "Lưu check-in" → cập nhật giá trị hiện tại, lưu lịch sử, tính lại tiến độ.

D. Form tạo/sửa Objective (modal)

Tên Objective (bắt buộc)

Mô tả

Cấp độ (Công ty / Phòng ban / Cá nhân) – chỉ Admin mới chọn được Công ty

Chủ sở hữu (chọn từ danh sách nhân sự, tự động fill phòng ban)

Chu kỳ (chọn từ danh sách chu kỳ đã tạo ở trang 8)

Ngày bắt đầu / kết thúc (mặc định theo chu kỳ)

Có thể thêm Key Results ngay (dạng danh sách động: tên KR, đơn vị, giá trị khởi tạo, mục tiêu) – hoặc để trống thêm sau.

E. Form tạo/sửa Key Result (modal, mở từ nút "Thêm KR" hoặc "Sửa KR")

Tên KR (bắt buộc)

Đơn vị đo lường (dropdown hoặc nhập tay: %, VND, số lượng, điểm NPS...)

Giá trị khởi tạo (số)

Giá trị mục tiêu (số)

(Tùy chọn) Người chịu trách nhiệm (mặc định là chủ sở hữu Objective)

Deadline riêng (có thể khác với deadline của Objective)

Quyền hạn & Ràng buộc
User: Chỉ xem/sửa/xóa OKRs của bản thân (cấp độ Cá nhân) và xem được OKRs của phòng ban/công ty (nếu được phân quyền xem).

Manager: Được quản lý OKRs của phòng ban mình, có thể tạo Objective cấp phòng ban, xem OKRs cấp công ty.

Admin: Toàn quyền trên tất cả OKRs, có thể tạo Objective cấp công ty, xóa bất kỳ.

Hành động chính trên trang
Xem danh sách OKRs theo cấu trúc phân cấp.

Tạo Objective mới (có thể kèm KR).

Sửa / Xóa Objective (chỉ khi chưa có KR hoặc có quyền).

Thêm KR mới vào một Objective.

Sửa / Xóa KR.

Check-in KR (cập nhật giá trị hiện tại, ghi nhận lịch sử).

Lọc, tìm kiếm, xuất báo cáo OKRs.

14. Trang check-in
Mục đích: Cho phép người dùng cập nhật tiến độ các Key Results của họ một cách tập trung theo định kỳ (hàng tuần).

Dữ liệu hiển thị:

Danh sách các KR cần check-in (thuộc các Objective mà user là owner hoặc collaborator).

Mỗi KR hiển thị: Tên Objective cha, Tên KR, Giá trị hiện tại, Mục tiêu, Tiến độ, lần check-in gần nhất.

Form check-in cho mỗi KR: ô nhập giá trị mới (số), thanh kéo hoặc input, comment (tối đa 500 ký tự)..

Nút “Check-in tất cả” (chỉ cập nhật những KR đã nhập).

Lịch sử check-in gần đây (dạng timeline).

Nhắc nhở: “Đã 7 ngày chưa check-in” cho các KR quá hạn.

Hành động: Gửi giá trị mới, lưu lại lịch sử.

15. Trang todaylist
Mục đích: Danh sách công việc cần làm hôm nay của cá nhân, tích hợp từ OKR, công việc được giao, và tự tạo nhanh.

Dữ liệu hiển thị:

Danh sách công việc dạng checklist:

Tiêu đề công việc, thời gian bắt đầu - kết thúc, Mức độ quan trọng (Quan trọng/ít quan trọng/không quan trọng), mô tả.

Liên kết đến OKR/task gốc (nếu có), người liên quan (nếu có).

Checkbox đánh dấu hoàn thành.

Nút “Thêm Todaylist”.

Xem: xem hôm nay + list chưa hoàn thành (cho màu đỏ) hoặc là xem theo ngày.

Hành động: Đánh dấu hoàn thành (cập nhật trạng thái), thêm mới, xóa, chỉnh sửa.

16. Trang công việc
Mục đích: Quản lý công việc (task) chi tiết, gán cho nhân sự, liên kết với OKR.

Dữ liệu hiển thị:

Bảng công việc: Tên task, Người thực hiện, Người tạo, Deadline, Ưu tiên, Tiến độ (%), Liên kết OKR (tên Objective/KR).

Tìm kiếm, lọc theo người thực hiện, trạng thái, deadline (quá hạn, hôm nay).

Nút “Tạo task” (form: Tên công việc, mô tả, người thực hiện, Thời hạn hoàn thành, Độ ưu tiên (Gấp & quan trọng, Gấp & không quan trọng, Không gấp & quan trọng, Không gấp & không quan trọng), Người theo dõi (tùy chọn nếu có, chọn nhiều được), chọn OKR liên kết (có thể chọn theo 2 loại là Objective hoặc KR, chọn KR thì sẽ lưu cả Objective và KR trong db)).

Trên mỗi task: nút “Xem chi tiết”, “Sửa”, “Xóa”, “Thay đổi trạng thái”.

Có thể xem dưới dạng Kanban board (cột trạng thái).

Hành động: CRUD task, cập nhật tiến độ hoàn thành.


17. Trang phản hồi
Mục đích: Hệ thống gửi và nhận phản hồi (feedback) giữa các nhân sự, minh bạch và xây dựng.

Dữ liệu hiển thị:

Phản hồi tôi nhận được (dạng timeline): Người gửi, nội dung, thời gian, liên kết đến OKR/công việc (nếu có), Lời khuyên hoặc hướng dẫn (nếu có).

Phản hồi tôi đã gửi.

Gửi phản hồi mới: Chọn người nhận, nhập nội dung (bắt buộc), chọn OKR/task liên quan (tùy chọn), Lời khuyên hoặc hướng dẫn (tùy chọn).

Hành động: Gửi phản hồi.



18. Trang Kudo box
Mục đích: Nơi công khai gửi lời cảm ơn, khen ngợi đồng nghiệp (giống bảng tin), tăng tinh thần.

Dữ liệu hiển thị:

Dòng thời gian (feed).

Ô “Gửi Kudo mới”: Chọn người nhận, Bạn muốn ghi nhận về và Tiêu chí ghi nhận (category ở star_criteria và tiêu chí đã tạo ở star_criteria), 1 field tôi chưa biết đặt tên là gì (nó kiểu bổ sung cụ thể cho category, ví dụ category Mục tiêu thì field này là Mục tiêu 1, Mục tiêu 2, Mục tiêu 3..., Dự án thì là Dự án 1, Dự án 2, Dự án 3..., ), viết nội dung.

Bảng xếp hạng “Người nhận Kudo nhiều nhất” trong tháng.

Bộ lọc theo người nhận, người gửi, khoảng thời gian.

Hành động: Gửi Kudo.



19. Trang đổi quà
Mục đích: Cho phép nhân viên xem kho quà và đổi quà bằng số sao hiện có của họ.

Dữ liệu hiển thị:

Thông tin cá nhân: Số sao hiện có, nút “Xem lịch sử đổi”.

Danh sách quà tặng dạng grid: Ảnh, tên quà, giá sao, nút “Đổi” (disabled nếu không đủ sao hoặc hết hàng).

Bộ lọc theo giá sao, danh mục, tìm theo tên quà.

Chọn quà vào giỏ quà, Giỏ hàng đổi quà (có thể đổi nhiều quà một lúc) – hiển thị tổng sao cần, nút “Xác nhận đổi”.

Modal xác nhận đổi, thông báo thành công, trừ sao.

Hành động: Đổi quà, xem lịch sử đổi.


