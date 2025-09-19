# Node Concurrency Lab

Node.js 이벤트 루프 / 동시성 / 백프레셔 학습 실험 레포지토리


---

1. 실험 1: Hello World (Baseline)
목적

가장 단순한 HTTP 서버(응답 본문 "ok" 수준)에서 **동시성(c)**을 바꿨을 때 처리량(RPS)과 지연 분포(p50/p95/p99)가 어떻게 변하는지 측정해 **비교 기준선(baseline)**을 확보한다. 이후 Backpressure/세마포어/Worker Threads/Timeout 등의 실험 결과를 해석할 때 근거가 되는 기준치로 사용한다.

환경(고정·기록)

머신: MacBook Pro (Apple M1, 16GB RAM), macOS 14.x

Node.js: v20.x (LTS)

부하 생성기: autocannon v7.x (로컬 동일 머신 또는 동일 L2 네트워크)

시계 동기화: macOS 기본 NTP 사용

파일 디스크립터 한도: ulimit -n (실험 시점 값 별도 기록 권장)


