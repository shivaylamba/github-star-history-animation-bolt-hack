export interface StarRecord {
  date: string;
  count: number;
}

export interface StarHistoryResult {
  star: StarRecord[];
  repo: string;
  totalStars: number;
}

const DEFAULT_PER_PAGE = 100;
const MAX_REQUEST_AMOUNT = 30;

export function getDateString(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

export async function getRepoStargazersCount(repo: string, token?: string): Promise<number> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found');
    } else if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded');
    } else if (response.status === 401) {
      throw new Error('Invalid GitHub token');
    }
    throw new Error('Failed to fetch repository data');
  }
  
  const data = await response.json();
  return data.stargazers_count;
}

export async function getRepoStarRecords(repo: string, token?: string, maxRequestAmount: number = MAX_REQUEST_AMOUNT): Promise<StarHistoryResult> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3.star+json',
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // Get total star count first
  const totalStars = await getRepoStargazersCount(repo, token);
  
  if (totalStars === 0) {
    return {
      star: [{ date: getDateString(Date.now()), count: 0 }],
      repo,
      totalStars: 0
    };
  }

  // Calculate how many pages we need to fetch
  const totalPages = Math.ceil(totalStars / DEFAULT_PER_PAGE);
  const requestPages: number[] = [];
  
  if (totalPages <= maxRequestAmount) {
    // If we can fetch all pages, do it
    for (let i = 1; i <= totalPages; i++) {
      requestPages.push(i);
    }
  } else {
    // Sample pages across the timeline
    for (let i = 0; i < maxRequestAmount; i++) {
      const page = Math.floor((i / (maxRequestAmount - 1)) * (totalPages - 1)) + 1;
      requestPages.push(page);
    }
  }

  // Fetch stargazer data
  const promises = requestPages.map(page => 
    fetch(`https://api.github.com/repos/${repo}/stargazers?page=${page}&per_page=${DEFAULT_PER_PAGE}`, { headers })
      .then(res => {
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('GitHub API rate limit exceeded');
          } else if (res.status === 401) {
            throw new Error('Invalid GitHub token');
          }
          throw new Error(`Failed to fetch page ${page}`);
        }
        return res.json();
      })
      .then(data => ({ data, page }))
  );

  const resArray = await Promise.all(promises);
  const starRecordsMap: Map<string, number> = new Map();

  if (requestPages.length < maxRequestAmount) {
    // We have all the data, process it chronologically
    const starRecordsData: { starred_at: string }[] = [];
    resArray.forEach(res => {
      starRecordsData.push(...res.data);
    });

    // Sort by starred_at date
    starRecordsData.sort((a, b) => new Date(a.starred_at).getTime() - new Date(b.starred_at).getTime());

    // Sample data points evenly across the timeline
    const sampleSize = Math.min(maxRequestAmount, starRecordsData.length);
    for (let i = 0; i < sampleSize; i++) {
      const index = Math.floor((i / (sampleSize - 1)) * (starRecordsData.length - 1));
      starRecordsMap.set(getDateString(starRecordsData[index].starred_at), index + 1);
    }
  } else {
    // We're sampling, use page-based estimation
    resArray.forEach(({ data, page }) => {
      if (data.length > 0) {
        const starRecord = data[0];
        const estimatedCount = DEFAULT_PER_PAGE * (page - 1);
        starRecordsMap.set(getDateString(starRecord.starred_at), estimatedCount);
      }
    });
  }

  // Add current record with total stars
  starRecordsMap.set(getDateString(Date.now()), totalStars);

  // Convert map to sorted array
  const starRecords: StarRecord[] = [];
  starRecordsMap.forEach((count, date) => {
    starRecords.push({ date, count });
  });

  // Sort by date
  starRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    star: starRecords,
    repo,
    totalStars
  };
}