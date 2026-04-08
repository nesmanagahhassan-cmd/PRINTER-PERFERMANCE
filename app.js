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
// دالة لتحسين الصورة قبل تحليلها (تحويلها لأبيض وأسود عالي التباين)
function preprocessImage(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // تحويل للرمادي
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        // زيادة التباين (Thresholding)
        const v = (avg > 120) ? 255 : 0; 
        data[i] = data[i+1] = data[i+2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

// تعديل دالة التقاط الصورة
captureBtn.addEventListener('click', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // تحسين الصورة قبل إرسالها
    const enhancedImage = preprocessImage(canvas);
    
    document.getElementById('camera-section').classList.add('hidden');
    document.getElementById('report-section').classList.remove('hidden');
    document.getElementById('model-name').innerText = "جاري التحليل العميق...";

    analyzeImage(enhancedImage);
});

async function analyzeImage(imageData) {
    try {
        // استخدام إعدادات متقدمة للمكتبة
        const worker = await Tesseract.createWorker('eng');
        const ret = await worker.recognize(imageData);
        const text = ret.data.text.toLowerCase();
        await worker.terminate();

        console.log("النص الذي رآه التطبيق:", text); // انظر هنا في Console لتعرف ماذا يقرأ

        // قاموس أوسع للمصطلحات
        const db = [
            { id: 'jam', keywords: ['jam', 'paper', 'path', 'roll', 'e0', 'e1', 'e3'], title: 'حشر ورق', steps: ['افتح الباب الخلفي', 'اسحب الورقة برفق', 'نظف البكرات'] },
            { id: 'ink', keywords: ['ink', 'toner', 'cartridge', 'low', 'empty', 'level', 'supply'], title: 'مشكلة في الحبر', steps: ['هز عبوة الحبر', 'استبدل العبوة الفارغة', 'نظف الرأس'] },
            { id: 'error', keywords: ['error', 'code', 'ox', 'fatal', 'service'], title: 'خطأ برمجي عام', steps: ['أطفئ الطابعة لدقيقتين', 'افصل كابل الطاقة', 'أعد التشغيل'] }
        ];

        let foundError = db.find(item => item.keywords.some(key => text.includes(key)));
        let foundModel = text.match(/(hp|canon|epson|brother)\s?[a-z0-9]*/g) || ["طابعة غير معروفة"];

        if (foundError) {
            displayReport(foundModel[0].toUpperCase(), foundError.title, foundError.steps);
        } else {
            // إذا فشل الذكاء الاصطناعي، نعطيه خيار البحث اليدوي
            document.getElementById('model-name').innerText = "لم نتمكن من القراءة بوضوح";
            document.getElementById('error-desc').innerText = "النص المقروء غير مفهوم: " + text.substring(0, 20);
            document.getElementById('steps-list').innerHTML = "<li>حاول التصوير في إضاءة أفضل</li><li>تأكد من وضع النص داخل الإطار</li>";
        }

    } catch (err) {
        console.error(err);
    }
}