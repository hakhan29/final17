const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const expressionDiv = document.getElementById('expression');

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

video.addEventListener('play', () => {
    const interval = setInterval(async () => {
        // Canvas에 비디오 프레임 그리기
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections.length > 0) {
            const expressions = detections[0].expressions;
            const highestExpression = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b
            );

            // 감정별 색상 정의
            const emotionColors = {
                anger: 'rgba(255, 0, 0, 0.3)',
                happy: 'rgba(255, 255, 0, 0.3)',
                sad: 'rgba(0, 0, 255, 0.3)',
                neutral: 'rgba(128, 128, 128, 0.3)',
                surprised: 'rgba(255, 165, 0, 0.3)',
                fear: 'rgba(128, 0, 128, 0.3)',
            };

            // 색상 틴트 추가
            ctx.fillStyle = emotionColors[highestExpression] || 'rgba(255, 255, 255, 0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 텍스트 업데이트 (페이드 효과)
            if (expressionDiv.textContent !== `Detected Expression: ${highestExpression}`) {
                expressionDiv.style.opacity = 0; // 페이드 아웃
                setTimeout(() => {
                    expressionDiv.textContent = `Detected Expression: ${highestExpression}`;
                    expressionDiv.style.opacity = 1; // 페이드 인
                }, 500);
            }
        } else {
            if (expressionDiv.textContent !== 'No face detected') {
                expressionDiv.style.opacity = 0;
                setTimeout(() => {
                    expressionDiv.textContent = 'No face detected';
                    expressionDiv.style.opacity = 1;
                }, 500);
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 초기화
        }
    }, 100);
});
