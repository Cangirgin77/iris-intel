// api/analyze.js
export default async function handler(req, res) {
  // CORS Ayarları
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Sadece POST kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    // Request body'den veri al
    const { brand, industry } = req.body;
    
    // Validasyon
    if (!brand || !industry) {
      return res.status(400).json({ 
        error: 'Marka ve Sektör zorunludur.',
        received: { brand, industry }
      });
    }
    
    // API Key kontrolü
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server Konfigürasyon Hatası: API Key yok.' });
    }
    
    // Gemini Prompt
    const SYSTEM_INSTRUCTION = `Sen Iris, Yapay Zeka Görünürlük Analisti'sin. Görevin: Markaların yapay zeka platformlarında (ChatGPT, Gemini, Claude vb.) ne kadar görünür olduğunu analiz etmek ve iyileştirme önerileri sunmak.

MARKA: ${brand}
SEKTÖR: ${industry}

DETAYLI ANALİZ KRİTERLERİ:
1. YAPAY ZEKA GÖRÜNÜRLÜK SKORU (0-100):
   - AI platformlarında marka bilinirliği
   - Doğru sektör algısı
   - Rakiplere göre konumlanma
   - Dijital içerik kalitesi ve SEO

2. KİMLİK UYUMU:
   - Kullanıcının beyan ettiği sektör ile AI'ların algısı karşılaştırması
   - Eğer uyumsuzluk varsa "ALGI SAPMASI" uyarısı ver

3. RAKİP ANALİZİ:
   - Direkt rakipler (aynı segmentte, en az 3 tane)
   - Sektör liderleri (en görünür markalar, en az 3 tane)

4. İYİLEŞTİRME ÖNERİLERİ:
   - Yapay zeka platformlarında daha görünür olmak için somut adımlar
   - İçerik stratejisi önerileri
   - SEO ve dijital varlık tavsiyeleri

ÖNEMLİ: Sadece JSON formatında yanıt ver, başka hiçbir metin EKLEME!

JSON ÇIKTI ŞEMASI:
{
  "score": (0-100 arası sayı),
  "scoreExplanation": (2-3 cümle: Skoru etkileyen ana faktörler),
  "identityAnalysis": {
    "claimedSector": (str - kullanıcının girdiği sektör),
    "detectedSector": (str - AI'ların algıladığı sektör, detaylı açıklama),
    "matchStatus": ("EŞLEŞME DOĞRULANDI" | "ALGI SAPMASI" | "Yetersiz Veri"),
    "insight": (2-3 cümle detaylı açıklama)
  },
  "competitors": {
    "direct": [
      {"name": "Rakip Marka", "status": "Kısa açıklama"},
      {"name": "Rakip Marka 2", "status": "Kısa açıklama"},
      {"name": "Rakip Marka 3", "status": "Kısa açıklama"}
    ],
    "leaders": [
      {"name": "Lider Marka", "status": "Neden lider"},
      {"name": "Lider Marka 2", "status": "Neden lider"},
      {"name": "Lider Marka 3", "status": "Neden lider"}
    ]
  },
  "strategicSummary": (3-4 cümle: Genel durum özeti ve öncelikli alan),
  "strengths": [
    (str - güçlü yön 1),
    (str - güçlü yön 2),
    (str - güçlü yön 3)
  ],
  "weaknesses": [
    (str - zayıf yön 1),
    (str - zayıf yön 2),
    (str - zayıf yön 3)
  ],
  "optimization": {
    "objective": (str - ana hedef),
    "rationale": (2-3 cümle - neden bu hedef önemli),
    "text": (4-5 madde halinde SOMUT adımlar, her madde yeni satırda)
  },
  "platforms": [
    {"name": "Gemini", "status": "Analiz Edildi"},
    {"name": "ChatGPT", "status": "Simüle Edildi"},
    {"name": "Claude", "status": "Tarandı"}
  ],
  "geminiRawResponse": (str - Kısa bir genel değerlendirme paragrafı, 2-3 cümle)
}`;
    
    // Gemini API isteği
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: SYSTEM_INSTRUCTION }] }],
          generationConfig: { 
            response_mime_type: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );
    
    const data = await response.json();
    
    // Hata kontrolü
    if (!data.candidates || !data.candidates[0]?.content) {
      throw new Error(data.error?.message || "Gemini boş cevap döndü.");
    }
    
    const resultText = data.candidates[0].content.parts[0].text;
    
    // JSON parse
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error("JSON Parse Hatası:", resultText);
      throw new Error("Gemini'den gelen yanıt JSON formatında değil.");
    }
    
    // Fallback değerler
    if (!parsedResult.scoreExplanation) {
      parsedResult.scoreExplanation = `Skor ${parsedResult.score}/100: ${parsedResult.strategicSummary?.substring(0, 100) || 'Analiz tamamlandı'}...`;
    }
    
    if (!parsedResult.geminiRawResponse) {
      parsedResult.geminiRawResponse = parsedResult.strategicSummary || "Gemini AI değerlendirmesi tamamlandı.";
    }
    
    // Başarılı yanıt
    res.status(200).json(parsedResult);
    
  } catch (error) {
    console.error("Backend Hatası:", error);
    res.status(500).json({ 
      error: error.message || 'Analiz sırasında sunucu hatası.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
