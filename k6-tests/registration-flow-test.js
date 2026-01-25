import { check, sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

// 測試報名流程
export const options = {
	stages: [
		{ duration: "1m", target: 30 },
		{ duration: "3m", target: 30 },
		{ duration: "1m", target: 0 }
	],
	thresholds: {
		http_req_duration: ["p(95)<1000"],
		errors: ["rate<0.15"]
	}
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
	// 1. 獲取活動列表
	let eventsRes = http.get(`${BASE_URL}/api/events`);
	check(eventsRes, {
		獲取活動列表成功: r => r.status === 200
	}) || errorRate.add(1);

	sleep(2);

	// 2. 查看活動詳情
	if (eventsRes.status === 200) {
		try {
			const events = JSON.parse(eventsRes.body);
			if (events.data && events.data.length > 0) {
				const event = events.data[0];
				const eventId = event.id || event.slug;

				// 獲取活動詳情
				let infoRes = http.get(`${BASE_URL}/api/events/${eventId}/info`);
				check(infoRes, {
					獲取活動詳情成功: r => r.status === 200
				}) || errorRate.add(1);

				sleep(2);

				// 獲取票券列表
				let ticketsRes = http.get(`${BASE_URL}/api/events/${eventId}/tickets`);
				check(ticketsRes, {
					獲取票券列表成功: r => r.status === 200
				}) || errorRate.add(1);

				sleep(1);

				// 獲取報名表單欄位
				let formRes = http.get(`${BASE_URL}/api/events/${eventId}/form-fields`);
				check(formRes, {
					獲取表單欄位成功: r => r.status === 200 || r.status === 404 // 可能沒有自訂欄位
				}) || errorRate.add(1);

				sleep(2);

				// 注意：實際的報名 POST 請求需要 auth token，這裡只測試讀取流程
				// 如需測試完整報名流程，需要實作登入並取得 token 的邏輯
			}
		} catch (e) {
			console.error("解析回應失敗:", e);
			errorRate.add(1);
		}
	}

	sleep(3);
}
