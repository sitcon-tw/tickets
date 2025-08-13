import { MailtrapClient } from "mailtrap";

const client = new MailtrapClient({
	token: process.env.MAILTRAP_TOKEN,
});

export const sendRegistrationConfirmation = async (registration, event, qrCodeUrl) => {
	try {
		const sender = {
			email: process.env.MAIL_FROM_ADDRESS || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCON 2026",
		};

		const recipients = [
			{
				email: registration.email,
			}
		];

		await client.send({
			from: sender,
			to: recipients,
			subject: `【${event.name}】報名確認 Registration Confirmation`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>報名確認</title>
				</head>
				<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="text-align: center; margin-bottom: 30px;">
						<h1 style="color: #2c3e50;">報名確認 Registration Confirmation</h1>
					</div>
					
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
						<h2 style="color: #2c3e50; margin-top: 0;">活動資訊 Event Information</h2>
						<p><strong>活動名稱 Event Name:</strong> ${event.name}</p>
						<p><strong>活動時間 Event Date:</strong> ${new Date(event.startDate).toLocaleDateString('zh-TW')} - ${new Date(event.endDate).toLocaleDateString('zh-TW')}</p>
						<p><strong>活動地點 Location:</strong> ${event.location || '待公布 TBA'}</p>
					</div>

					<div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
						<h2 style="color: #2c3e50; margin-top: 0;">報名資訊 Registration Information</h2>
						<p><strong>報名編號 Order Number:</strong> ${registration.id}</p>
						<p><strong>報到碼 Check-in Code:</strong> ${registration.referralCode}</p>
						<p><strong>報名狀態 Status:</strong> 已確認 Confirmed</p>
					</div>

					<div style="text-align: center; margin: 30px 0;">
						<h3>報到 QR Code</h3>
						<img src="${qrCodeUrl}" alt="QR Code" style="max-width: 200px; height: auto; border: 1px solid #ddd; padding: 10px; background: white;">
						<p style="font-size: 12px; color: #666;">請於活動當日出示此 QR Code 進行報到<br>Please present this QR code for check-in on the event day</p>
					</div>

					<div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
						<p style="margin: 0;"><strong>重要提醒 Important Notice:</strong></p>
						<p style="margin: 5px 0 0 0;">請保存此信件作為報名憑證。如需修改報名資料，請至官網使用「編輯報名」功能。</p>
						<p style="margin: 5px 0 0 0;">Please keep this email as your registration proof. To edit your registration, please use the "Edit Registration" function on our website.</p>
					</div>

					<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
						<p style="color: #666; font-size: 12px;">
							此為系統自動發送信件，請勿直接回覆<br>
							This is an automated email, please do not reply directly
						</p>
					</div>
				</body>
				</html>
			`,
		});

		return true;
	} catch (error) {
		console.error("Email sending error:", error);
		return false;
	}
};

export const sendEditLink = async (email, editToken, event) => {
	try {
		const sender = {
			email: process.env.MAIL_FROM_ADDRESS || "noreply@sitcon.org", 
			name: process.env.MAIL_FROM_NAME || "SITCON 2026",
		};

		const recipients = [
			{
				email: email,
			}
		];

		const editUrl = `${process.env.FRONTEND_URL || 'http://localhost:4321'}/edit/${editToken}`;

		await client.send({
			from: sender,
			to: recipients,
			subject: `【${event.name}】報名資料編輯連結 Registration Edit Link`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>報名資料編輯連結</title>
				</head>
				<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="text-align: center; margin-bottom: 30px;">
						<h1 style="color: #2c3e50;">報名資料編輯連結</h1>
						<h2 style="color: #2c3e50;">Registration Edit Link</h2>
					</div>
					
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
						<h3 style="color: #2c3e50; margin-top: 0;">活動資訊 Event Information</h3>
						<p><strong>活動名稱 Event Name:</strong> ${event.name}</p>
					</div>

					<div style="text-align: center; margin: 30px 0;">
						<a href="${editUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
							編輯報名資料 Edit Registration
						</a>
					</div>

					<div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
						<p style="margin: 0;"><strong>安全提醒 Security Notice:</strong></p>
						<ul style="margin: 10px 0 0 20px; padding: 0;">
							<li>此連結僅供您個人使用 This link is for your personal use only</li>
							<li>連結有效期限為 30 分鐘 Link is valid for 30 minutes</li>
							<li>如非您本人申請，請忽略此信件 If you did not request this, please ignore this email</li>
						</ul>
					</div>

					<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
						<p style="color: #666; font-size: 12px;">
							此為系統自動發送信件，請勿直接回覆<br>
							This is an automated email, please do not reply directly
						</p>
					</div>
				</body>
				</html>
			`,
		});

		return true;
	} catch (error) {
		console.error("Email sending error:", error);
		return false;
	}
};