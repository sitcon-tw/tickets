# K6 壓力測試指南

這個目錄包含了針對 SITCONTIX 票務系統的 k6 壓力測試腳本。

## 安裝 K6

### macOS

```bash
brew install k6
```

### Linux

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows

```bash
choco install k6
# 或下載 binary: https://dl.k6.io/msi/k6-latest-amd64.msi
```

## 測試腳本說明

### 1. basic-load-test.js

基礎負載測試，模擬正常流量情況。

**測試內容:**

- 獲取活動列表
- 查看活動詳情
- 查看票券資訊

**運行:**

```bash
k6 run k6-tests/basic-load-test.js
```

**自訂 API URL:**

```bash
k6 run -e BASE_URL=https://api.yourdomain.com k6-tests/basic-load-test.js
```

### 2. spike-test.js

尖峰測試，模擬突然大量流量湧入（如票券開賣）。

**測試內容:**

- 快速增加到大量並發用戶
- 模擬搶票行為
- 測試系統在突發流量下的表現

**運行:**

```bash
k6 run k6-tests/spike-test.js
```

### 3. stress-test.js

壓力測試，持續增加負載找出系統極限。

**測試內容:**

- 逐步增加用戶數
- 找出系統瓶頸
- 測試系統在高負載下的穩定性

**運行:**

```bash
k6 run k6-tests/stress-test.js
```

### 4. registration-flow-test.js

報名流程測試，模擬完整的用戶報名路徑。

**測試內容:**

- 瀏覽活動
- 查看票券
- 查看報名表單

**運行:**

```bash
k6 run k6-tests/registration-flow-test.js
```

## 進階用法

### 調整虛擬用戶數

```bash
k6 run --vus 100 --duration 30s k6-tests/basic-load-test.js
```

### 輸出結果到檔案

```bash
k6 run --out json=test-results.json k6-tests/basic-load-test.js
```

### 使用 InfluxDB + Grafana 視覺化

```bash
k6 run --out influxdb=http://localhost:8086/k6 k6-tests/basic-load-test.js
```

### 在 Docker 中運行

```bash
docker run --rm -i grafana/k6 run - <k6-tests/basic-load-test.js
```

## 性能指標說明

### http_req_duration

- `p(95)<500`: 95% 的請求應在 500ms 內完成
- `p(99)<1000`: 99% 的請求應在 1000ms 內完成

### errors

- `rate<0.1`: 錯誤率應低於 10%

### http_req_failed

- 失敗的請求比例

## 最佳實踐

1. **逐步增加負載**: 從小流量開始，逐步增加
2. **監控系統資源**: 同時監控 CPU、記憶體、資料庫連線等
3. **測試環境**: 建議在與生產環境相似的環境中測試
4. **測試前準備**: 確保資料庫有足夠的測試資料
5. **結果分析**: 關注響應時間、錯誤率、吞吐量等指標

## 針對特定 API 端點測試

如需測試特定端點，可以創建自訂腳本：

```javascript
import http from "k6/http";
import { check } from "k6";

export const options = {
	vus: 50,
	duration: "30s"
};

export default function () {
	const res = http.get("http://localhost:3000/api/events/YOUR_EVENT_ID/info");
	check(res, {
		"status is 200": r => r.status === 200
	});
}
```

## 與 CI/CD 整合

可以將 k6 測試加入 GitHub Actions：

```yaml
- name: Run k6 test
  uses: grafana/k6-action@v0.3.1
  with:
    filename: k6-tests/basic-load-test.js
  env:
    BASE_URL: ${{ secrets.API_URL }}
```

## 疑難排解

### 連線錯誤

- 確認後端服務是否運行
- 檢查 BASE_URL 是否正確
- 確認防火牆設定

### 高錯誤率

- 檢查 rate limiting 設定
- 確認資料庫連線池大小
- 檢視後端 log

### 資源不足

- 調整虛擬用戶數
- 增加 ramp-up 時間
- 使用分散式測試

## 參考資源

- [K6 官方文檔](https://k6.io/docs/)
- [K6 測試類型](https://k6.io/docs/test-types/introduction/)
- [K6 指標參考](https://k6.io/docs/using-k6/metrics/)
