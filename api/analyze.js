// api/analyze.js - ÇALIŞAN VERSİYON (İLK HALİ)
export default async function handler(req, res) {
  // CORS Ayarları
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const { brand, industry } = req.body;
    
    if (!brand || !industry) {
      return res.status(400).json({ error: 'Marka ve Sektör zorunludur.' });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server Konfigürasyon Hatası: API Key yok.' });
    }
    
    const SYSTEM_INSTRUCTION = `
    Sen Iris, Gemini Teknolojisiyle çalışan en gelişmiş Marka İstihbarat Analistisin.
    Görevin: Markayı DETAYLI analiz etmek ve sadece aşağıdaki JSON formatında çıktı vermek. Başka hiçbir şey yazma.
    
    KURALLAR:
    1. GERÇEKLİK: Marka hakkında yeterli veri yoksa dürüstçe "Yetersiz Veri" de.
    2. KİMLİK KONTROLÜ: Kullanıcının beyanı ile dijital ayak izi uyuşmuyorsa "ALGI SAPMASI" uyarısı ver.
    3. FORMAT: Sadece geçerli JSON döndür.
    4. DETAY: Her bölümü mümkün olduğunca detaylı ve açıklayıcı yaz.
    
    Marka: ${brand}
    Sektör: ${industry}
    
    JSON ŞEMASI:
    {
      "score": (0-100 arası sayı. Dijital görünürlük ve algı skoru),
      "scoreCategory": (str. "Zayıf" | "Orta" | "İyi" | "Çok İyi" | "Mükemmel"),
      "scoreExplanation": (str. Skorun nedenini 2-3 cümlede DETAYLI açıkla),
      "identityAnalysis": {
        "claimedSector": (str),
        "detectedSector": (str),
        "matchStatus": ("EŞLEŞME DOĞRULANDI" | "ALGI SAPMASI" | "Yetersiz Veri"),
        "insight": (str. 3-4 cümle DETAYLI açıklama)
      },
      "competitors": {
        "direct": [
          {"name": "str", "score": (0-100 sayı), "status": "str. Kısa açıklama"},
          {"name": "str", "score": (0-100 sayı), "status": "str"},
          {"name": "str", "score": (0-100 sayı), "status": "str"}
        ],
        "leaders": [
          {"name": "str", "score": (0-100 sayı), "status": "str. Neden lider?"},
          {"name": "str", "score": (0-100 sayı), "status": "str"},
          {"name": "str", "score": (0-100 sayı), "status": "str"}
        ]
      },
      "strategicSummary": (str. 4-5 cümle: Genel durum özeti ve öncelikli alan),
      "strengths": [
        (str. Güçlü yön 1 - DETAYLI),
        (str. Güçlü yön 2 - DETAYLI),
        (str. Güçlü yön 3 - DETAYLI),
        (str. Güçlü yön 4 - DETAYLI),
        (str. Güçlü yön 5 - DETAYLI),
        (str. Güçlü yön 6 - DETAYLI - opsiyonel)
      ],
      "weaknesses": [
        (str. Zayıf yön 1 - DETAYLI),
        (str. Zayıf yön 2 - DETAYLI),
        (str. Zayıf yön 3 - DETAYLI),
        (str. Zayıf yön 4 - DETAYLI),
        (str. Zayıf yön 5 - DETAYLI),
        (str. Zayıf yön 6 - DETAYLI - opsiyonel)
      ],
      "optimization": {
        "objective": (str. Ana hedef - DETAYLI),
        "rationale": (str. 3-4 cümle - neden bu hedef önemli)
      },
      "visibilityRecommendations": [
        (str. Tavsiye 1 - SOMUT ve UYGULANABILIR),
        (str. Tavsiye 2 - SOMUT ve UYGULANABILIR),
        (str. Tavsiye 3 - SOMUT ve UYGULANABILIR),
        (str. Tavsiye 4 - SOMUT ve UYGULANABILIR),
        (str. Tavsiye 5 - SOMUT ve UYGULANABILIR),
        (str. Tavsiye 6 - SOMUT ve UYGULANABILIR),
        (str. Tavsiye 7 - SOMUT ve UYGULANABILIR),
        (str. Tavsiye 8 - SOMUT ve UYGULANABILIR)
      ],
      "platforms": [
        {"name": "Gemini", "status": "Analiz Edildi"}, 
        {"name": "GPT-5", "status": "Simüle Edildi"},
        {"name": "Claude", "status": "Tarandı"}
      ]
    }`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SYSTEM_INSTRUCTION }] }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    });
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0].content) {
       throw new Error(data.error?.message || "Gemini boş cevap döndü.");
    }
    
    const resultText = data.candidates[0].content.parts[0].text;
    const parsedResult = JSON.parse(resultText);
    
    // scoreExplanation yoksa ekle
    if (!parsedResult.scoreExplanation) {
      parsedResult.scoreExplanation = `Skor ${parsedResult.score}/100: Analiz tamamlandı.`;
    }
    
    // scoreCategory yoksa ekle
    if (!parsedResult.scoreCategory) {
      const score = parsedResult.score || 0;
      if (score >= 90) parsedResult.scoreCategory = "Mükemmel";
      else if (score >= 80) parsedResult.scoreCategory = "Çok İyi";
      else if (score >= 60) parsedResult.scoreCategory = "İyi";
      else if (score >= 40) parsedResult.scoreCategory = "Orta";
      else parsedResult.scoreCategory = "Zayıf";
    }
    
    res.status(200).json(parsedResult);
    
  } catch (error) {
    console.error("Backend Hatası:", error);
    res.status(500).json({ error: error.message || 'Analiz sırasında sunucu hatası.' });
  }
}
