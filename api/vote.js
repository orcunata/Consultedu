const { supabase } = require('./_lib/supabase');
const { verifyToken } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Login required' });
  }

  const { feature_id } = req.body;
  if (!feature_id) {
    return res.status(400).json({ error: 'feature_id is required' });
  }

  try {
    const { data: existing } = await supabase
      .from('votes')
      .select('user_id')
      .eq('user_id', user.userId)
      .eq('feature_id', feature_id)
      .single();

    if (existing) {
      await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.userId)
        .eq('feature_id', feature_id);

      await supabase.rpc('decrement_vote', { fid: feature_id });

      return res.status(200).json({ voted: false });
    } else {
      await supabase
        .from('votes')
        .insert({ user_id: user.userId, feature_id });

      await supabase.rpc('increment_vote', { fid: feature_id });

      return res.status(200).json({ voted: true });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
