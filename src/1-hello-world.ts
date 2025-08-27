import http from "http"

/**
 * 내장 http로 “ok” 반환 서버. 프레임워크 금지.
 * 통과 기준: npm run bench에서 에러 0, RPS 숫자와 p95 기록.
 */
const server = http.createServer((_,res)=>{
    res.end('ok');
})

server.listen(3000);