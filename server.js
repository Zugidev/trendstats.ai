const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

// 🔥 TEST ROUTE
app.get('/test', (req, res) => {
  res.send('API OK 🚀');
});

// 🔥 ANA API
app.get('/api/trends/all', async (req, res) => {
  try {
    const reddit = await axios.get('https://www.reddit.com/r/all/hot.json?limit=15', {
      headers: { 'User-Agent': 'trendstats-app' }
    });

    const trends = reddit.data.data.children
      .map(p => p.data.title)
      .filter(t => t.length > 20)
      .slice(0, 8);

    const insight = `
Trend Analizi:

${trends.map((t, i) => `${i + 1}. ${t}`).join('\n')}

AI Yorumu: Viral içerikler ve gündem haberleri yükselişte. Sosyal medya etkileşimi yüksek başlıklar öne çıkıyor.
`;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      insight
    });

  } catch (error) {
    console.error(error);

    res.json({
      success: false,
      insight: "Veri alınamadı ama sistem aktif 👍",
      timestamp: new Date().toISOString()
    });
  }
});

// 🔥 FALLBACK (çok önemli)
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`TrendStats API çalışıyor: ${PORT}`);
});
