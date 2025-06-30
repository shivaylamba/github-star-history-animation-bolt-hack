import { RepoStarData, XYChartData, ChartMode, XYData } from '../types';

export const convertStarDataToChartData = (reposStarData: RepoStarData[], chartMode: ChartMode): XYChartData => {
    if (chartMode === "Date") {
        // Standard mode: use real calendar dates
        const datasets: XYData[] = reposStarData.map((item) => {
            const { repo, starRecords } = item;

            return {
                label: repo,
                logo: "",
                data: starRecords.map((item) => {
                    return {
                        x: new Date(item.date),   // Real calendar date
                        y: Number(item.count)
                    };
                })
            };
        });

        return {
            datasets
        };
    } else {
        // Timeline mode: normalize to "time since first star"
        const datasets: XYData[] = reposStarData.map((item) => {
            const { repo, starRecords } = item;
            const startDate = new Date(starRecords[0].date).getTime();

            return {
                label: repo,
                logo: "",
                data: starRecords.map((item) => {
                    return {
                        x: (new Date(item.date).getTime() - startDate) / (1000 * 60 * 60 * 24), // days since first star
                        y: Number(item.count)
                    };
                })
            };
        });

        return {
            datasets
        };
    }
};

export const calculateGrowthRate = (starRecords: { date: string; count: number }[]): Array<{ date: string; growthRate: number; stars: number }> => {
    const growthData = [];
    
    for (let i = 1; i < starRecords.length; i++) {
        const current = starRecords[i];
        const previous = starRecords[i - 1];
        
        const currentDate = new Date(current.date);
        const previousDate = new Date(previous.date);
        const daysDiff = Math.max(1, (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const starsDiff = current.count - previous.count;
        const growthRate = starsDiff / daysDiff; // stars per day
        
        growthData.push({
            date: current.date,
            growthRate: Math.max(0, growthRate),
            stars: current.count
        });
    }
    
    return growthData;
};

export const findGrowthSpikes = (growthData: Array<{ date: string; growthRate: number; stars: number }>, threshold: number = 2): Array<{ date: string; growthRate: number; stars: number; isSpike: boolean }> => {
    if (growthData.length === 0) return [];
    
    // Calculate average growth rate
    const avgGrowthRate = growthData.reduce((sum, item) => sum + item.growthRate, 0) / growthData.length;
    const spikeThreshold = avgGrowthRate * threshold;
    
    return growthData.map(item => ({
        ...item,
        isSpike: item.growthRate > spikeThreshold && item.growthRate > 1 // At least 1 star per day and above threshold
    }));
};