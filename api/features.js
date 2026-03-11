const { supabase } = require('./_lib/supabase');
const { verifyToken } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
};

async function handleGet(req, res) {
  const user = verifyToken(req);
  const userId = user ? user.userId : null;

  try {
    const { data: features, error } = await supabase
      .from('feature_requests')
      .select('id, title, description, vote_count, created_at, user_id, users(name)')
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch features' });
    }

    let votedIds = new Set();
    if (userId) {
      const { data: votes } = await supabase
        .from('votes')
        .select('feature_id')
        .eq('user_id', userId);

      if (votes) {
        votedIds = new Set(votes.map(v => v.feature_id));
      }
    }

    const result = features.map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      vote_count: f.vote_count,
      author_name: f.users?.name || 'Unknown',
      created_at: f.created_at,
      user_voted: votedIds.has(f.id)
    }));

    return res.status(200).json({ features: result });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req, res) {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Login required' });
  }

  const { title, description } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (title.trim().length > 200) {
    return res.status(400).json({ error: 'Title must be under 200 characters' });
  }

  try {
    const { data: feature, error } = await supabase
      .from('feature_requests')
      .insert({
        user_id: user.userId,
        title: title.trim(),
        description: description ? description.trim() : null
      })
      .select('id, title, description, vote_count, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create feature request' });
    }

    return res.status(201).json({
      feature: {
        ...feature,
        author_name: user.name,
        user_voted: false
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
