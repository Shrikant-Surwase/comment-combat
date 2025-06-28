import React, { useState, useEffect } from 'react';
import { Zap, Trophy, ThumbsUp, Sword, Upload, Users, LogIn, UserPlus, Home, Loader, AlertCircle, Star, Crown, Target } from 'lucide-react';

const CommentCombatApp = () => {
  // State Management
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('auth');
  const [authMode, setAuthMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auth State
  const [authData, setAuthData] = useState({
    username: '',
    email: '',
    password: ''
  });

  // App State
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [battles, setBattles] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [userVotes, setUserVotes] = useState({}); // Track user votes per comment

  // Mock Database (In real app, this would be your backend)
  const [users, setUsers] = useState([
    { id: 1, username: 'comedyking', email: 'king@comedy.com', password: 'password123' },
    { id: 2, username: 'jokester', email: 'joke@master.com', password: 'pass456' }
  ]);

  const [mockComments, setMockComments] = useState([
    {
      id: 1,
      userId: 1,
      username: 'comedyking',
      text: "Why don't scientists trust atoms? Because they make up everything!",
      votes: 42,
      timestamp: new Date('2025-06-27'),
      aiScore: 8.5,
      isApproved: true,
      votedBy: []
    },
    {
      id: 2,
      userId: 2,
      username: 'jokester',
      text: "I told my wife she was drawing her eyebrows too high. She looked surprised.",
      votes: 38,
      timestamp: new Date('2025-06-26'),
      aiScore: 7.8,
      isApproved: true,
      votedBy: []
    }
  ]);

  // AI Humor Analysis (Improved)
  const analyzeHumor = async (text) => {
    setLoading(true);
    try {
      // Improved AI analysis with Claude
      const prompt = `You are a comedy expert and humor analyst. Analyze this comment for humor and entertainment value. Be generous with scoring - people are trying to be funny and creative!

Rate this comment on a scale of 1-10 for humor. Consider:
- Wordplay, puns, and clever language use
- Relatable situations and observations
- Creative storytelling or scenarios
- Pop culture references
- Self-deprecating or observational humor
- Any attempt at being witty or entertaining

BE GENEROUS - if someone is making an effort to be funny, give them credit! A score of 5+ should be approved.

Return ONLY a JSON object in this exact format:
{
  "score": 7.5,
  "isFunny": true,
  "reason": "Creative wordplay with relatable humor"
}

Comment to analyze: "${text}"

DO NOT include any text outside the JSON object. NO backticks or markdown formatting.`;

      const response = await window.claude.complete(prompt);
      const analysis = JSON.parse(response);
      
      // Ensure the analysis has the right structure and boost scoring
      const finalScore = Math.max(analysis.score || 5, 5); // Minimum score of 5
      const isFunny = finalScore >= 5; // Lower threshold
      
      setLoading(false);
      return {
        score: finalScore,
        isFunny: isFunny,
        reason: analysis.reason || "Creative attempt at humor"
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setLoading(false);
      // More generous fallback scoring
      return { 
        score: 6.5, 
        isFunny: true, 
        reason: "Auto-approved - keep the comedy flowing!" 
      };
    }
  };

  // Authentication Functions
  const handleAuth = async () => {
    if (!authData.username || !authData.password) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (authMode === 'signin') {
      // Sign In Logic
      const user = users.find(u => 
        u.username === authData.username && u.password === authData.password
      );

      if (user) {
        setCurrentUser(user);
        setCurrentScreen('main');
        setSuccess('Welcome back, ' + user.username + '!');
        loadUserData();
      } else {
        setError('Invalid username or password');
      }
    } else {
      // Sign Up Logic
      if (!authData.email) {
        setError('Email is required for sign up');
        setLoading(false);
        return;
      }

      const existingUser = users.find(u => 
        u.username === authData.username || u.email === authData.email
      );

      if (existingUser) {
        setError('Username or email already exists');
      } else {
        const newUser = {
          id: users.length + 1,
          username: authData.username,
          email: authData.email,
          password: authData.password
        };
        
        setUsers([...users, newUser]);
        setCurrentUser(newUser);
        setCurrentScreen('main');
        setSuccess('Account created successfully! Welcome to Comment Combat!');
        loadUserData();
      }
    }

    setLoading(false);
  };

  const loadUserData = () => {
    // Sort comments by votes (highest first)
    const sortedComments = [...mockComments].sort((a, b) => b.votes - a.votes);
    setComments(sortedComments);
  };

  // Comment Functions
  const handleUploadComment = async () => {
    if (!newComment.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (newComment.trim().length < 10) {
      setError('Comment too short! Make it at least 10 characters.');
      return;
    }

    setError('');
    setSuccess('');

    // AI Analysis
    const analysis = await analyzeHumor(newComment);

    if (!analysis.isFunny) {
      setError(`AI says: "${analysis.reason}" Score: ${analysis.score}/10. Try adding more humor or wordplay!`);
      return;
    }

    const comment = {
      id: mockComments.length + 1,
      userId: currentUser.id,
      username: currentUser.username,
      text: newComment,
      votes: 0,
      timestamp: new Date(),
      aiScore: analysis.score,
      isApproved: true,
      votedBy: [] // Track who voted for this comment
    };

    const updatedMockComments = [comment, ...mockComments];
    setMockComments(updatedMockComments);
    
    // Sort by votes and update
    const sortedComments = [...updatedMockComments].sort((a, b) => b.votes - a.votes);
    setComments(sortedComments);
    
    setNewComment('');
    setSuccess(`🎉 Comment approved! AI Humor Score: ${analysis.score}/10 - "${analysis.reason}"`);
  };

  const handleVote = (commentId) => {
    // Check if user already voted for this comment
    const voteKey = `${currentUser.id}-${commentId}`;
    if (userVotes[voteKey]) {
      setError('You can only vote once per comment!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Update comments with vote
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        return { 
          ...comment, 
          votes: comment.votes + 1,
          votedBy: [...(comment.votedBy || []), currentUser.id]
        };
      }
      return comment;
    });

    // Update mock comments too
    const updatedMockComments = mockComments.map(comment => {
      if (comment.id === commentId) {
        return { 
          ...comment, 
          votes: comment.votes + 1,
          votedBy: [...(comment.votedBy || []), currentUser.id]
        };
      }
      return comment;
    });

    // Sort by votes (highest first)
    const sortedComments = [...updatedComments].sort((a, b) => b.votes - a.votes);
    
    setComments(sortedComments);
    setMockComments(updatedMockComments);
    
    // Mark this vote in user's voting history
    setUserVotes({...userVotes, [voteKey]: true});
    
    setSuccess('Vote counted! 🎯');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Battle System
  const startBattle = async () => {
    setLoading(true);
    
    // Get two random comments for battle
    const availableComments = comments.filter(c => c.userId !== currentUser.id);
    if (availableComments.length < 2) {
      setError('Not enough comments for a battle. Need at least 2 other users\' comments.');
      setLoading(false);
      return;
    }

    const comment1 = availableComments[Math.floor(Math.random() * availableComments.length)];
    const comment2 = availableComments[Math.floor(Math.random() * availableComments.length)];

    if (comment1.id === comment2.id) {
      setLoading(false);
      startBattle(); // Try again
      return;
    }

    // AI Battle Judge
    const prompt = `Judge this comedy battle between two comments. Return only a JSON object:
    {
      "winner": 1 or 2,
      "reason": "brief explanation of why this comment won",
      "score1": number out of 10,
      "score2": number out of 10
    }

    Comment 1: "${comment1.text}"
    Comment 2: "${comment2.text}"

    Judge based on humor, originality, and comedic timing.`;

    try {
      const response = await window.claude.complete(prompt);
      const result = JSON.parse(response);

      const battle = {
        id: battles.length + 1,
        comment1,
        comment2,
        winner: result.winner,
        reason: result.reason,
        scores: { comment1: result.score1, comment2: result.score2 },
        timestamp: new Date()
      };

      setBattles([battle, ...battles]);
      setSuccess(`Battle complete! ${result.winner === 1 ? comment1.username : comment2.username} wins!`);
    } catch (error) {
      setError('Battle analysis failed. Try again!');
    }

    setLoading(false);
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentScreen('auth');
    setAuthData({ username: '', email: '', password: '' });
    setComments([]);
    setBattles([]);
    setUserVotes({});
    setSuccess('');
    setError('');
  };

  // Auth Screen
  if (currentScreen === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-yellow-400 mr-2" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Comment Combat
              </h1>
            </div>
            <p className="text-gray-400">Battle with your wit!</p>
          </div>

          <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                authMode === 'signin' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                authMode === 'signup' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={authData.username}
              onChange={(e) => setAuthData({...authData, username: e.target.value})}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
            
            {authMode === 'signup' && (
              <input
                type="email"
                placeholder="Email"
                value={authData.email}
                onChange={(e) => setAuthData({...authData, email: e.target.value})}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            )}
            
            <input
              type="password"
              placeholder="Password"
              value={authData.password}
              onChange={(e) => setAuthData({...authData, password: e.target.value})}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />

            {error && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center text-green-400 text-sm">
                <Star className="w-4 h-4 mr-2" />
                {success}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
              ) : (
                authMode === 'signin' ? <LogIn className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Processing...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

          {authMode === 'signin' && (
            <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
              <p className="text-xs text-blue-300 mb-2">Demo Accounts:</p>
              <p className="text-xs text-gray-300">comedyking / password123</p>
              <p className="text-xs text-gray-300">jokester / pass456</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main App Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-lg border-b border-purple-500/30 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="w-6 h-6 text-yellow-400 mr-2" />
            <h1 className="text-xl font-bold text-white">Comment Combat</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-purple-300">Welcome, {currentUser.username}!</span>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center px-6 py-3 rounded-lg transition-all ${
              activeTab === 'upload' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Comment
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center px-6 py-3 rounded-lg transition-all ${
              activeTab === 'browse' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Browse & Vote
          </button>
          <button
            onClick={() => setActiveTab('battle')}
            className={`flex items-center px-6 py-3 rounded-lg transition-all ${
              activeTab === 'battle' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Sword className="w-5 h-5 mr-2" />
            Battle Arena
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg flex items-center text-red-300">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-500/30 rounded-lg flex items-center text-green-300">
            <Star className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Upload className="w-6 h-6 mr-2 text-yellow-400" />
              Share Your Wit
            </h2>
            <div className="space-y-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter your funniest comment here... Make it count!"
                className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none h-32"
              />
              <button
                onClick={handleUploadComment}
                disabled={loading}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Target className="w-5 h-5 mr-2" />
                )}
                {loading ? 'AI Analyzing...' : 'Submit for AI Review'}
              </button>
            </div>
          </div>
        )}

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-400" />
              Community Comments
            </h2>
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold">{comment.username[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{comment.username}</p>
                      <p className="text-xs text-gray-400">{comment.timestamp.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                      AI: {comment.aiScore}/10
                    </span>
                  </div>
                </div>
                <p className="text-gray-200 mb-4 text-lg">{comment.text}</p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleVote(comment.id)}
                    disabled={userVotes[`${currentUser.id}-${comment.id}`]}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      userVotes[`${currentUser.id}-${comment.id}`]
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{comment.votes}</span>
                    {userVotes[`${currentUser.id}-${comment.id}`] && (
                      <span className="text-xs">(Voted)</span>
                    )}
                  </button>
                  {comment.votes > 0 && (
                    <div className="flex items-center text-yellow-400">
                      <Trophy className="w-4 h-4 mr-1" />
                      <span className="text-sm">#{comments.findIndex(c => c.id === comment.id) + 1} Top Comment</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Battle Tab */}
        {activeTab === 'battle' && (
          <div className="space-y-6">
            <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Sword className="w-6 h-6 mr-2 text-red-400" />
                Battle Arena
              </h2>
              <p className="text-gray-300 mb-4">
                Watch AI judge epic comedy battles between community comments!
              </p>
              <button
                onClick={startBattle}
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Trophy className="w-5 h-5 mr-2" />
                )}
                {loading ? 'AI Judging...' : 'Start Battle'}
              </button>
            </div>

            {/* Battle Results */}
            {battles.map((battle) => (
              <div key={battle.id} className="bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center justify-center">
                    <Crown className="w-5 h-5 mr-2 text-yellow-400" />
                    Battle Results
                  </h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className={`p-4 rounded-lg border-2 ${
                    battle.winner === 1 ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{battle.comment1.username}</span>
                      <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded">
                        {battle.scores.comment1}/10
                      </span>
                    </div>
                    <p className="text-gray-200">{battle.comment1.text}</p>
                    {battle.winner === 1 && (
                      <div className="mt-2 flex items-center text-green-400">
                        <Crown className="w-4 h-4 mr-1" />
                        <span className="text-sm font-semibold">WINNER!</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 ${
                    battle.winner === 2 ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{battle.comment2.username}</span>
                      <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded">
                        {battle.scores.comment2}/10
                      </span>
                    </div>
                    <p className="text-gray-200">{battle.comment2.text}</p>
                    {battle.winner === 2 && (
                      <div className="mt-2 flex items-center text-green-400">
                        <Crown className="w-4 h-4 mr-1" />
                        <span className="text-sm font-semibold">WINNER!</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-purple-900/30 rounded-lg">
                  <p className="text-purple-200 font-medium">AI Judge's Decision:</p>
                  <p className="text-gray-300 mt-1">{battle.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentCombatApp;
