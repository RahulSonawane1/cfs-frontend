import React, { useState, useEffect, useMemo } from 'react';
import PieChartStats from './PieChartStats';
import { FeedbackSubmission, Question, RatingLevel } from '../types';
import { RATINGS, ENDPOINTS } from '../constants';
import StatCard from './StatCard';

// Pie chart colors for rating levels
const PIE_COLORS = ['#4caf50', '#fbc02d', '#ff9800', '#d32f2f'];

interface AdminDashboardProps {
  onLogout: () => void;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [feedbackData, setFeedbackData] = useState<FeedbackSubmission[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('daily');
  const [selectedSite, setSelectedSite] = useState<string>('All Sites');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [showStatistics, setShowStatistics] = useState(false);

  // Helper to normalize canteen identifier fields from backend
  const canonicalCanteen = (fb: any) => fb?.canteen ?? fb?.canteen_id ?? fb?.canteenId ?? 'Unknown Canteen';

  // Memoized list of canteen keys for the selected site
  const canteenKeysForSelectedSite = useMemo(() => {
    return Array.from(new Set(feedbackData.filter(fb => fb && fb.site === selectedSite).map(fb => canonicalCanteen(fb)))).filter(Boolean);
  }, [feedbackData, selectedSite]);

  useEffect(() => {
    // Fetch sites from backend
    fetch(ENDPOINTS.SITES)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.sites)) {
          setSites(data.sites.filter(site => 
            site && 
            typeof site.location === 'string' && 
            typeof site.branch_location === 'string'
          ));
        }
      })
      .catch(err => {
        console.error('Error fetching sites:', err);
        setSites([]);
      });
  }, []);

  useEffect(() => {
    // Fetch feedback submissions from backend filtered by site
    const endpoint = selectedSite !== 'All Sites' 
      ? `${ENDPOINTS.ADMIN_FEEDBACK}?site=${encodeURIComponent(selectedSite)}` 
      : ENDPOINTS.ADMIN_FEEDBACK;

    fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('canteenAdminJWT')}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && (Array.isArray(data.feedback) || Array.isArray(data))) {
          const feedbackArray = Array.isArray(data.feedback) ? data.feedback : data;
          setFeedbackData(feedbackArray.map(fb => ({
            ...fb,
            responses: Array.isArray(fb.responses) ? fb.responses : [{
              rating: fb.rating,
              question_id: fb.question_id
            }],
            timestamp: fb.timestamp || Date.now()
          })).filter(fb => fb && typeof fb.site === 'string'));
        }
      })
      .catch(err => {
        console.error('Error fetching feedback:', err);
        setFeedbackData([]);
      });
  }, [selectedSite]);

  const analytics = useMemo(() => {
    if (!Array.isArray(feedbackData)) return {
      totalSubmissions: 0,
      positivePercentage: 0,
      ratingDistribution: RATINGS.map(r => ({ name: r.label, value: 0 })),
      ratingPercentages: RATINGS.map(r => ({ name: r.label, value: 0 }))
    };

    const filteredFeedback = selectedSite === 'All Sites' 
      ? feedbackData 
      : feedbackData.filter(fb => fb && fb.site === selectedSite);

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalRatings = 0;
    
    filteredFeedback.forEach(fb => {
      if (fb?.responses?.length) {
        fb.responses.forEach(response => {
          if (response && typeof response.rating === 'number') {
            ratingCounts[response.rating] = (ratingCounts[response.rating] || 0) + 1;
            totalRatings++;
          }
        });
      }
    });
    
    return {
      totalSubmissions: filteredFeedback.length,
      positivePercentage: Number(totalRatings > 0 
        ? (((ratingCounts[3] || 0) + (ratingCounts[4] || 0)) / totalRatings * 100).toFixed(1) 
        : 0),
      ratingDistribution: RATINGS.map(r => ({
        name: `${r.label} (${((ratingCounts[r.level] || 0) / totalRatings * 100).toFixed(1)}%)`,
        value: ratingCounts[r.level] || 0
      })),
      ratingPercentages: RATINGS.map(r => ({
        name: r.label,
        value: totalRatings > 0 ? ((ratingCounts[r.level] || 0) / totalRatings * 100).toFixed(1) : 0
      }))
    };
  }, [feedbackData, selectedSite]);

  const exportToCSV = () => {
    if (!feedbackData.length) return;
    
    const headers = ['Site', 'Canteen', 'Username', 'Timestamp', ...questions.map(q => q.text)];
    const rows = feedbackData.map(fb => [
      fb.site,
      fb.canteen,
      fb.username || '',
      fb.timestamp || '',
      ...fb.responses.map(r => r.rating)
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feedback_submissions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-4 w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex gap-3">
              <select 
                value={selectedSite} 
                onChange={e => setSelectedSite(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All Sites">All Sites</option>
                {sites.map((site, idx) => (
                  <option key={site.location + '-' + idx} value={site.location}>
                    {site.location} - {site.branch_location}
                  </option>
                ))}
              </select>
              <button 
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200"
              >
                Export CSV
              </button>
              <button 
                onClick={() => {
                  try { localStorage.setItem('adminSelectedSite', selectedSite || 'All Sites'); } catch (e) {}
                  window.location.hash = '#/admin/statistics'
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                View Detailed Statistics
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard 
              title="Total Submissions" 
              value={analytics.totalSubmissions.toString()} 
            />
            <StatCard 
              title="Positive Feedback" 
              value={`${analytics.positivePercentage.toFixed(1)}%`} 
              description="Ratings of 'Good' or 'Very Good'" 
            />
            <StatCard 
              title="Most Common Rating" 
              value={analytics.ratingDistribution
                .reduce((prev, current) => (prev.value > current.value) ? prev : current).name
              } 
            />
          </div>

          {/* Site-wise Pie Charts */}
          {selectedSite === 'All Sites' && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Site-wise Rating Distribution</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sites.map((site, idx) => {
                  if (!site?.location) return null;
                  
                  const siteData = feedbackData.filter(fb => 
                    fb?.site === site.location && Array.isArray(fb.responses)
                  );
                  
                  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
                  let total = 0, count = 0;
                  
                  siteData.forEach(submission => {
                    submission.responses.forEach(response => {
                      if (typeof response.rating === 'number') {
                        ratingCounts[response.rating]++;
                        total += response.rating;
                        count++;
                      }
                    });
                  });

                  const pieData = RATINGS.map(r => ({ 
                    name: r.label, 
                    value: ratingCounts[r.level] || 0 
                  }));

                  return (
                    <div key={site.location + '-' + idx} className="bg-white rounded-lg p-6 shadow-sm">
                      <h4 className="font-semibold mb-3 text-lg text-center">{site.location}</h4>
                      <h5 className="text-sm text-gray-600 mb-4 text-center">{site.branch_location}</h5>
                      <PieChartStats 
                        title="" 
                        data={pieData}
                        colors={PIE_COLORS} 
                      />
                      <div className="mt-3 text-center">
                        <div className="font-medium">
                          Avg. Rating: {count > 0 ? (total / count).toFixed(2) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Responses: {count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Canteen-wise Pie Charts */}
          {selectedSite !== 'All Sites' && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">
                Canteen-wise Rating Distribution for {selectedSite}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {canteenKeysForSelectedSite.map((canteen, idx) => {
                  const canteenData = feedbackData.filter(fb => 
                    fb.site === selectedSite && canonicalCanteen(fb) === canteen
                  );

                  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
                  let total = 0, count = 0;

                  canteenData.forEach(submission => {
                    if (Array.isArray(submission.responses)) {
                      submission.responses.forEach(response => {
                        if (typeof response.rating === 'number') {
                          ratingCounts[response.rating]++;
                          total += response.rating;
                          count++;
                        }
                      });
                    }
                  });

                  const pieData = RATINGS.map(r => ({ 
                    name: r.label, 
                    value: ratingCounts[r.level] || 0 
                  }));

                  const siteInfo = sites.find(s => s.location === selectedSite);

                  return (
                    <div key={String(canteen) + '-' + idx} className="bg-white rounded-lg p-6 shadow-sm">
                      <h4 className="font-semibold mb-3 text-lg text-center">{canteen}</h4>
                      <h5 className="text-sm text-gray-600 mb-4 text-center">
                        {siteInfo?.branch_location}
                      </h5>
                      <PieChartStats 
                        title="" 
                        data={pieData}
                        colors={PIE_COLORS} 
                      />
                      <div className="mt-3 text-center">
                        <div className="font-medium">
                          Avg. Rating: {count > 0 ? (total / count).toFixed(2) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Responses: {count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
