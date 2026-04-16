Đây là **Design System** cho ứng dụng web quản lý OKR, tone xanh lá chủ đạo `#00b24e`, phong cách hiện đại, tối giản, bo góc mềm mại, nền xám và các khối màu trắng.

---

## 1. Tổng quan

- **Màu nền tổng thể**: `#F5F7FA` (xám rất nhạt, hiện đại)
- **Màu khối nội dung**: Trắng `#FFFFFF`
- **Màu chính (Primary)**: `#00b24e`
- **Bo góc**: `12px` cho card, `8px` cho input/button nhỏ, `16px` cho modal
- **Đổ bóng**: Nhẹ, mềm, tạo chiều sâu tối giản

---

## 2. Bảng màu chi tiết

| Vai trò | Mã màu | Ghi chú |
|---------|--------|---------|
| Primary | `#00b24e` | Xanh lá chủ đạo |
| Primary hover | `#009440` | Tối hơn 10% |
| Primary light | `#E6F7ED` | Nền nhấn nhẹ |
| Text chính | `#1E2A3A` | Gần đen xanh |
| Text phụ | `#5A6E85` | Xám xanh nhẹ |
| Border | `#E2E8F0` | Đường viền rất nhạt |
| Background page | `#F5F7FA` | Xám nền |
| Card background | `#FFFFFF` | Trắng |
| Success | `#10B981` | Xanh OKR đạt |
| Warning | `#F59E0B` | Cảnh báo lệch tiến độ |
| Danger | `#EF4444` | Rủi ro |

---

## 3. Hình dạng & Bo góc

- **Card, modal, drawer**: `border-radius: 16px`
- **Button, input, select, tag**: `border-radius: 10px`
- **Badge nhỏ, avatar**: `border-radius: 20px` (dạng pill)
- **Progress bar**: `border-radius: 20px`

---

## 4. Thành phần giao diện

### 4.1. Nút bấm (Buttons)

**Primary**  
- Nền: `#00b24e`, chữ trắng  
- Hover: `#009440`  
- Padding: `10px 20px`  
- Bo góc: `10px`

**Secondary**  
- Nền trắng, viền `#00b24e`, chữ `#00b24e`

**Ghost**  
- Nền trong suốt, chữ `#5A6E85`, hover nền `#F1F5F9`

### 4.2. Form & Input

- Nền trắng, viền `#E2E8F0`, bo góc `10px`  
- Focus: viền `#00b24e`, không đổ bóng nặng  
- Label: `#1E2A3A`, size 14px, đậm nhẹ

### 4.3. OKR Card (quan trọng nhất)

```css
OKR Card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
  border: 1px solid #F0F2F5;
}
```

- **Tiêu đề OKR**: size 18px, đậm, màu `#1E2A3A`
- **Thanh tiến độ**: màu nền `#E6F7ED`, fill `#00b24e`, bo góc `20px`
- **Key result item**: dùng dấu chấm tròn màu xanh bên cạnh

### 4.4. Bảng (Table)

- Header nền `#F8FAFE`, chữ đậm nhẹ  
- Row kẻ ngang mảnh  
- Hover row: nền `#F9FBFD`  
- Bo góc ngoài table: `16px`

### 4.5. Thanh điều hướng (Sidebar / Navbar)

- Sidebar: nền trắng, viền phải nhạt  
- Navbar: nền trắng, đổ bóng nhẹ dưới  
- Menu active: chữ xanh `#00b24e`, có gạch dưới hoặc chấm bên trái màu xanh

---

## 5. Khoảng cách & Grid

- **Spacing scale**: 4, 8, 12, 16, 20, 24, 32, 40px  
- **Container padding**: 24px  
- **Grid gap**: 20px

---

## 6. Typography

- Font: **Inter** (hiện đại, dễ đọc)  
- H1: 28px, bold  
- H2: 22px, semibold  
- Body: 14px, regular  
- Small text: 12px, màu phụ

---

## 7. Biểu tượng & Hình ảnh

- Icon: **Feather** hoặc **Lucide** (stroke 1.5px, thanh mảnh)  
- Màu icon mặc định: `#5A6E85`, icon active: `#00b24e`

---

## 8. Ví dụ giao diện OKR Dashboard (mô tả)

```
[Header]       Tổng quan OKR Q2 - Công ty
[Filter bar]   [Tất cả] [Cá nhân] [Phòng ban]   + Thêm OKR

[Card OKR 1]  
  Mục tiêu: Tăng trưởng doanh thu 30%  
  Tiến độ: ████████░░ 75%  
  Key results:  
    ✓ Đạt 15/20 khách hàng mới  
    ◉ 8.5/10 tỷ doanh thu  

[Card OKR 2]  
  Mục tiêu: Cải thiện chất lượng sản phẩm  
  ...
```

---

## 9. Tương tác & Animation

- Hover card: nâng nhẹ (translateY -2px), shadow tăng nhẹ  
- Transition: 0.2s ease  
- Modal mở: fade + scale nhẹ

---

Bạn có muốn tôi **xuất file CSS/SCSS hoặc Tailwind config** dựa trên design system này để dùng ngay không?
