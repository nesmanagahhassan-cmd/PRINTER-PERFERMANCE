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
    const reportSection = document.getElementById('report-section');
    const modelSpan = document.getElementById('model-name');
    const errorSpan = document.getElementById('error-desc');
    
    modelSpan.innerText = "جاري القراءة...";
    
    try {
        // البدء بالتعرف على النص
        const result = await Tesseract.recognize(image, 'eng', {
            logger: m => console.log(m) // لمراقبة التقدم في الـ Console
        });

        const fullText = result.data.text.toLowerCase();
        console.log("النص المستخرج: ", fullText); // سيظهر لك في المتصفح ماذا قرأ فعلياً

        // مصفوفات للكلمات الدلالية (Keywords) لزيادة دقة التوقع
        const brandKeywords = {
            'HP LaserJet': ['hp', 'laserjet', 'hewlett', 'p1102', 'm15w', 'p2035'],
            'Canon Pixma': ['canon', 'pixma', 'g3411', 'mg2540', 'ts3140'],
            'Epson EcoTank': ['epson', 'ecotank', 'l3150', 'l3110'],
            'Brother': ['brother', 'dcp', 'mfc']
        };

        const errorKeywords = {
            'حشر ورق (Paper Jam)': ['jam', 'paper', 'path', 'blocked', 'e03', 'e3'],
            'نفاد الحبر أو التونر': ['ink', 'toner', 'cartridge', 'empty', 'low', 'e01', 'level'],
            'خطأ في التعريف / الاتصال': ['offline', 'driver', 'connection', 'usb', 'wifi'],
            'مشكلة في الماسح الضوئي': ['scanner', 'scan', 'copy', 'flatbed']
        };

        let detectedModel = "موديل غير معروف - يرجى تقريب الكاميرا";
        let detectedError = "لم يتم تحديد المشكلة - حاول تصوير رسالة الخطأ بوضوح";
        let steps = ["تأكد من إضاءة الغرفة", "قرب الكاميرا من ملصق الموديل أو شاشة الخطأ", "أعد المحاولة"];

        // البحث عن الموديل بطريقة مرنة
        for (let [brand, keys] of Object.entries(brandKeywords)) {
            if (keys.some(key => fullText.includes(key))) {
                detectedModel = brand;
                break;
            }
        }

        // البحث عن الخطأ بطريقة مرنة
        for (let [errorName, keys] of Object.entries(errorKeywords)) {
            if (keys.some(key => fullText.includes(key))) {
                detectedError = errorName;
                // تعيين خطوات حل مخصصة بناءً على الخطأ
                if (errorName.includes('حشر')) steps = ["افتح غطاء الطابعة", "اسحب الورقة العالقة برفق", "تأكد من نظافة المسار"];
                if (errorName.includes('الحبر')) steps = ["تأكد من مستوى الحبر", "هز عبوة الحبر برفق", "استبدل العبوة الفارغة"];
                break;
            }
        }

        // عرض النتائج
        displayReport(detectedModel, detectedError, steps);

    } catch (error) {
        console.error("خطأ في التحليل:", error);
        modelSpan.innerText = "خطأ في الاتصال بالذكاء الاصطناعي";
    }
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