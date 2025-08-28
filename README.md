# Node Concurrency Lab

Node.js 이벤트 루프 / 동시성 / 백프레셔 학습 실험 레포지토리

---

## 1. 개요
이 프로젝트는 Node.js의 **이벤트 루프와 I/O 동작 방식**,  
그리고 **백프레셔(backpressure)** 효과를 직접 체험하기 위한 실습용 코드입니다.

---

## 2. 실행 방법
```bash
# 의존성 설치
npm install

# 1단계: Hello World 서버 실행
npx tsx src/1-hello-world.ts

# 2단계: Backpressure 실험 서버 실행
npx tsx src/2-backpressure.ts
```

---

## 3. 실험 1: Hello World (Baseline)

* **코드**: Node.js 내장 http 서버, 단순히 "ok" 응답
* **벤치마크 명령어**

  ```bash
  npx autocannon -c 200 -d 15 http://localhost:3000
  ```
* **결과 기록**

  | 동시성 | 기간 | RPS(avg) | p50(ms) | p95(ms) | 에러 | 메모 |
  | --: | -: | -------: | ------: | ------: | -: | -- |
  |  20  | 15s | 93,442  |        0 |     0    |    | baseline, 응답 단순 "ok", 매우 빠름 |
  |  50  | 15s | 96,049 | 0 | 1 | | 에러 없음, 지연 거의 0ms, baseline 대비 안정적 성능|
  | 100 | 15s | 95,950 | 1 | 2 | | 에러 없음, RPS 안정적, baseline 대비 큰 변화 없음|
  | 200 | 15s |83,220 | 2|4~5 | | 에러 없음, c100 대비 ~13%↓, p50 2ms/p99 5ms | 

## 실험 인사이트

### -c 20 (동시성 20)
- **평균 RPS**: ~93k  
- **Latency**: p50 ≈ 0ms / p95 ≈ 0ms  
- **에러**: 없음  
- **인사이트**:  
  동시성 20에서는 초당 약 93k RPS 정도가 나왔다. 지연은 사실상 0ms 수준으로 즉시 응답에 가깝다.  
  안정적이며 baseline 성능 확인용으로 충분하다.  

---

### -c 50 (동시성 50)
- **평균 RPS**: ~96k  
- **Latency**: p50 ≈ 0ms / p95 ≈ 1ms  
- **에러**: 없음  
- **인사이트**:  
  동시성을 두 배로 높였음에도 성능은 거의 동일하다.  
  RPS가 안정적으로 유지되고 지연도 낮아 이벤트 루프와 네트워크 처리에 여유가 있음을 보여준다.  

---

### -c 100 (동시성 100)
- **평균 RPS**: ~95.9k  
- **Latency**: p50 ≈ 1ms / p95 ≈ 2ms / Max ≈ 18ms  
- **에러**: 없음  
- **인사이트**:  
  동시성 100까지는 baseline 성능이 그대로 유지된다.  
  대부분 요청이 1~2ms 내에 처리되며, 일부 요청만 10ms 이상으로 튀었다.  
  Node.js 이벤트 루프가 안정적으로 부하를 감당하고 있음을 확인했다.  

---

### -c 200 (동시성 200)
- **평균 RPS**: ~83k (**약 13% 하락**)  
- **Latency**: p50 ≈ 2ms / p95 ≈ 5ms / Max ≈ 66ms  
- **에러**: 없음  
- **인사이트**:  
  동시성 200에서는 처리량이 오히려 줄고 tail latency가 증가하기 시작했다.  
  이벤트 루프·TCP 스케줄링 오버헤드 때문에 더 이상 선형적 성능 확장이 되지 않는다.  
  안정성은 유지되지만, 고부하 상황에서 응답 분포가 퍼지는 모습을 확인할 수 있었다.  


---

## 4. 실험 2: Backpressure

* **엔드포인트**

  * `/bad-case` : 백프레셔 무시
  * `/drain`    : drain 이벤트 대기 처리
  * `/pipeline` : 파일 스트리밍 (pipeline)
  * `/pipe`     : 파일 스트리밍 (pipe)

* **벤치마크 명령어 예시**

  ```bash
  npx autocannon -c 50 -d 15 http://localhost:3000/bad-case
  npx autocannon -c 50 -d 15 http://localhost:3000/drain
  npx autocannon -c 50 -d 15 http://localhost:3000/pipeline
  npx autocannon -c 50 -d 15 http://localhost:3000/pipe
  ```

* **결과 기록**

  | 케이스      | 동시성 | 기간 | RPS(avg) | p50(ms) | p95(ms) | 에러 | 메모리 추세 | 이벤트 루프 지연 | 비고 |
  | -------- | --: | -: | -------: | ------: | ------: | -: | ------ | --------- | -- |
  | bad-case |     |    |          |         |         |    |        |           |    |
  | drain    |     |    |          |         |         |    |        |           |    |
  | pipeline |     |    |          |         |         |    |        |           |    |
  | pipe     |     |    |          |         |         |    |        |           |    |

* **인사이트**

  * bad-case: 메모리 급증 → 서버 불안정
  * drain: 메모리 안정, 지연 감소
  * pipeline: 가장 실무 친화적인 방법
  * pipe: 유사 성능, 수동 에러 핸들링 필요

---

## 5. 배운 점

* Node.js 기본 http 서버는 baseline에서도 높은 성능 제공
* 백프레셔 무시는 위험 → drain/pipeline 필수
* 실무에서 파일 다운로드, Proxy, SSE/WebSocket 스트리밍 시 **pipeline()** 적극 활용

---

## 6. 테스트 환경

* Node.js 버전: v20.11.1
* OS: MacOS || Window
* CPU/RAM: M1/RAM16GB || Ryzen5700/RAM32GB
* 부하 도구: autocannon (`-c`, `-d` 값 명시)
