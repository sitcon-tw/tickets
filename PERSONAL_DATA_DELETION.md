# 個人資料刪除功能 Personal Data Deletion Feature

## 概述 Overview

本功能符合台灣政府的個人資料保護法規定，允許管理員刪除報名者的個人資料，並自動通知活動主辦方。

This feature complies with Taiwan's Personal Information Protection Act, allowing administrators to delete registrants' personal data and automatically notify event organizers.

## 配置 Configuration

在 `.env` 檔案中設定接收刪除通知的電子郵件：

Set the email address to receive deletion notifications in your `.env` file:

```env
ORGANIZER_EMAIL=organizer@sitcon.org
```

## API 端點 API Endpoint

### 刪除報名記錄 Delete Registration

**DELETE** `/api/admin/registrations/:id`

刪除指定的報名記錄及其個人資料。
Delete the specified registration and its personal data.

#### 權限要求 Authorization

需要管理員角色 (Admin Role)

#### 請求參數 Request Parameters

- `id` (路徑參數 Path Parameter): 報名記錄 ID (Registration ID)

#### 回應 Response

**成功 Success (200)**
```json
{
  "success": true,
  "message": "個人資料已成功刪除，通知信已發送給活動主辦方",
  "data": {
    "id": "registration-id",
    "email": "user@example.com"
  }
}
```

**失敗 Error (404)**
```json
{
  "success": false,
  "message": "報名記錄不存在"
}
```

## 電子郵件通知 Email Notification

當管理員刪除報名記錄時，系統會自動發送通知信給活動主辦方，內容包括：

When an administrator deletes a registration, the system automatically sends a notification email to the event organizer, including:

- 活動名稱 Event Name
- 報名編號 Registration ID
- 電子郵件 Email Address
- 刪除時間 Deletion Time
- 法律責任說明 Legal Compliance Information

電子郵件範本基於 KKTIX 的個人資料刪除通知格式。

The email template is based on KKTIX's personal data deletion notification format.

## 資料保留政策 Data Retention Policy

根據台灣個人資料保護法：

According to Taiwan's Personal Information Protection Act:

- ✅ 個人資料將被永久刪除 Personal data will be permanently deleted
- ✅ 主辦方將收到通知 Organizers will be notified
- ✅ 帳務相關資料將依法保存 Transaction-related data will be kept as required by law

## 測試 Testing

您可以使用 Swagger UI 測試此端點：

You can test this endpoint using Swagger UI:

1. 啟動後端伺服器 Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. 訪問 Swagger UI Visit Swagger UI:
   ```
   http://localhost:3000/docs
   ```

3. 使用管理員帳號登入 Login with an admin account

4. 找到 `admin/registrations` 標籤下的 DELETE 端點
   Find the DELETE endpoint under the `admin/registrations` tag

5. 輸入要刪除的報名記錄 ID
   Enter the registration ID you want to delete

6. 執行請求 Execute the request

## 注意事項 Important Notes

- 此操作不可逆，請謹慎使用 This operation is irreversible, use with caution
- 刪除後相關的推薦記錄也會被刪除 Related referral records will also be deleted
- 如果電子郵件發送失敗，刪除操作仍會完成 If email fails, the deletion will still complete
- 建議在執行刪除前先匯出資料備份 Consider exporting data backup before deletion
