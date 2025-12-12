const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { brand, sector } = req.body;

  if (!brand || !sector) {
    return res.status(400).json({ error: "Marka ve sektör gereklidir" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY bulunamadı");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      }
    });

    const prompt = `${brand} markasını ${sector} sektöründe analiz et.

GÖREV: Bu markanın yapay zeka platformlarında (ChatGPT, Claude, Gemini gibi) ne kadar görünür olduğunu değerlendir.

ÇIKTI FORMATI (JSON):
{
  "visibilityScore": 85,
  "scoreExplanation": "Tesla, elektrikli araç sektöründe lider konumda...",
  "strengths": ["Güçlü dijital varlık", "İnovasyon lideri"],
  "weaknesses": ["Sınırlı coğrafi erişim", "Yüksek fiyat"],
  "competitors": ["BMW", "Mercedes", "Audi"],
  "recommendations": [
    "AI platformlarında marka bilinirliğini artırmak için içerik pazarlaması yapın",
    "Sektörel forumlarda aktif olun"
  ]
}

ÖNEMLİ:
- visibilityScore: 0-100 arası sayı
- scoreExplanation: En az 2 cümle, markanın AI'da neden bu skoru aldığını açıkla
- Rakipleri mutlaka belirt
- Tavsiyeleri Türkçe ver`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // JSON parse et
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Gemini'den geçerli JSON yanıtı alınamadı");
    }

    const data = JSON.parse(jsonMatch[0]);

    // Zorunlu alanları kontrol et
    if (!data.scoreExplanation || data.scoreExplanation.length < 10) {
      data.scoreExplanation = `${brand}, ${sector} sektöründe ${data.visibilityScore}/100 görünürlük skoruna sahip. Bu skor, markanın dijital varlığını ve AI platformlarındaki bilinirliğini yansıtır.`;
    }

    // Eksik alanları tamamla
    data.strengths = data.strengths || ["Marka bilinirliği", "Dijital varlık"];
    data.weaknesses = data.weaknesses || ["Geliştirilmesi gereken alanlar var"];
    data.competitors = data.competitors || ["Sektör rakipleri"];
    data.recommendations = data.recommendations || [
      "AI platformlarında daha fazla içerik üretin",
      "Dijital pazarlama stratejinizi güçlendirin"
    ];

    return res.status(200).json(data);

  } catch (error) {
    console.error("API Hatası:", error.message);

    // API limiti hatası varsa fallback yanıt
    if (error.message.includes("quota") || error.message.includes("limit")) {
      return res.status(200).json({
        visibilityScore: 75,
        scoreExplanation: `${brand} markası ${sector} sektöründe orta-yüksek düzeyde görünürlüğe sahip. API limiti nedeniyle detaylı analiz yapılamadı, ancak genel değerlendirme 75/100 civarındadır.`,
        strengths: [
          "Sektörde tanınmış bir marka",
          "Dijital kanallar üzerinde aktif"
        ],
        weaknesses: [
          "AI platformlarında daha fazla içerik gerekebilir",
          "Rakiplerle karşılaştırıldığında iyileştirme alanları var"
        ],
        competitors: [
          "Sektör liderleri",
          "Yerel ve global rakipler"
        ],
        recommendations: [
          "Yapay zeka platformlarında marka bilinirliğini artırmak için düzenli içerik üretin",
          "SEO ve dijital pazarlama stratejilerinizi güçlendirin",
          "Sektörel forumlarda ve topluluk platformlarında aktif olun",
          "Müşteri yorumlarını ve case study'leri paylaşın"
        ],
        fallback: true,
        message: "⚠️ API limiti aşıldı - Demo yanıt gösteriliyor. Yeni API key edinmek için: https://aistudio.google.com/apikey"
      });
    }

    return res.status(500).json({ 
      error: "Analiz sırasında hata oluştu",
      details: error.message 
    });
  }
};
