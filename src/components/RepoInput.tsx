import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Github, AlertCircle, Loader2, Key, Eye, EyeOff, Info } from 'lucide-react';

interface RepoInputProps {
  onSubmit: (repo: string, token?: string) => void;
  loading: boolean;
  error: string | null;
}

const RepoInput: React.FC<RepoInputProps> = ({ onSubmit, loading, error }) => {
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repo.trim()) {
      onSubmit(repo.trim(), token.trim() || undefined);
    }
  };

  const popularRepos = [
    'facebook/react',
    'microsoft/vscode',
    'vercel/next.js',
    'nodejs/node',
    'typescript-eslint/typescript-eslint'
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Repository
            </label>
            <div className="relative">
              <Github className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="repo"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g., facebook/react"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                disabled={loading}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Enter the repository in the format: owner/repository-name
            </p>
          </div>

          {/* GitHub Token Section */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">GitHub Personal Access Token</span>
                <span className="text-xs text-gray-500">(Optional)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showTokenInput ? 'Hide' : 'Add Token'}
              </button>
            </div>

            {showTokenInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Why use a Personal Access Token?</p>
                      <ul className="text-xs space-y-1 text-blue-700">
                        <li>• Increases API rate limit from 60 to 5,000 requests per hour</li>
                        <li>• Allows access to private repositories (if token has permissions)</li>
                        <li>• Reduces "rate limit exceeded" errors</li>
                      </ul>
                      <p className="text-xs mt-2">
                        <a 
                          href="https://github.com/settings/tokens" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          Create a token here
                        </a> (no special permissions needed for public repos)
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <span>{error}</span>
                {error.includes('rate limit') && !showTokenInput && (
                  <p className="text-sm mt-1">
                    Consider adding a GitHub Personal Access Token to increase your rate limit.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading || !repo.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Fetching Repository Data...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Generate Star History Video
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Repositories</h3>
          <div className="flex flex-wrap gap-2">
            {popularRepos.map((popularRepo) => (
              <button
                key={popularRepo}
                onClick={() => setRepo(popularRepo)}
                disabled={loading}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {popularRepo}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepoInput;