const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

// TEST ROUTE (kontrol için)
app.get('/test', (req, res) => {
  res.send('API OK 🚀');
});

// ANA API (BU SENİN ARADIĞIN)
app.get('/api/trends/all', async (req, res) => {
  try {
    const response = await axios.get('https://www.reddit.com/r/all/hot.json?limit=10', {
      headers: { 'User-Agent': 'trendstats' }
    });

    const trends = response.data.data.children.map(p => p.data.title);

    const insight = `Trend Analizi:\n\n${trends.slice(0, 5).join('\n')}\n\nAI Yorumu: Viral içerikler yükselişte.`;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      insight
    });

  } catch (error) {
    res.json({
      success: false,
      insight: "Trend verisi alınamadı ama sistem çalışıyor 👍",
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server çalışıyor: ${PORT}`);
});