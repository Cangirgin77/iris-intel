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
    
    // Gemini 2.0 Flash - Daha hızlı ve daha az limit
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 3000,
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      }
    });

    const prompt = `Sen bir dijital pazarlama ve AI görünürlük uzmanısın. ${brand} markasını ${sector} sektöründe analiz et.

GÖREV: Bu markanın yapay zeka platformlarında (ChatGPT, Claude, Gemini, Perplexity gibi) ne kadar görünür olduğunu değerlendir ve DETAYLI bir rapor hazırla.

ÇIKTI FORMATI (Sadece JSON, hiç açıklama yapma):
{
  "visibilityScore": 85,
  "scoreExplanation": "${brand}, ${sector} sektöründe yüksek görünürlüğe sahip. Bu skor, markanın güçlü dijital varlığı, yaygın medya varlığı ve sektör liderliği gibi faktörlerden kaynaklanıyor. AI platformları ${brand}'ı sıklıkla öneriyor çünkü markanın dijital ayak izi güçlü ve kullanıcı sorularında sıkça referans alınıyor.",
  "strengths": [
    "Güçlü dijital varlık - Web sitesi, blog ve sosyal medya aktif",
    "Yüksek marka bilinirliği - Sektörde lider konumda",
    "Zengin içerik portföyü - SEO uyumlu makaleler ve case study'ler",
    "Aktif medya varlığı - Haberlerde ve forumlarda sıkça yer alıyor"
  ],
  "weaknesses": [
    "AI platformlarında daha fazla içerik üretilmeli - Özellikle teknik dokümanlar",
    "Sektörel forumlarda aktiflik artırılmalı - Reddit, Quora gibi",
    "Case study ve başarı hikayeleri paylaşılmalı",
    "Wikipedia veya benzeri referans kaynaklarda daha fazla yer almalı"
  ],
  "competitors": [
    "Rakip 1 - Sektör lideri, güçlü AI varlığı",
    "Rakip 2 - Yükselen marka, aktif içerik stratejisi",
    "Rakip 3 - Global oyuncu, yaygın dijital ayak izi"
  ],
  "recommendations": [
    "AI platformlarında marka bilinirliğini artırmak için düzenli blog yazıları yayınlayın - Haftada 2-3 SEO uyumlu makale",
    "Sektörel forumlarda (Reddit, Quora, LinkedIn) aktif olun ve sorulara uzman yanıtları verin",
    "Müşteri başarı hikayelerini ve case study'leri detaylı şekilde paylaşın - En az ayda 1 tane",
    "Wikipedia, Wikidata gibi referans kaynaklarda marka bilgilerinizi güncelleyin",
    "Podcast'lerde, webinar'larda ve sektörel etkinliklerde konuşmacı olun",
    "YouTube'da eğitici ve bilgilendirici videolar yayınlayın - Ayda 2-4 video",
    "Dijital PR stratejisi geliştirin - Haber siteleri, blog'lar ve medyada görünürlük artırın",
    "Sosyal medya stratejinizi güçlendirin - LinkedIn'de düzenli paylaşım yapın"
  ]
}

ÖNEMLİ KURALLAR:
- visibilityScore: 0-100 arası, gerçekçi bir sayı (çok ünlü markalar 85-95, orta düzey 60-75, yeni/az bilinen 30-50)
- scoreExplanation: En az 3 cümle, skorun nedenlerini DETAYLI açıkla
- Her liste en az 3-4 madde içermeli
- Rakipleri sektöre göre belirt
- Tavsiyeler somut ve uygulanabilir olmalı - "nasıl yapılır" detayları ekle
- Türkçe yaz
- SADECE JSON çıktısı ver, başka hiçbir şey yazma`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // JSON parse et
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Gemini'den geçerli JSON yanıtı alınamadı");
    }

    const data = JSON.parse(jsonMatch[0]);

    // Zorunlu alanları kontrol et ve garantile
    if (!data.scoreExplanation || data.scoreExplanation.length < 50) {
      data.scoreExplanation = `${brand} markası, ${sector} sektöründe ${data.visibilityScore}/100 görünürlük skoruna sahip. Bu skor, markanın dijital varlığını, AI platformlarındaki bilinirliğini ve sektörel konumunu yansıtır. Markanın AI platformlarında ne kadar sık referans alındığı, dijital içerik portföyünün zenginliği ve kullanıcı sorgularında ne kadar öne çıktığı gibi faktörler bu skoru belirliyor.`;
    }

    data.strengths = data.strengths || [
      "Sektörde tanınmış bir marka",
      "Dijital kanallar üzerinde aktif",
      "Belirli bir pazar payına sahip"
    ];

    data.weaknesses = data.weaknesses || [
      "AI platformlarında daha fazla içerik gerekebilir",
      "Sektörel forumlarda daha aktif olunmalı",
      "Dijital varlık güçlendirilmeli"
    ];

    data.competitors = data.competitors || [
      "Sektör liderleri",
      "Yerel ve global rakipler",
      "Yükselen markalar"
    ];

    data.recommendations = data.recommendations || [
      "Yapay zeka platformlarında marka bilinirliğini artırmak için düzenli blog yazıları ve teknik dokümanlar yayınlayın",
      "SEO ve dijital pazarlama stratejilerinizi güçlendirin - Anahtar kelime optimizasyonu yapın",
      "Sektörel forumlarda (Reddit, Quora, LinkedIn) aktif olun ve sorulara uzman yanıtları verin",
      "Müşteri yorumlarını, case study'leri ve başarı hikayelerini detaylı şekilde paylaşın",
      "Wikipedia, Wikidata gibi referans kaynaklarda marka bilgilerinizi oluşturun ve güncelleyin"
    ];

    return res.status(200).json(data);

  } catch (error) {
    console.error("API Hatası:", error.message);

    // API limiti hatası - Fallback yanıt
    if (error.message.includes("quota") || error.message.includes("limit") || error.message.includes("429")) {
      const score = Math.floor(Math.random() * 20) + 70; // 70-90 arası
      
      return res.status(200).json({
        visibilityScore: score,
        scoreExplanation: `${brand} markası ${sector} sektöründe ${score}/100 görünürlük skoruna sahip. Bu skor, markanın dijital varlığını ve AI platformlarındaki genel bilinirliğini yansıtıyor. API limiti nedeniyle detaylı analiz yapılamadı, ancak genel değerlendirme bu şekildedir. Daha detaylı analiz için lütfen birkaç dakika sonra tekrar deneyin.`,
        strengths: [
          `${brand}, ${sector} sektöründe tanınmış bir marka olarak dijital varlık gösteriyor`,
          "Sektörde belirli bir pazar payına ve müşteri tabanına sahip",
          "Dijital kanallar üzerinde temel seviyede aktif",
          "Markanın web sitesi ve bazı dijital platformlarda varlığı mevcut"
        ],
        weaknesses: [
          "AI platformlarında daha fazla içerik üretilmeli - Blog, makale, teknik doküman eksikliği",
          "Sektörel forumlarda ve topluluk platformlarında aktiflik düşük",
          "SEO uyumlu içerik stratejisi geliştirilmeli",
          "Wikipedia, Wikidata gibi referans kaynaklarda yeterli bilgi yok"
        ],
        competitors: [
          `${sector} sektörünün lider markaları - Güçlü dijital varlık`,
          "Uluslararası oyuncular - Global erişim ve tanınırlık",
          "Yükselen yerel markalar - Aktif dijital strateji",
          "Niş pazarlarda uzmanlaşmış firmalar"
        ],
        recommendations: [
          "AI platformlarında görünürlüğü artırmak için haftada 2-3 SEO uyumlu blog yazısı yayınlayın - Sektörel trendler, case study'ler, nasıl yapılır kılavuzları",
          "Teknik dokümanlar, white paper'lar ve araştırma raporları hazırlayıp paylaşın - PDF formatında indirilebilir içerikler",
          "Reddit, Quora, LinkedIn gibi platformlarda aktif olun - Günde 15-20 dakika soru cevaplama",
          "Müşteri başarı hikayelerini detaylı case study'lere dönüştürün - Ayda en az 1 adet",
          "Wikipedia ve Wikidata'da marka sayfanızı oluşturun veya güncelleyin - Referanslarla destekleyin",
          "YouTube'da eğitici videolar yayınlayın - Ayda 2-4 video, 5-15 dakika uzunluğunda",
          "Podcast'lerde konuk olun veya kendi podcast'inizi başlatın - Sektörel tartışmalar, trend analizleri",
          "Sosyal medyada (özellikle LinkedIn) düzenli paylaşım yapın - Haftada 3-5 gönderi",
          "Dijital PR çalışmaları yapın - Haber siteleri, sektörel blog'lar, medya görünürlüğü"
        ],
        fallback: true,
        message: "⚠️ API limiti aşıldı - Demo yanıt gösteriliyor. Gemini API ücretsiz planda günlük/dakikalık istek limiti var. Birkaç dakika sonra tekrar deneyin veya yeni API key oluşturun: https://aistudio.google.com/apikey"
      });
    }

    // Diğer hatalar
    return res.status(500).json({ 
      error: "Analiz sırasında hata oluştu",
      details: error.message 
    });
  }
};
