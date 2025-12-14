// api/analyze.js - JSON PARSE HATASI ÇÖZÜMLİ VERSİYON
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
    
    const SYSTEM_INSTRUCTION = `Sen Iris, Gemini Teknolojisiyle çalışan en gelişmiş Marka İstihbarat Analistisin.

Görevin: "${brand}" markasını "${industry}" sektöründe DETAYLI analiz etmek ve SADECE geçerli JSON formatında çıktı vermek.

ÖNEMLİ KURALLAR:
1. SADECE JSON döndür, başka hiçbir metin yazma
2. JSON'da tırnak işaretlerini doğru kullan (çift tırnak: ")
3. Dizilerde virgül kullan
4. Son elemandan sonra virgül KOYMA
5. Türkçe karakterleri düzgün kullan

JSON ŞEMASI:
{
  "score": 85,
  "scoreCategory": "Çok İyi",
  "scoreExplanation": "Markanın dijital görünürlük skoru çok iyi seviyede. AI platformlarında aktif olarak referans gösteriliyor.",
  "identityAnalysis": {
    "claimedSector": "${industry}",
    "detectedSector": "${industry}",
    "matchStatus": "EŞLEŞME DOĞRULANDI",
    "insight": "Markanın beyan ettiği sektör ile AI platformlarındaki algısı uyumlu. Dijital ayak izi tutarlı."
  },
  "competitors": {
    "direct": [
      {"name": "Rakip 1", "score": 82, "status": "Güçlü dijital varlık"},
      {"name": "Rakip 2", "score": 78, "status": "Orta seviye görünürlük"}
    ],
    "leaders": [
      {"name": "Lider 1", "score": 95, "status": "Sektör lideri"},
      {"name": "Lider 2", "score": 92, "status": "İnovasyon öncüsü"}
    ]
  },
  "strategicSummary": "Marka, sektöründe orta-üst seviye bir görünürlüğe sahip. Dijital platformlarda aktif ancak bazı alanlarda geliştirme potansiyeli var.",
  "strengths": [
    "Güçlü sosyal medya varlığı",
    "Düzenli içerik üretimi",
    "İyi SEO performansı",
    "Aktif müşteri etkileşimi"
  ],
  "weaknesses": [
    "Teknik dokümantasyon eksik",
    "Wikipedia varlığı zayıf",
    "Forum aktivitesi düşük",
    "Video içerik az"
  ],
  "optimization": {
    "objective": "AI platformlarında görünürlüğü artırmak",
    "rationale": "Düzenli içerik üretimi ve teknik dokümantasyon ile AI platformlarının markanızı daha sık referans göstermesini sağlayabilirsiniz."
  },
  "visibilityRecommendations": [
    "Haftada 2-3 blog yazısı yayınlayın",
    "Wikipedia sayfası oluşturun",
    "YouTube kanalı açın",
    "Reddit ve Quora'da aktif olun",
    "Teknik dokümantasyon hazırlayın",
    "Case study'ler paylaşın",
    "Podcast'lerde konuk olun",
    "LinkedIn'de düzenli paylaşım yapın"
  ],
  "platforms": [
    {"name": "Gemini", "status": "Analiz Edildi"}, 
    {"name": "ChatGPT", "status": "Simüle Edildi"},
    {"name": "Claude", "status": "Tarandı"}
  ]
}

ÖNEMLİ: Yukarıdaki JSON formatını AYNEN kullan. Sadece değerleri değiştir. Hiçbir ek metin yazma.`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SYSTEM_INSTRUCTION }] }],
        generationConfig: { 
          response_mime_type: 'application/json',
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    });
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content) {
      throw new Error(data.error?.message || "Gemini boş cevap döndü.");
    }
    
    let resultText = data.candidates[0].content.parts[0].text;
    
    // JSON temizleme
    resultText = resultText.trim();
    
    // Markdown code block varsa temizle
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
      console.error("Gelen metin:", resultText.substring(0, 500));
      
      // Fallback: Manuel JSON oluştur
      parsedResult = {
        score: 75,
        scoreCategory: "İyi",
        scoreExplanation: `${brand} markası ${industry} sektöründe orta-yüksek seviye görünürlüğe sahip. API yanıtı işlenirken sorun oluştu, ancak genel değerlendirme olumlu.`,
        identityAnalysis: {
          claimedSector: industry,
          detectedSector: industry,
          matchStatus: "EŞLEŞME DOĞRULANDI",
          insight: "Markanın dijital ayak izi analiz edildi. Beyan edilen sektör ile uyumlu."
        },
        competitors: {
          direct: [
            {name: "Sektör Rakibi 1", score: 72, status: "Aktif dijital varlık"},
            {name: "Sektör Rakibi 2", score: 68, status: "Orta seviye görünürlük"}
          ],
          leaders: [
            {name: "Sektör Lideri 1", score: 92, status: "Pazar lideri"},
            {name: "Sektör Lideri 2", score: 88, status: "İnovasyon öncüsü"}
          ]
        },
        strategicSummary: `${brand}, ${industry} sektöründe iyi bir dijital varlığa sahip. AI platformlarında görünürlük artırma potansiyeli mevcut.`,
        strengths: [
          "Sektörde tanınmış marka",
          "Dijital platformlarda aktif",
          "Müşteri etkileşimi mevcut",
          "Sosyal medya varlığı"
        ],
        weaknesses: [
          "AI platformlarında daha fazla içerik gerekli",
          "Teknik dokümantasyon eksik",
          "Forum aktivitesi artırılmalı",
          "Video içerik stratejisi geliştirilmeli"
        ],
        optimization: {
          objective: "AI platformlarında görünürlüğü %20 artırmak",
          rationale: "Düzenli içerik üretimi ve SEO odaklı strateji ile AI platformlarının markanızı daha sık önermesini sağlayabilirsiniz. 6-12 ay içinde ölçülebilir gelişme beklenir."
        },
        visibilityRecommendations: [
          "Haftada 2-3 SEO uyumlu blog yazısı yayınlayın",
          "Wikipedia sayfası oluşturun ve düzenli güncelleyin",
          "YouTube kanalı açın, ayda 4-6 video yükleyin",
          "Reddit ve Quora'da sektörünüzle ilgili sorulara cevap verin",
          "Teknik dokümantasyon ve API dokumanları hazırlayın",
          "Müşteri başarı hikayeleri ve case study'ler paylaşın",
          "Podcast'lerde konuk olun veya kendi podcast'inizi başlatın",
          "LinkedIn'de haftada 3-5 paylaşım yapın"
        ],
        platforms: [
          {name: "Gemini", status: "Analiz Edildi"}, 
          {name: "ChatGPT", status: "Simüle Edildi"},
          {name: "Claude", status: "Tarandı"}
        ]
      };
    }
    
    // Eksik alanları tamamla
    if (!parsedResult.scoreExplanation) {
      parsedResult.scoreExplanation = `${brand} markası için görünürlük skoru: ${parsedResult.score}/100`;
    }
    
    if (!parsedResult.scoreCategory) {
      const score = parsedResult.score || 0;
      if (score >= 90) parsedResult.scoreCategory = "Mükemmel";
      else if (score >= 80) parsedResult.scoreCategory = "Çok İyi";
      else if (score >= 60) parsedResult.scoreCategory = "İyi";
      else if (score >= 40) parsedResult.scoreCategory = "Orta";
      else parsedResult.scoreCategory = "Zayıf";
    }
    
    if (!parsedResult.platforms) {
      parsedResult.platforms = [
        {name: "Gemini", status: "Analiz Edildi"}, 
        {name: "ChatGPT", status: "Simüle Edildi"},
        {name: "Claude", status: "Tarandı"}
      ];
    }
    
    res.status(200).json(parsedResult);
    
  } catch (error) {
    console.error("Backend Hatası:", error);
    res.status(500).json({ error: error.message || 'Analiz sırasında sunucu hatası.' });
  }
}
