require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/articles', async (req, res) => {
  const { category } = req.query;

  try {
    let query;
    let queryParams = [];

    if (category && category !== 'home') {
      query = 'SELECT * FROM articles WHERE category = $1 ORDER BY published_at DESC';
      queryParams = [category];
    } else {
      query = 'SELECT * FROM articles ORDER BY published_at DESC LIMIT 100';
    }

    const result = await db.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching articles from DB:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// --- THE NEW AND IMPROVED NEWS FETCHING LOGIC ---

// These are the keywords we will search for.
const CATEGORIES = ['technology', 'business', 'sports', 'science', 'health'];
const HOME_PAGE_TOPIC = 'india'; // For the homepage, we'll get top news about India.

const fetchNewsAndStore = async () => {
  console.log('BACKGROUND JOB: Starting to fetch news for all categories...');

  const allTopics = [HOME_PAGE_TOPIC, ...CATEGORIES];

  for (const topic of allTopics) {
    console.log(`-- Fetching news for topic: ${topic}`);
    try {
      // *** THE BIG CHANGE IS HERE ***
      // We are now using the '/everything' endpoint and the 'q' parameter.
      // This is allowed on the free plan.
      const response = await axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          q: topic, // Search for the keyword
          language: 'en',
          sortBy: 'publishedAt', // Get the latest
          apiKey: process.env.NEWS_API_KEY,
        }
      });
      const articlesFromAPI = response.data.articles;

      const categoryToStore = topic === HOME_PAGE_TOPIC ? 'general' : topic;

      for (const article of articlesFromAPI) {
        if (!article.url || !article.title || article.title === '[Removed]') continue;

        const existing = await db.query('SELECT id FROM articles WHERE url = $1', [article.url]);
        if (existing.rows.length > 0) {
          continue;
        }

        const insertQuery = `
          INSERT INTO articles (title, url, source, description, content, image_url, category, published_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        const values = [
          article.title,
          article.url,
          article.source.name,
          article.description,
          article.content,
          article.urlToImage,
          categoryToStore, // Store it under the correct category name
          article.publishedAt
        ];
        await db.query(insertQuery, values);
      }
      console.log(`-- Successfully stored articles for topic: ${topic}`);
    } catch (err) {
      if (err.response && err.response.status === 426) {
        console.error(`Error for topic "${topic}": NewsAPI free plan cannot be used on a server. This is a known limitation for localhost development.`);
      } else {
        console.error(`Error fetching news for topic ${topic}:`, err.message);
      }
    }
  }
  console.log('BACKGROUND JOB: Finished fetching all categories.');
};

const startServer = async () => {
  await db.setupDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server is live and listening on port ${PORT}`);
  });

  cron.schedule('0 * * * *', fetchNewsAndStore);

  console.log('Running initial news fetch on server start...');
  fetchNewsAndStore();
};

startServer();