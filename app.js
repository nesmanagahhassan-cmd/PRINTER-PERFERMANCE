const video = document.getElementById('video');
const startBtn = document.getElementById('start-camera');
const captureBtn = document.getElementById('capture');
const reportSection = document.getElementById('report-section');

// 1. فتح الكاميرا
startBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        document.getElementById('home').classList.add('hidden');
        document.getElementById('camera-section').classList.remove('hidden');
    } catch (err) {
        alert("يرجى السماح بالوصول للكاميرا");
    }
});

// 2. التقاط الصورة والتعرف على النص (OCR)
captureBtn.addEventListener('click', () => {
    const canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/png');
    
    // إيقاف الكاميرا
    video.srcObject.getTracks().forEach(track => track.stop());
    document.getElementById('camera-section').classList.add('hidden');
    reportSection.classList.remove('hidden');

    analyzeImage(imageData);
});

// 3. تحليل الصورة باستخدام Tesseract.js
async function analyzeImage(image) {
    const result = await Tesseract.recognize(image, 'eng');
    const text = result.data.text.toLowerCase();
    
    // منطق بسيط للذكاء الاصطناعي (يمكن استبداله بـ OpenAI API أو TensorFlow)
    let model = "غير معروف";
    let error = "لم يتم تحديد المشكلة بدقة";
    let steps = ["تأكد من توصيل الكابلات", "أعد تشغيل الطابعة"];

    if(text.includes("hp")) model = "HP Laserjet";
    if(text.includes("canon")) model = "Canon Pixma";
    
    if(text.includes("jam") || text.includes("paper")) {
        error = "حشر ورق (Paper Jam)";
        steps = ["افتح الباب الخلفي", "اسحب الورقة ببطء", "تأكد من درج الورق"];
    } else if(text.includes("ink") || text.includes("toner")) {
        error = "نفاد الحبر (Low Ink)";
        steps = ["افتح غطاء الحبر", "استبدل الكارتريدج", "نظف رؤوس الطباعة"];
    }

    displayReport(model, error, steps);
}

// 4. عرض التقرير
function displayReport(model, error, steps) {
    document.getElementById('model-name').innerText = model;
    document.getElementById('error-desc').innerText = error;
    
    const list = document.getElementById('steps-list');
    list.innerHTML = "";
    steps.forEach(step => {
        const li = document.createElement('li');
        li.innerText = step;
        list.appendChild(li);
    });

    // توليد رابط يوتيوب
    const query = encodeURIComponent(`${model} ${error} solution`);
    document.getElementById('youtube-link').href = `https://www.youtube.com/results?search_query=${query}`;
}