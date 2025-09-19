# Node Concurrency Lab

## Node.js 이벤트 루프 / 동시성 / 백프레셔 학습 실험 레포지토리

---

## 실험 1 : 1-hello-world (Baseline)

### 목적
가장 단순한 HTTP 서버(응답 본문 `"ok"` 수준)에서 **동시성**(concurrency, c)을 바꿨을 때  
처리량(RPS)과 지연 분포(p50/p95/p99)가 어떻게 변하는지 측정해 비교 **기준선**(baseline)을 확보한다.  
이후 Backpressure / 세마포어 / Worker Threads / Timeout 등의 실험 결과를 해석할 때  
**근거가 되는 기준치**로 사용하기 위해서!

### 환경 (고정·기록)
- **머신**: MacBook Air M1 (Apple M1, 16GB RAM), macOS 14.x  
- **Node.js**: v20.x (LTS)  
- **부하 생성기**: autocannon v7.x (로컬 동일 머신 또는 동일 L2 네트워크)  
- **시계 동기화**: macOS 기본 NTP 사용  
- **파일 디스크립터 한도**: `ulimit -n` (실험 시점 값 별도 기록 권장)

### 커널 파라미터 (측정 시점)

> macOS에서는 `sysctl`로 확인합니다.  
> 아래 값은 실측치입니다.

- `kern.maxfiles`: **122880**  
  시스템 전체 파일 디스크립터(FD) 상한  

- `kern.maxfilesperproc`: **61440**  
  프로세스당 파일 디스크립터 상한  

- `kern.ipc.somaxconn`: **128**  
  `listen()` 대기 큐(backlog) 상한  

- `net.inet.tcp.msl`: **15000** (밀리초)  
  TCP MSL → TIME_WAIT ≈ `2 * MSL` → 약 **30초**
