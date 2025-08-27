import http from "http";
import {once} from 'events';
import {createReadStream, existsSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "path";
import {pipeline} from "stream";
import {setInterval} from "node:timers";


const bigFile = join(tmpdir(), "bigfile-50mb.dat");
if (!existsSync(bigFile)) {
    writeFileSync(bigFile, Buffer.alloc(50 * 1024 * 1024, "x"));
    console.log("bigfile-50mb.dat 생성 완");
}

// === 실험 1 : 백프레셔 무시한 경우 (나쁜 예) ===
async function ignoreBackPressureCase(_req, res) {
    const buf = Buffer.alloc(1024 * 1024, "x");
    for (let i = 0; i < 1000; i++) {
        // write() 결과를 무시 -> drain 대기 안함
        // 반환값이 true/false 인데 true인 경우 송신 버퍼에 여유가 있음, fasle 커널 송신 버퍼가 가득참
        res.write(buf);
    }
    res.end("done");
}

// === 실험 2 : drain 이벤트로 백프레셔 처리 ===

async function backpressureDrain(_req, res) {
    const buf = Buffer.alloc(1024 * 1024, "x");
    for (let i = 0; i < 1000; i++) {
        const ok = res.write(buf);
        if (!ok) {
            // 버퍼가 꽉 차면 drain 까지 대기 함
            // events 모듈의 once(emitter, event) -> 해당 이벤트를 한 번만 기다렸다가 Promise로 대기
            await once(res, "drain");
        }
    }
    res.end("done");
}

// === 실험 3 : pipeline () 사용 ===
function backpressurePipeline(_req, res) {
    // 파일을 스트림(읽기) 으로 연다 -> 조각 내서 메모리 아껴서 전송
    // highWaterMark : 내부 버퍼의 한 번에 읽는 최대 바이트 : (기본 ~ 64KB)
    // 너무 크면 메모리 사용이 커짐, 너무 작으면 시스템 호출이 잦아 오버헤드 높아짐.
    const src = createReadStream(bigFile, {highWaterMark: 64 * 1024});
    res.setHeader("content-type", "application/octet-stream");
    pipeline(src, res, (err) => {
        if (err) {
            console.error("pipeline error:", err);
            // 응답 스트림/소켓을 강제 종료
            // 에러가 생겼거나, 더 이상 전송이 의미 없을 때 리소스 즉시 해제
            res.destroy(err);
        }
    });
}

// === 실험 4 : pipe() t사용 ===
function backpressurePipe(_req, res) {
    const src = createReadStream(bigFile, {highWaterMark: 64 * 1024});
    res.setHeader("content-type", "application/octet-stream");
    const stream = src.pipe(res);

    // 에러/ 리소스 정리
    // Node 스트림/ 소켓은 EventEmitter 기반이라 이벤트를 발행함
    src.on("error", (e) => res.destroy(e)); // 읽기 에러
    stream.on("error", (e) => res.destroy(e)); // 쓰기 에러
    res.on("close", () => src.destroy()); // 클라 끊으면 읽기 중단
}

const server = http.createServer((req, res) => {
    try {
        switch (req.url) {
            case "/bad-case" :
                ignoreBackPressureCase(req, res).catch((err) => {
                    console.error("bad-case error", err);
                    res.destroy(err);
                });
                return;
            case "/drain" :
                backpressureDrain(req, res).catch((err) => {
                    console.error('drain error', err);
                    res.destroy(err);
                });
                return;
            case "/pipeline":
                return void backpressurePipeline(req, res);
            case "/pipe":
                return void backpressurePipe(req, res);
            default:
                // 응답의 상태 코드/헤더를 설정
                // res.write() 는 바디를 쓰는 함수라 상태/헤더 설정요이 아님
                res.writeHead(200, {"content-type": "text/plain; charset=utf-8"});
                res.end("Endpoints: /bad-case /drain /pipeline /pipe\n");
        }
    } catch (err) {
        console.error('server error', err);
        res.destroy(err);
    }
});

// 이벤트 루프 지연 (EventLoop Lag) + 메모리
let last = performance.now();
setInterval(()=>{
    const now = performance.now();
    const lag = now - last - 100; // 기대 간격 100ms 대비 초과분 = ELU lag
    if(lag > 50 )console.warn("lag",Math.round(lag),"ms");
    last = now;

    const m = process.memoryUsage();
    console.log(
        "[mem]",
        "rss=" + Math.round(m.rss / 1024 / 1024) + "MB",
        "heapUsed=" + Math.round(m.heapUsed / 1024 / 1024) + "MB"
    );
    // .unref() 이 타이머가 프로세스 종료를 막지 않도록
},1000).unref();

server.listen(3000,() =>{
    console.log("Server running on http://localhost:3000");
});