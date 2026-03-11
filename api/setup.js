const { supabase } = require('./_lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const secret = req.headers['x-setup-secret'];
  if (secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Invalid setup secret' });
  }

  try {
    // Create tables via Supabase SQL
    // NOTE: Run this SQL directly in the Supabase SQL Editor instead:
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feature_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        vote_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS votes (
        user_id INTEGER REFERENCES users(id),
        feature_id INTEGER REFERENCES feature_requests(id),
        PRIMARY KEY (user_id, feature_id)
      );

      -- Function to increment vote count
      CREATE OR REPLACE FUNCTION increment_vote(fid INTEGER)
      RETURNS VOID AS $$
        UPDATE feature_requests SET vote_count = vote_count + 1 WHERE id = fid;
      $$ LANGUAGE sql;

      -- Function to decrement vote count
      CREATE OR REPLACE FUNCTION decrement_vote(fid INTEGER)
      RETURNS VOID AS $$
        UPDATE feature_requests SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = fid;
      $$ LANGUAGE sql;
    `;

    return res.status(200).json({
      message: 'Run this SQL in the Supabase SQL Editor to set up your database:',
      sql
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
