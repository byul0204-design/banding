// 배포할 때마다 바뀌는 값. CSS·JS 주소 뒤에 붙여 브라우저가 옛 파일을 쓰지 않게 함
export default { v: Date.now().toString(36) };
