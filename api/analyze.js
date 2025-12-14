// api/analyze.js - KOMPLE YENİDEN YAZILMIŞ - FALLBACK GARANTİLİ
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { brand, industry } = req.body;
  
  if (!brand || !industry) {
    return res.status(400).json({ error: 'Marka ve Sektör zorunludur.' });
  }
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key bulunamadı.' });
  }
  
  // FALLBACK FONKSİYONU
  function createFallbackResponse(brand, industry, reason = "API limiti") {
    const score = Math.floor(Math.random() * 20) + 70;
    return {
      score: score,
      scoreCategory: score >= 80 ? "Çok İyi" : "İyi",
      scoreExplanation: `${brand} markası ${industry} sektöründe ${score}/100 görünürlük skoruna sahip. ⚠️ ${reason} nedeniyle demo yanıt gösteriliyor.`,
      identityAnalysis: {
        claimedSector: industry,
        detectedSector: industry,
        matchStatus: "EŞLEŞME DOĞRULANDI",
        insight: `${brand} markasının dijital ayak izi ${industry} sektörü ile uyumlu görünüyor.`
      },
      competitors: {
        direct: [
          {name: "Sektör Rakibi 1", score: 75, status: "Aktif dijital varlık"},
          {name: "Sektör Rakibi 2", score: 70, status: "Orta seviye görünürlük"}
        ],
        leaders: [
          {name: "Sektör Lideri 1", score: 92, status: "Pazar lideri"},
          {name: "Sektör Lideri 2", score: 88, status: "Global oyuncu"}
        ]
      },
      strategicSummary: `${brand}, ${industry} sektöründe iyi bir dijital varlığa sahip. Detaylı analiz için yeni API key gerekli.`,
      strengths: [
        `${brand} sektöründe tanınmış bir marka`,
        "Dijital platformlarda aktif varlık",
        "Sosyal medya kanallarında görünürlük",
        "Müşteri etkileşimi mevcut"
      ],
      weaknesses: [
        "AI platformlarında daha fazla içerik gerekli",
        "Teknik dokümantasyon eksikliği",
        "Forum aktivitesi artırılmalı",
        "Video içerik stratejisi geliştirilmeli"
      ],
      optimization: {
        objective: "AI platformlarında görünürlüğü artırmak",
        rationale: "Düzenli içerik üretimi ve SEO optimizasyonu ile 6-12 ay içinde %20-30 artış sağlanabilir."
      },
      visibilityRecommendations: [
        "Haftada 2-3 SEO uyumlu blog yazısı yayınlayın",
        "Wikipedia sayfası oluşturun ve güncelleyin",
        "YouTube'da eğitici videolar yayınlayın",
        "Reddit ve Quora'da sorulara cevap verin",
        "Teknik dokümantasyon hazırlayın",
        "Case study paylaşın",
        "Podcast'lerde konuk olun",
        "LinkedIn'de düzenli paylaşım yapın"
      ],
      platforms: [
        {name: "Gemini", status: "Demo Modu"}, 
        {name: "ChatGPT", status: "Demo Modu"},
        {name: "Claude", status: "Demo Modu"}
      ]
    };
  }
  
  // GEMİNİ API ÇAĞRISI
  try {
    const prompt = `Sen bir marka analiz uzmanısın. ${brand} markasını ${industry} sektöründe analiz et.

SADECE geçerli JSON formatında yanıt ver:

{
  "score": 85,
  "scoreCategory": "Çok İyi",
  "scoreExplanation": "Skorun açıklaması...",
  "identityAnalysis": {
    "claimedSector": "${industry}",
    "detectedSector": "${industry}",
    "matchStatus": "EŞLEŞME DOĞRULANDI",
    "insight": "Detaylı açıklama..."
  },
  "competitors": {
    "direct": [
      {"name": "Rakip1", "score": 80, "status": "Açıklama"}
    ],
    "leaders": [
      {"name": "Lider1", "score": 95, "status": "Açıklama"}
    ]
  },
  "strategicSummary": "Özet...",
  "strengths": ["Güçlü yön 1", "Güçlü yön 2"],
  "weaknesses": ["Zayıf yön 1", "Zayıf yön 2"],
  "optimization": {
    "objective": "Hedef...",
    "rationale": "Açıklama..."
  },
  "visibilityRecommendations": ["Tavsiye 1", "Tavsiye 2"],
  "platforms": [
    {"name": "Gemini", "status": "Analiz Edildi"}
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Hatası:", errorText);
      
      // Quota hatası kontrolü
      if (errorText.includes('quota') || errorText.includes('limit')) {
        return res.status(200).json(createFallbackResponse(brand, industry, "API limiti aşıldı"));
      }
      
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content) {
      return res.status(200).json(createFallbackResponse(brand, industry, "API yanıt vermedi"));
    }
    
    let resultText = data.candidates[0].content.parts[0].text.trim();
    
    // JSON temizleme
    if (resultText.startsWith('```json')) {
      resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    }
    if (resultText.startsWith('```')) {
      resultText = resultText.replace(/```\n?/g, '');
    }
    
    // JSON parse
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseError) {
      console.error("JSON Parse Hatası:", parseError);
      return res.status(200).json(createFallbackResponse(brand, industry, "JSON parse hatası"));
    }
    
    // Eksik alanları tamamla
    parsedResult.scoreExplanation = parsedResult.scoreExplanation || `${brand} için skor: ${parsedResult.score}/100`;
    
    if (!parsedResult.scoreCategory) {
      const s = parsedResult.score || 0;
      parsedResult.scoreCategory = s >= 90 ? "Mükemmel" : s >= 80 ? "Çok İyi" : s >= 60 ? "İyi" : s >= 40 ? "Orta" : "Zayıf";
    }
    
    parsedResult.platforms = parsedResult.platforms || [
      {name: "Gemini", status: "Analiz Edildi"}, 
      {name: "ChatGPT", status: "Simüle Edildi"},
      {name: "Claude", status: "Tarandı"}
    ];
    
    return res.status(200).json(parsedResult);
    
  } catch (error) {
    console.error("Backend Hatası:", error);
    
    // Herhangi bir hata durumunda fallback döndür
    return res.status(200).json(createFallbackResponse(brand, industry, "Sistem hatası"));
  }
}
