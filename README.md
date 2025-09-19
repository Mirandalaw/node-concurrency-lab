# Node Concurrency Lab

Node.js 서버가 **대규모 요청을 어떻게 처리하는지** 직접 실험하고 분석한 프로젝트입니다.  
이 실험을 통해 이벤트 루프, 동시성 제어, 백프레셔, 워커 스레드 등 핵심 개념을 검증하고,  
대규모 트래픽 상황에서 안정적으로 서비스를 운영할 수 있는 역량을 키우기 위해 진행하였습니다.

---

## 실험 1: Hello World (Baseline)

### 목적
- 가장 단순한 HTTP 서버에서 **동시 접속자 수**(concurrency)에 따라 성능(RPS, 지연 시간)이 어떻게 변하는지 측정.  
- 이후 다른 실험(Backpressure, Semaphore, Worker Threads 등)의 비교 기준선 확보.  

### 환경
- MacBook Air M1 (16GB RAM), macOS 14.x  
- Node.js v20.x (LTS)  
- 부하 생성기: autocannon v7.x  

### 결과 (요약)
| 동시성 | 평균 RPS | p50 지연 | p95 지연 |
|------:|---------:|---------:|---------:|
| 20    |      |      |      |
| 100   |      |      |      |
| 200   |      |      |      |
