# Node Concurrency Lab

Node.js 동시성 / 백프레셔 실습 레포지토리

---

## 1. 프로젝트 실행 방법
```bash
npm i
# 1단계: Hello World 서버 실행
npx tsx src/1-hello-world.ts

# 2단계: 백프레셔 실험 서버 실행
npx tsx src/2-backpressure.ts
```

## 2. 테스트 환경
Node.js v20.x

OS: macOS / Ubuntu

CPU/RAM: 기록

부하 테스트: autocannon, -c 동시성, -d 지속 시간
