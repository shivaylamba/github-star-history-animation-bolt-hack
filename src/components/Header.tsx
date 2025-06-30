import React from 'react';
import { motion } from 'framer-motion';
import { Star, Video, Github } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-12"
    >
      <div className="flex justify-center items-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
          <Star className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Star History Videos
        </h1>
      </div>
      
      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
        Transform your GitHub repository's star growth into beautiful animated videos 
        perfect for social media sharing. Showcase your project's success story!
      </p>
      
      <div className="flex justify-center items-center gap-8 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Github className="w-4 h-4" />
          <span>GitHub API</span>
        </div>
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4" />
          <span>Remotion</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          <span>Real-time Data</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Header;