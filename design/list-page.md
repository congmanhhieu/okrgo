Ứng dụng webapp quản trị OKR

Có các trang sau:
1. Trang chủ giới thiệu
2. Đăng ký/Đăng nhập
3. Quên mật khẩu
4. Đặt lại mật khẩu
5. Thông tin cá nhân
6. Phòng ban
7. Nhân sự


8. Quản lý chu kì OKRs
Mục đích: Tạo và quản lý các chu kỳ OKR (theo quý, năm, tháng).

Dữ liệu hiển thị:

Danh sách chu kỳ: Tên chu kỳ (Q1-2025, Năm 2025...), Ngày bắt đầu – Ngày kết thúc, Trạng thái (Đang hoạt động/Đã đóng), Hành động (sửa, xóa).

Nút “Tạo chu kỳ mới” (form: tên, ngày, mô tả).

Chỉ được phép có một chu kỳ “Đang hoạt động” duy nhất.

Hiển thị cảnh báo khi đóng chu kỳ (sao lưu dữ liệu).

Hành động: Tạo, sửa, xóa (chỉ khi chưa có OKR), kích hoạt chu kỳ. Khi đóng chu kỳ, khóa không cho check-in thêm.


9. Quản lý sao


10. Kho quà tặng
Mục đích: Quản lý danh sách quà có thể đổi bằng sao (dành cho Admin).

Dữ liệu hiển thị:

Bảng quà: Ảnh, Tên quà, Mô tả, Giá sao, Số lượng tồn kho, Trạng thái (còn hàng/hết), Hành động (sửa, xóa).

Nút “Thêm quà” (upload ảnh, nhập thông tin).

Tìm kiếm, lọc theo giá sao, danh mục (hiện vật, voucher, khóa học…).

Hành động: CRUD quà, import/export. Khi đổi quà (từ trang 20), tự động trừ số lượng tồn kho.


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

Form check-in cho mỗi KR: ô nhập giá trị mới (số), thanh kéo hoặc input, comment (tối đa 500 ký tự), có thể đính kèm link/file.

Nút “Check-in tất cả” (chỉ cập nhật những KR đã nhập).

Lịch sử check-in gần đây (dạng timeline).

Nhắc nhở: “Đã 7 ngày chưa check-in” cho các KR quá hạn.

Hành động: Gửi giá trị mới, lưu lại lịch sử, gửi thông báo đến manager nếu tiến độ thấp (<30%).

15. Trang todaylist
Mục đích: Danh sách công việc cần làm hôm nay của cá nhân, tích hợp từ OKR, công việc được giao, và tự tạo nhanh.

Dữ liệu hiển thị:

Danh sách công việc dạng checklist:

Tiêu đề công việc, thời gian dự kiến, ưu tiên (Cao/Trung/Thấp), mô tả.

Liên kết đến OKR/task gốc (nếu có), người liên quan (nếu có).

Checkbox đánh dấu hoàn thành.

Nút “Thêm công việc nhanh” (input thêm, không cần form đầy đủ).

Bộ lọc: Hôm nay, Tuần này, Quá hạn.

Kéo thả để sắp xếp thứ tự ưu tiên.

Hành động: Đánh dấu hoàn thành (cập nhật trạng thái), thêm mới, xóa, chỉnh sửa.

16. Trang công việc
Mục đích: Quản lý công việc (task) chi tiết, gán cho nhân sự, liên kết với OKR.

Dữ liệu hiển thị:

Bảng công việc: Tên task, Người được giao, Người tạo, Deadline, Ưu tiên, Trạng thái (To do/In progress/Done), Liên kết OKR (tên Objective/KR).

Tìm kiếm, lọc theo người được giao, trạng thái, deadline (quá hạn, hôm nay).

Nút “Tạo task” (form: tên, mô tả, người được giao, deadline, ưu tiên, chọn OKR liên kết).

Trên mỗi task: nút “Xem chi tiết”, “Sửa”, “Xóa”, “Thay đổi trạng thái”.

Có thể xem dưới dạng Kanban board (cột trạng thái).

Hành động: CRUD task, gửi thông báo email cho người được giao, cập nhật todaylist của họ. Khi task liên quan đến KR, có thể tăng tiến độ KR thủ công hoặc tự động (tùy cấu hình).


17. Trang phản hồi
Mục đích: Hệ thống gửi và nhận phản hồi (feedback) giữa các nhân sự, minh bạch và xây dựng.

Dữ liệu hiển thị:

Phản hồi tôi nhận được (dạng timeline): Người gửi, nội dung, thời gian, liên kết đến OKR/công việc (nếu có), số sao kèm (tùy chọn).

Phản hồi tôi đã gửi: Lịch sử, có thể chỉnh sửa/xóa trong giới hạn thời gian.

Gửi phản hồi mới: Chọn người nhận, nhập tiêu đề, nội dung, có thể gắn sao (trích từ quỹ cá nhân), chọn OKR/task liên quan.

Bộ lọc theo người gửi, ngày, loại (công khai/riêng tư).

Nút “Xuất phản hồi của tôi”.

Hành động: Gửi phản hồi (có thể kèm sao), sửa/xóa (nếu chưa quá 24h), thông báo qua email/in-app. Admin có thể xóa bất kỳ.



18. Trang Kudo box
Mục đích: Nơi công khai gửi lời cảm ơn, khen ngợi đồng nghiệp (giống bảng tin), tăng tinh thần.

Dữ liệu hiển thị:

Dòng thời gian (feed): Mỗi Kudo gồm: Ảnh đại diện người gửi, người nhận, nội dung (tối đa 280 ký tự), hashtag (#giá trị), số sao kèm (nếu có), số lượt thích, comment (tùy chọn).

Ô “Gửi Kudo mới”: Chọn người nhận, viết nội dung, gắn sao (số lượng, nếu có), có thể upload ảnh.

Bảng xếp hạng “Người nhận Kudo nhiều nhất” trong tháng.

Bộ lọc theo người nhận, người gửi, khoảng thời gian.

Nút “Thích” (heart), “Chia sẻ”.

Hành động: Gửi Kudo, tiêu tốn sao (nếu gắn sao), cập nhật bảng xếp hạng. Admin có thể xóa Kudo không phù hợp.



19. Trang quà tặng
Mục đích: Cho phép nhân viên xem kho quà và đổi quà bằng số sao hiện có của họ.

Dữ liệu hiển thị:

Thông tin cá nhân: Số sao hiện có, nút “Xem lịch sử đổi”.

Danh sách quà tặng dạng grid: Ảnh, tên quà, giá sao, số lượng tồn kho, nút “Đổi” (disabled nếu không đủ sao hoặc hết hàng).

Bộ lọc theo giá sao, danh mục.

Giỏ hàng đổi quà (có thể đổi nhiều quà một lúc) – hiển thị tổng sao cần, nút “Xác nhận đổi”.

Modal xác nhận đổi, thông báo thành công, trừ sao, giảm tồn kho.

Hành động: Đổi quà, xem lịch sử đổi (danh sách quà đã đổi, ngày, trạng thái giao hàng: Chờ xử lý/Đã giao). Quản lý (Admin) có thể cập nhật trạng thái giao hàng từ trang Kho quà tặng.


