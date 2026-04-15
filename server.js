const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

async function safeFetch(fn, fallback) {
    try {
        const result = await Promise.race([
            fn(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
        ]);
        return result;
    } catch (e) {
        return fallback;
    }
}

async function getHackerNews() {
    return safeFetch(async () => {
        const topRes = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
        const topIds = topRes.data.slice(0, 8);
        const stories = await Promise.all(
            topIds.map(async (id) => {
                const storyRes = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                return storyRes.data.title;
            })
        );
        return stories;
    }, ['AI Breakthrough', 'Tech News', 'Startup Updates']);
}

async function getReddit() {
    return safeFetch(async () => {
        const res = await axios.get('https://www.reddit.com/r/all/hot.json?limit=10', {
            headers: { 'User-Agent': 'TrendStats/1.0' },
            timeout: 8000
        });
        return res.data.data.children.map(post => post.data.title);
    }, ['Interesting discussion', 'Viral content', 'Community highlight']);
}

async function getGitHub() {
    return safeFetch(async () => {
        const res = await axios.get('https://api.github.com/search/repositories?q=stars:>100&sort=stars&order=desc&per_page=8', {
            headers: { 'Accept': 'application/vnd.github.v3+json' },
            timeout: 8000
        });
        return res.data.items.map(repo => `${repo.name}: ${repo.description?.substring(0, 50) || 'Popular'}`);
    }, ['react', 'vue', 'tailwind', 'nextjs', 'python']);
}

async function getYouTube() {
    return safeFetch(async () => {
        const res = await axios.get('https://www.youtube.com/feeds/trending.xml', { timeout: 8000 });
        const titles = [...res.data.matchAll(/<title>(.*?)<\/title>/g)];
        return titles.slice(1, 8).map(t => t[1].replace('YouTube Trending Videos - ', '').substring(0, 55));
    }, ['Viral Video', 'Music Trend', 'Gaming Highlight']);
}

async function getGoogleNews() {
    return safeFetch(async () => {
        const res = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', { timeout: 8000 });
        const titles = [...res.data.matchAll(/<title>(.*?)<\/title>/g)];
        return titles.slice(1, 8).map(t => t[1]);
    }, ['World News', 'Tech Update', 'Breaking Story']);
}

async function getWikipedia() {
    return safeFetch(async () => {
        const res = await axios.get('https://api.wikimedia.org/core/v1/wikipedia/en/page/trending?limit=8', { timeout: 8000 });
        return res.data.items.map(item => item.title);
    }, ['Artificial Intelligence', 'Climate Change', 'Space Exploration']);
}

async function getEarthquakes() {
    return safeFetch(async () => {
        const res = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', { timeout: 8000 });
        return res.data.features.slice(0, 4).map(eq => `${eq.properties.mag}M - ${eq.properties.place.split(',')[0]}`);
    }, ['No significant seismic activity']);
}

async function getCrypto() {
    return safeFetch(async () => {
        const res = await axios.get('https://api.coingecko.com/api/v3/search/trending', { timeout: 8000 });
        return res.data.coins.slice(0, 8).map(coin => `${coin.item.name}`);
    }, ['Bitcoin', 'Ethereum', 'Solana', 'Cardano']);
}

async function getWeather() {
    return safeFetch(async () => {
        const cities = [
            { name: 'New York', lat: 40.71, lon: -74.01 },
            { name: 'London', lat: 51.51, lon: -0.13 },
            { name: 'Tokyo', lat: 35.69, lon: 139.69 }
        ];
        const weathers = await Promise.all(
            cities.map(async (city) => {
                const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`, { timeout: 5000 });
                return `${city.name}: ${res.data.current_weather.temperature}°C`;
            })
        );
        return weathers;
    }, ['NY: 22°C', 'London: 18°C', 'Tokyo: 25°C']);
}

async function getStackOverflow() {
    return safeFetch(async () => {
        const res = await axios.get('https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&site=stackoverflow&pagesize=8', { timeout: 8000 });
        return res.data.items?.map(q => q.title.substring(0, 55)) || [];
    }, ['React vs Vue', 'Python async', 'Docker tips', 'API design']);
}

async function getLobsters() {
    return safeFetch(async () => {
        const res = await axios.get('https://lobste.rs/hottest.json', { timeout: 8000 });
        return res.data.slice(0, 8).map(story => story.title);
    }, ['Tech discussion', 'Programming trends', 'Dev tools']);
}

async function getSteam() {
    return safeFetch(async () => {
        const res = await axios.get('https://store.steampowered.com/feeds/trending.xml', { timeout: 8000 });
        const titles = [...res.data.matchAll(/<title>(.*?)<\/title>/g)];
        return titles.slice(1, 6).map(t => t[1]);
    }, ['Popular Game', 'New Release', 'Top Seller']);
}

function aiAnalyze(allTrends) {
    const all = allTrends.flat().filter(t => t && t.length > 5);
    const unique = [...new Set(all)].slice(0, 25);
    
    const words = unique.join(' ').toLowerCase().split(/\s+/);
    const freq = {};
    words.forEach(w => { if (w.length > 4) freq[w] = (freq[w] || 0) + 1; });
    
    const topWords = Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([word]) => word);
    
    return {
        summary: `Yapay Zeka Trend Analizi\n\nTrend Kelimeler: ${topWords.slice(0, 4).join(', ')}\n\nEn Sıcak Trendler:\n${unique.slice(0, 12).map((t, i) => `${i+1}. ${t.substring(0, 65)}`).join('\n')}\n\nAI Öngörüsü: ${topWords[0]?.toUpperCase() || 'Dijital'} içerikler önümüzdeki saatlerde yükselişte.`,
        unique: unique
    };
}

app.get('/api/trends/all', async (req, res) => {
    const sources = await Promise.allSettled([
        getHackerNews(), getReddit(), getGitHub(), getYouTube(),
        getGoogleNews(), getWikipedia(), getEarthquakes(), getCrypto(), 
        getWeather(), getStackOverflow(), getLobsters(), getSteam()
    ]);
    
    const allTrends = [];
    sources.forEach(source => {
        if (source.status === 'fulfilled') allTrends.push(...source.value);
    });
    
    const analysis = aiAnalyze(allTrends);
    
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        insight: analysis.summary,
        allTrends: analysis.unique
    });
});

app.listen(PORT, () => console.log(`TrendStats.ai calisiyor: http://localhost:${PORT}`));