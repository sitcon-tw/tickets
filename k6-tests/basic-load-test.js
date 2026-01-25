import { check, sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

// 自定義指標
const errorRate = new Rate("errors");

// 測試配置
export const options = {
	stages: [
		{ duration: "30s", target: 20 }, // 30秒內逐漸增加到 20 個虛擬用戶
		{ duration: "1m", target: 50 }, // 1分鐘內增加到 50 個虛擬用戶
		{ duration: "30s", target: 0 } // 30秒內降到 0（冷卻期）
	],
	thresholds: {
		http_req_duration: ["p(95)<500"], // 95% 的請求應在 500ms 內完成
		errors: ["rate<0.1"] // 錯誤率應低於 10%
	}
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
	// 測試 1: 獲取活動列表
	let eventsRes = http.get(`${BASE_URL}/api/events`);
	check(eventsRes, {
		"獲取活動列表狀態為 200": r => r.status === 200,
		"活動列表響應時間 < 500ms": r => r.timings.duration < 500
	}) || errorRate.add(1);

	sleep(1);

	// 測試 2: 獲取單個活動資訊
	// 如果有活動列表，隨機選一個活動
	if (eventsRes.status === 200) {
		try {
			const events = JSON.parse(eventsRes.body);
			if (events.data && events.data.length > 0) {
				const randomEvent = events.data[Math.floor(Math.random() * events.data.length)];
				const eventId = randomEvent.id || randomEvent.slug;

				let eventRes = http.get(`${BASE_URL}/api/events/${eventId}/info`);
				check(eventRes, {
					"獲取活動資訊狀態為 200": r => r.status === 200,
					"活動資訊響應時間 < 500ms": r => r.timings.duration < 500
				}) || errorRate.add(1);

				sleep(1);

				// 測試 3: 獲取活動票券
				let ticketsRes = http.get(`${BASE_URL}/api/events/${eventId}/tickets`);
				check(ticketsRes, {
					"獲取票券列表狀態為 200": r => r.status === 200,
					"票券列表響應時間 < 500ms": r => r.timings.duration < 500
				}) || errorRate.add(1);
			}
		} catch (e) {
			errorRate.add(1);
		}
	}

	sleep(2);
}
