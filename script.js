// script.js
lucide.createIcons();

const VERCEL_BACKEND_URL = "https://iris-intel.vercel.app/api/analyze";

const loadingMessages = [
    "🔍 AI platformları taranıyor...",
    "🤖 ChatGPT, Claude, Gemini sorgulanıyor...",
    "📊 Rakip analizi yapılıyor...",
    "💡 Detaylı öneriler hazırlanıyor...",
    "🎯 Veriler işleniyor..."
];

function showSection(id) {
    ['section-input', 'section-loading', 'section-results'].forEach(sec => {
        document.getElementById(sec).classList.add('hidden-section');
    });
    document.getElementById(id).classList.remove('hidden-section');
}

function resetApp() {
    document.getElementById('brandInput').value = '';
    document.getElementById('industryInput').value = '';
    showSection('section-input');
}

function copyOptText() {
    const text = document.getElementById('resOptText').innerText;
    navigator.clipboard.writeText(text);
    alert("✅ Metin kopyalandı!");
}

let loadingInterval;

async function startAnalysis() {
    const brand = document.getElementById('brandInput').value.trim();
    const industry = document.getElementById('industryInput').value.trim();

    if (!brand || !industry) {
        alert("⚠️ Lütfen marka ve sektör bilgilerini girin!");
        return;
    }

    showSection('section-loading');
    
    let i = 0;
    loadingInterval = setInterval(() => {
        document.getElementById('loadingText').innerText = loadingMessages[i % loadingMessages.length];
        i++;
    }, 2500);

    try {
        const response = await fetch(VERCEL_BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brand, industry }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Sunucu Hatası");
        }

        const data = await response.json();
        renderResults(data, brand, industry);

    } catch (error) {
        console.error("Hata:", error);
        alert("❌ Analiz başarısız: " + error.message);
        resetApp();
    } finally {
        clearInterval(loadingInterval);
    }
}

function renderResults(data, brand, industry) {
    document.getElementById('resBrandName').innerText = `${brand} | ${industry}`;
    
    const score = data.score || 0;
    document.getElementById('resScore').innerText = score;
    document.getElementById('scoreCircle').style.setProperty('--score', score);
    document.getElementById('resScoreExplanation').innerText = data.scoreExplanation || "Detaylı skor açıklaması hazırlanıyor...";
    
    if (score >= 90) {
        document.getElementById('scoreCategory').innerText = "Mükemmel";
        document.getElementById('scoreTarget').innerText = "95+";
        document.getElementById('scoreTime').innerText = "Sürekli çalışma";
    } else if (score >= 75) {
        document.getElementById('scoreCategory').innerText = "Çok İyi";
        document.getElementById('scoreTarget').innerText = "85+";
        document.getElementById('scoreTime').innerText = "3-6 ay";
    } else if (score >= 60) {
        document.getElementById('scoreCategory').innerText = "İyi";
        document.getElementById('scoreTarget').innerText = "75+";
        document.getElementById('scoreTime').innerText = "6-12 ay";
    } else if (score >= 40) {
        document.getElementById('scoreCategory').innerText = "Orta";
        document.getElementById('scoreTarget').innerText = "60+";
        document.getElementById('scoreTime').innerText = "9-18 ay";
    } else {
        document.getElementById('scoreCategory').innerText = "Gelişim";
        document.getElementById('scoreTarget').innerText = "50+";
        document.getElementById('scoreTime').innerText = "12-24 ay";
    }
    
    document.getElementById('resClaimedSector').innerText = data.identityAnalysis?.claimedSector || industry;
    document.getElementById('resDetectedSector').innerText = data.identityAnalysis?.detectedSector || industry;
    
    const matchStatus = document.getElementById('resMatchStatus');
    const indicator = document.getElementById('matchIndicator');
    const status = data.identityAnalysis?.matchStatus || "EŞLEŞME DOĞRULANDI";
    matchStatus.innerText = status;
    
    if (status.includes("SAPMA") || status.includes("Yetersiz")) {
        matchStatus.className = "text-[9px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-900";
        indicator.className = "absolute top-0 left-0 w-1 h-full bg-rose-600";
    } else {
        matchStatus.className = "text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900";
        indicator.className = "absolute top-0 left-0 w-1 h-full bg-emerald-500";
    }
    
    const insightSpan = document.getElementById('resInsight').querySelector('span');
    if (insightSpan) {
        insightSpan.innerText = data.identityAnalysis?.insight || "AI algı analizi tamamlandı.";
    }

    const platformsDiv = document.getElementById('resPlatforms');
    platformsDiv.innerHTML = "";
    (data.platforms || [
        {name: "Gemini", status: "Analiz Edildi"},
        {name: "ChatGPT", status: "Simüle Edildi"},
        {name: "Claude", status: "Tarandı"}
    ]).forEach(p => {
        platformsDiv.innerHTML += `
            <div class="flex items-center justify-between text-sm p-2 bg-slate-800/50 rounded border border-slate-700">
                <span class="text-xs font-semibold text-slate-300">${p.name}</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">${p.status}</span>
            </div>`;
    });

    document.getElementById('resSummary').innerText = data.strategicSummary || "Stratejik özet hazırlanıyor...";
    
    const strList = document.getElementById('resStrengths');
    strList.innerHTML = "";
    (data.strengths || ["Yükleniyor..."]).forEach(s => {
        strList.innerHTML += `<li class="flex items-start gap-2"><span class="text-emerald-500 shrink-0">•</span><span>${s}</span></li>`;
    });
    
    const weakList = document.getElementById('resWeaknesses');
    weakList.innerHTML = "";
    (data.weaknesses || ["Yükleniyor..."]).forEach(w => {
        weakList.innerHTML += `<li class="flex items-start gap-2"><span class="text-rose-500 shrink-0">•</span><span>${w}</span></li>`;
    });

    const compList = document.getElementById('resCompetitors');
    compList.innerHTML = "";
    
    if (data.competitors?.direct && data.competitors.direct.length > 0) {
        compList.innerHTML += `<p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">DOĞRUDAN RAKİPLER</p>`;
        data.competitors.direct.forEach(c => {
            compList.innerHTML += `
                <div class="flex justify-between text-sm p-3 bg-slate-800/50 rounded border border-slate-700 mb-2">
                    <span class="font-semibold text-slate-300 text-xs">${c.name}</span>
                    <span class="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">${c.status}</span>
                </div>`;
        });
    }
    
    if (data.competitors?.leaders && data.competitors.leaders.length > 0) {
        compList.innerHTML += `<p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">PAZAR LİDERLERİ</p>`;
        data.competitors.leaders.forEach(c => {
            compList.innerHTML += `
                <div class="flex justify-between text-sm p-3 bg-slate-800/50 rounded border border-slate-700 mb-2">
                    <span class="font-semibold text-slate-300 text-xs">${c.name}</span>
                    <span class="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">${c.status}</span>
                </div>`;
        });
    }

    document.getElementById('resOptRationale').innerText = `HEDEF: ${data.optimization?.objective || "Belirleniyor..."}\n\nANALİZ: ${data.optimization?.rationale || "Hazırlanıyor..."}`;
    document.getElementById('resOptText').innerText = data.optimization?.text || "Optimizasyon metni yükleniyor...";
    
    document.getElementById('resGeminiResponse').innerText = data.geminiRawResponse || data.scoreExplanation || "Gemini AI'ın detaylı değerlendirmesi burada görünecek...";

    lucide.createIcons();
    showSection('section-results');
    setTimeout(() => document.getElementById('section-results').scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}
