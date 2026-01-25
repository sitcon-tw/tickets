import { check, sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

// 尖峰測試：突然大量流量湧入
export const options = {
	stages: [
		{ duration: "10s", target: 100 }, // 快速增加到 100 用戶
		{ duration: "1m", target: 100 }, // 維持 100 用戶 1 分鐘
		{ duration: "10s", target: 500 }, // 突然暴增到 500 用戶（模擬票券開賣）
		{ duration: "1m", target: 500 }, // 維持 1 分鐘
		{ duration: "20s", target: 0 } // 降回 0
	],
	thresholds: {
		http_req_duration: ["p(95)<2000"], // 尖峰時容許更長的響應時間
		errors: ["rate<0.2"] // 尖峰時容許 20% 錯誤率
	}
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
	// 模擬用戶搶票行為
	const batch = http.batch([
		["GET", `${BASE_URL}/api/events`],
		["GET", `${BASE_URL}/api/events/latest`]
	]);

	batch.forEach(response => {
		check(response, {
			"狀態為 200 或 429 (rate limit)": r => r.status === 200 || r.status === 429
		}) || errorRate.add(1);
	});

	sleep(1);
}
