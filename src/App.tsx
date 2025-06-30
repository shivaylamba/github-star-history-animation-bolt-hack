import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import RepoInput from './components/RepoInput';
import StarHistoryChart from './components/StarHistoryChart';
import VideoGenerator from './components/VideoGenerator';
import { StarHistoryData } from './types';
import { getRepoStarRecords } from './utils/github';

function App() {
  const [starData, setStarData] = useState<StarHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRepoSubmit = async (repo: string, token?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const [owner, repoName] = repo.split('/');
      if (!owner || !repoName) {
        throw new Error('Invalid repository format. Please use owner/repo format.');
      }

      // Fetch repository basic info
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
      };
      
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          throw new Error('Repository not found. Please check the repository name.');
        } else if (repoResponse.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please try again later or add a Personal Access Token.');
        } else if (repoResponse.status === 401) {
          throw new Error('Invalid GitHub token. Please check your Personal Access Token.');
        }
        throw new Error('Failed to fetch repository data.');
      }

      const repoData = await repoResponse.json();
      
      // Fetch real star history data using the proper function with token
      const starHistoryResult = await getRepoStarRecords(`${owner}/${repoName}`, token);
      
      // Convert the star records to the format expected by the UI
      const history = starHistoryResult.star.map(record => ({
        date: record.date,
        stars: record.count
      }));
      
      setStarData({
        repo: `${owner}/${repoName}`,
        totalStars: starHistoryResult.totalStars,
        history: history,
        description: repoData.description || 'No description available',
        language: repoData.language || 'Unknown',
        createdAt: repoData.created_at
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Header />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <RepoInput 
            onSubmit={handleRepoSubmit}
            loading={loading}
            error={error}
          />
        </motion.div>

        {starData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 space-y-8"
          >
            <StarHistoryChart data={starData} />
            <VideoGenerator data={starData} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default App;