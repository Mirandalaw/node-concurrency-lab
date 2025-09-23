# node-concurrency-lab

**Node.js 이벤트 루프와 동시성 실험 프로젝트**
이 레포지토리는 Node.js 서버의 **이벤트 루프 동작·지연·동시 처리 특성**을 직접 계측하고,
**Prometheus + Grafana** 환경에서 **실시간 모니터링**하는 실험입니다.

> 단순히 코드 작성 능력뿐 아니라, **시스템 내부 동작을 수치와 그래프로 증명하는 역량**을 보여줍니다.

---

## 프로젝트 개요

* Node.js 이벤트 루프의 **ELU(점유율)**, **ELD(지연)** 계측
* HTTP 요청의 **동시 처리량(in-flight)** 추적
* TCP **Accept → Request 핸들러 진입 지연** 관찰
* Prometheus → Grafana로 **p50/p95/p99 레이턴시 시각화**

---

## Grafana 대시보드 예시

### 1. Accept→Request p95



### 2. 이벤트 루프 지연 (ELD p50/p95/p99)



### 3. In-flight 요청 수



> `/slow` 라우트로 **동시 요청(in-flight) 증가**,
> `/block` 라우트로 **이벤트 루프 지연(ELD) 급등**을 관측할 수 있습니다.

---

## 현재 구현된 내용

### 서버 계측

* `/metrics` 엔드포인트에서 Prometheus 포맷 제공
* 계측된 메트릭

  * `node_event_loop_utilization` : 이벤트 루프 점유율
  * `node_event_loop_delay_seconds_*` : 이벤트 루프 지연 (ELD)
  * `http_in_flight_requests` : 현재 처리 중 요청 수
  * `http_accept_to_request_seconds_*` : Accept→Request 지연
  * `http_server_request_seconds_*` : 요청 처리 시간

### 테스트 라우트

* `/ok` → 빠른 응답
* `/slow?ms=2000` → 비동기 지연 응답 (in-flight 확인)
* `/block?ms=50` → 동기 블로킹 (ELD 확인)

### Grafana 쿼리 예시

* **Accept→Request p95**

  ```promql
  1000 * histogram_quantile(
    0.95,
    sum(rate(http_accept_to_request_seconds_bucket[5m])) by (le)
  )
  ```
* **ELD p95**

  ```promql
  1000 * histogram_quantile(
    0.95,
    sum(rate(node_event_loop_delay_seconds_bucket[1m])) by (le)
  )
  ```
* **In-flight 요청 수**

  ```promql
  http_in_flight_requests
  ```

---

## 🛠️ 실행 방법

```bash
# 서버 실행
npm run start

# 메트릭 확인
curl http://localhost:3000/metrics

# 부하 테스트 (in-flight 증가 확인)
autocannon -c 100 -d 10 http://localhost:3000/slow?ms=2000

# 부하 테스트 (ELD 확인)
autocannon -c 50 -d 10 http://localhost:3000/block?ms=50
```

---

## 💡 인사이트

* \*\*ELD는 단순 비동기 지연(setTimeout)\*\*으로는 안 튀고, **동기 블로킹 연산**에서만 급격히 증가한다.
* **Accept→Request 지연**은 커넥션 backlog와 이벤트 루프 포화 상황을 수치로 보여준다.
* **In-flight 요청 수** 추적을 통해 서버의 동시 처리 한계를 직접 관찰할 수 있다.

---


> 이 프로젝트는 **Node.js 내부 동작을 계측하고, 지표 기반으로 병목을 증명하는 능력**을 보여주기 위해 설계되었습니다.
