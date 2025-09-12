import React, { useState, useEffect, useCallback } from 'react';
import { FeedbackSubmission, Question } from '../types';
import { RATINGS, ENDPOINTS, API_URL } from '../constants';
import FeedbackChart from './FeedbackChart';

const FeedbackStatistics = () => {
  const [feedbackData, setFeedbackData] = useState<FeedbackSubmission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  // Allow preselection when navigating from Admin Dashboard
  const initialAdminSite = (() => {
    try {
      const v = localStorage.getItem('adminSelectedSite');
      if (v) { localStorage.removeItem('adminSelectedSite'); return v; }
    } catch (e) { /* ignore */ }
    return 'All Sites';
  })();
  const [selectedSite, setSelectedSite] = useState<string>(initialAdminSite || 'All Sites');
  const [sites, setSites] = useState<any[]>([]);

  // Function to fetch feedback data
  const fetchFeedbackData = useCallback(async () => {
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // First ensure we have up-to-date sites data
      const sitesRes = await fetch(ENDPOINTS.SITES, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (sitesRes.ok) {
        const sitesData = await sitesRes.json();
        if (sitesData && Array.isArray(sitesData.sites)) {
          const validSites = sitesData.sites.filter(site => 
            site && 
            typeof site.location === 'string' && 
            site.location.trim()
          );
          setSites(validSites);
        }
      }

      // Then fetch feedback data
      const endpoint = selectedSite !== 'All Sites' 
        ? `${ENDPOINTS.ADMIN_FEEDBACK}?site=${encodeURIComponent(selectedSite)}` 
        : ENDPOINTS.ADMIN_FEEDBACK;

      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data && (Array.isArray(data.feedback) || Array.isArray(data))) {
        const feedbackArray = Array.isArray(data.feedback) ? data.feedback : data;
        const processedFeedback = feedbackArray
          .filter(fb => fb && typeof fb.site === 'string')
          .map(fb => {
            try {
              let parsedResponses = [];
              if (typeof fb.responses === 'string') {
                // If responses is a JSON string, parse it
                try {
                  parsedResponses = JSON.parse(fb.responses);
                } catch (e) {
                  console.error('Error parsing responses JSON:', e);
                  parsedResponses = [];
                }
              } else if (Array.isArray(fb.responses)) {
                parsedResponses = fb.responses;
              }

              return {
                ...fb,
                responses: parsedResponses.map(r => ({
                  questionId: r.questionId || r.question_id,
                  rating: typeof r.rating === 'number' ? r.rating : parseInt(r.rating)
                })).filter(r => !isNaN(r.rating) && r.rating >= 1 && r.rating <= 4),
                timestamp: fb.timestamp || Date.now()
              };
            } catch (error) {
              console.error('Error processing feedback item:', error);
              return null;
            }
          })
          .filter(Boolean);

        console.log('Processed Feedback:', processedFeedback); // For debugging
        setFeedbackData(processedFeedback);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    }
  }, [selectedSite]);

  // Set up auto-refresh using polling
  useEffect(() => {
    const token = localStorage.getItem('canteenAdminJWT');
    if (!token) return;

    // Initial data fetch
    fetchFeedbackData();

    // Set up polling every 10 seconds
    const pollInterval = setInterval(() => {
      fetchFeedbackData();
    }, 10000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [fetchFeedbackData]);

  useEffect(() => {
    // Fetch sites
    fetch(ENDPOINTS.SITES)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.sites)) {
          const validSites = data.sites.filter(site => 
            site && 
            typeof site.location === 'string' && 
            typeof site.branch_location === 'string'
          );
          setSites(validSites);
        }
      })
      .catch(err => console.error('Error fetching sites:', err));
  }, []);

  useEffect(() => {
    fetchFeedbackData();
  }, [selectedSite, fetchFeedbackData]);

  useEffect(() => {
    // Fetch questions
    const token = localStorage.getItem('canteenAdminJWT');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // For "All Sites", we need to fetch questions from each site and combine them
    let endpoint;
    if (selectedSite === 'All Sites') {
      // If we have sites data, fetch questions for each site
      if (sites.length === 0) {
        setQuestions([]);
        return;
      }
      
      // Create promises for fetching questions from each site
      const questionPromises = sites.map(site => 
        fetch(`${ENDPOINTS.QUESTIONS}?site=${encodeURIComponent(site.location)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).then(async res => {
          if (!res.ok) {
            const errorText = await res.text();
            console.warn(`Error fetching questions for site ${site.location}:`, errorText);
            return [];
          }
          return res.json();
        }).then(data => {
          if (data && Array.isArray(data.questions)) {
            return data.questions;
          } else if (Array.isArray(data)) {
            return data;
          }
          return [];
        }).catch(err => {
          console.error(`Error fetching questions for site ${site.location}:`, err);
          return [];
        })
      );

      // Wait for all question fetches to complete
      Promise.all(questionPromises)
          .then(allSiteQuestions => {
          // Combine and deduplicate questions from all sites
          const combinedQuestions = allSiteQuestions.flat();
          const uniqueQuestions = Array.from(new Map(
            combinedQuestions.map((q: any) => [q.question_text || q.text, q])
          ).values());

          setQuestions(uniqueQuestions.map((q: any) => ({
            id: q.id || 0,
            site: q.site || '',
            question_text: q.question_text || q.text || '',
            text: q.text || q.question_text || '',
            emoji: q.emoji
          })));
        })
        .catch(err => {
          console.error('Error combining questions from all sites:', err);
          setQuestions([]);
        });
      return; // Exit early as we're handling the fetching above
    }

    // If a specific site is selected, fetch questions for that site only
    endpoint = `${ENDPOINTS.QUESTIONS}?site=${encodeURIComponent(selectedSite)}`;

    fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
        }
        return res.json();
      })
        .then(data => {
        if (data && Array.isArray(data.questions)) {
          setQuestions((data.questions as any[]).map((q: any) => ({
            id: q.id || 0,
            site: q.site || '',
            question_text: q.question_text || q.text || '',
            text: q.text || q.question_text || '',
            emoji: q.emoji
          })));
        } else if (Array.isArray(data)) {
          setQuestions((data as any[]).map((q: any) => ({
            id: q.id || 0,
            site: q.site || '',
            question_text: q.question_text || q.text || '',
            text: q.text || q.question_text || '',
            emoji: q.emoji
          })));
        } else {
          console.error('Unexpected data format:', data);
        }
      })
      .catch(err => {
        console.error('Error fetching questions:', err);
        setQuestions([]); // Reset questions on error
      });
  }, [selectedSite]);

  const calculateStats = (questionId: number) => {
    //intializing with zero
    let ratings = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalResponses = 0;
    let totalRating = 0;

    // Process only valid feedback data
    (feedbackData || []).forEach(fb => {
      try {
        // Skip invalid feedback entries
        if (!fb || !Array.isArray(fb.responses)) return;

        // For specific site, only include feedback from that site
        if (selectedSite !== 'All Sites' && fb.site !== selectedSite) return;

        fb.responses.forEach(response => {
          // Validate response object and rating
          if (!response || response.questionId !== questionId) return;
          
          const rating = Number(response.rating);
          if (rating >= 1 && rating <= 4) {
            ratings[rating] = (ratings[rating] || 0) + 1;
            totalResponses++;
            totalRating += rating;
          }
        });
      } catch (error) {
        console.error('Error processing feedback:', error);
      }
    });

    const avgRating = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 'N/A';
    return { ratings, totalResponses, avgRating };
  };

  interface SiteStats {
    [siteId: string]: {
      name: string;
      ratings: { [key: number]: number };
      totalResponses: number;
      avgRating: number | string;
    };
  }

  const calculateSiteStats = () => {
    const siteStats: SiteStats = {};
    
    // Initialize stats only for valid sites
    sites.filter(site => site && typeof site.location === 'string' && site.location.trim())
      .forEach(site => {
        const location = site.location.trim();
        siteStats[location] = {
          name: location,
          ratings: { 1: 0, 2: 0, 3: 0, 4: 0 },
          totalResponses: 0,
          avgRating: 'N/A'
        };
      });

    feedbackData.forEach(fb => {
      // Ensure feedback entry is valid
      if (!fb || typeof fb.site !== 'string' || !Array.isArray(fb.responses)) {
        return;
      }

      const siteStat = siteStats[fb.site.trim()];
      if (!siteStat) {
        return;
      }

      // Process valid responses only
      fb.responses
        .filter(response => response && typeof response.rating === 'number' && 
                response.rating >= 1 && response.rating <= 4)
        .forEach(response => {
          siteStat.ratings[response.rating] = (siteStat.ratings[response.rating] || 0) + 1;
          siteStat.totalResponses++;
        });
    });

    Object.values(siteStats).forEach(site => {
      let totalRating = 0;
      Object.entries(site.ratings).forEach(([rating, count]) => {
        totalRating += Number(rating) * count;
      });
      site.avgRating = site.totalResponses > 0 
        ? (totalRating / site.totalResponses).toFixed(2) 
        : 'N/A';
    });

    return siteStats;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
            <h1 className="text-xl sm:text-2xl font-medium text-gray-800">Feedback Statistics</h1>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-gray-600">Site:</span>
              <select 
                value={selectedSite} 
                onChange={e => setSelectedSite(e.target.value)}
                className="w-full sm:w-[160px] px-2 py-1.5 rounded-md border border-gray-300 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-700"
                style={{ WebkitAppearance: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem', paddingRight: '2rem' }}
              >
                <option value="All Sites">All Sites</option>
                {sites.map((site, idx) => (
                  <option key={site.location + '-' + idx} value={site.location}>
                    {site.location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {Array.isArray(questions) && questions.length > 0 && Array.isArray(feedbackData) ? (
            <>
              <div className="overflow-x-auto mb-8">
                <table className="min-w-full border rounded-lg overflow-hidden shadow-sm">
                  <thead>
                    <tr>
                      <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b min-w-[200px] sm:min-w-[250px] bg-gray-50">
                        Feedback Questions
                      </th>
                      {RATINGS.map(rating => (
                        <th key={rating.level} className="px-2 py-2.5 text-center border-b bg-gray-50 min-w-[70px] sm:min-w-[80px]">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-lg sm:text-xl mb-0.5">{rating.emoji}</span>
                            <span className="text-[10px] sm:text-xs font-medium text-gray-600">{rating.label}</span>
                          </div>
                        </th>
                      ))}
                      <th className="px-2 py-2.5 text-center border-b bg-blue-50/60 min-w-[70px] sm:min-w-[80px]">
                        <div className="flex flex-col items-center">
                          <span className="text-base sm:text-lg">📊</span>
                          <span className="text-[10px] sm:text-xs font-medium text-blue-700">Average</span>
                        </div>
                      </th>
                      <th className="px-2 py-2.5 text-center border-b bg-green-50/60 min-w-[70px] sm:min-w-[80px]">
                        <div className="flex flex-col items-center">
                          <span className="text-base sm:text-lg">📈</span>
                          <span className="text-[10px] sm:text-xs font-medium text-green-700">Total</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {questions.map((question, qIdx) => {
                      const { ratings, totalResponses, avgRating } = calculateStats(question.id);
                      return (
                        <tr key={qIdx} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 py-2.5 whitespace-normal text-xs sm:text-sm text-gray-900 border-r">
                            <div className="flex items-start">
                              <span className="font-semibold text-primary-600 mr-1">{qIdx + 1}.</span>
                              <span className="font-medium">{question.question_text || question.text}</span>
                            </div>
                          </td>
                          {[4, 3, 2, 1].map(level => {
                            const count = ratings[level] || 0;
                            const percentage = totalResponses > 0 
                              ? ((count / totalResponses) * 100).toFixed(1) 
                              : '0';
                            const ratingInfo = RATINGS.find(r => r.level === level);
                            return (
                              <td key={level} className="px-2 py-2.5 text-center border-r hover:bg-gray-50/50">
                                <div className="flex flex-col items-center">
                                  <div className={`text-xs sm:text-sm font-semibold ${ratingInfo?.color || 'text-gray-700'}`}>
                                    {percentage}%
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-gray-500">
                                    ({count})
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-2 py-2.5 text-center border-r bg-blue-50/60 hover:bg-blue-50">
                            <div className={`text-xs sm:text-sm font-bold ${
                              avgRating === 'N/A' ? 'text-gray-500' :
                              parseFloat(avgRating) >= 3.5 ? 'text-green-600' :
                              parseFloat(avgRating) >= 2.5 ? 'text-yellow-600' :
                              parseFloat(avgRating) >= 1.5 ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {avgRating}
                            </div>
                            <div className="text-[10px] sm:text-xs text-blue-600 font-medium mt-0.5">
                              avg
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-center border-r bg-green-50/60 hover:bg-green-50">
                            <div className="text-xs sm:text-sm font-bold text-green-600">
                              {totalResponses}
                            </div>
                            <div className="text-[10px] sm:text-xs text-green-600 font-medium mt-0.5">
                              total
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Rating Distribution Chart */}
              <div className="mt-8 bg-gray-50 p-4 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Rating Distribution</h2>
                <FeedbackChart 
                  data={(() => {
                    if (!Array.isArray(questions) || !Array.isArray(feedbackData)) return [];
                    // If 'All Sites' is selected, aggregate feedback for all questions across all sites
                    if (selectedSite === 'All Sites') {
                      return questions
                        .filter(q => q && typeof q.id !== 'undefined' && (typeof q.question_text === 'string' || typeof q.text === 'string'))
                        .map(question => {
                          // Initialize ratings with safe defaults
                          const ratings = { 1: 0, 2: 0, 3: 0, 4: 0 };
                          let totalResponses = 0;

                          // Process feedback data safely
                          (Array.isArray(feedbackData) ? feedbackData : []).forEach(fb => {
                            if (fb && Array.isArray(fb.responses)) {
                              const response = fb.responses.find(r => 
                                r && typeof r === 'object' && 
                                r.questionId === question.id &&
                                typeof r.rating === 'number' &&
                                r.rating >= 1 && r.rating <= 4
                              );
                              
                              if (response) {
                                ratings[response.rating] = (ratings[response.rating] || 0) + 1;
                                totalResponses++;
                              }
                            }
                          });

                          // Ensure we don't divide by zero
                          const total = Math.max(totalResponses, 1);
                          const questionText = ((question.question_text || question.text || 'Unknown Question') + '').trim();

                          // Calculate percentages with validation
                          const ratingCounts = {
                            4: ratings[4] || 0,
                            3: ratings[3] || 0,
                            2: ratings[2] || 0,
                            1: ratings[1] || 0
                          };

                          // Only return if question has valid text and at least one rating
                          if (questionText && Object.values(ratingCounts).some(count => count > 0)) {
                            return {
                              name: questionText.substring(0, 50),
                              Excellent: Math.min(Math.max(0, Math.round((ratingCounts[4] / total * 1000)) / 10), 100),
                              Good: Math.min(Math.max(0, Math.round((ratingCounts[3] / total * 1000)) / 10), 100),
                              Fair: Math.min(Math.max(0, Math.round((ratingCounts[2] / total * 1000)) / 10), 100),
                              Poor: Math.min(Math.max(0, Math.round((ratingCounts[1] / total * 1000)) / 10), 100)
                            };
                          }
                          return null;
                        })
                        .filter(Boolean)
                        .filter(item => 
                          item && 
                          typeof item.name === 'string' && 
                          item.name.length > 0 && 
                          ['Excellent', 'Good', 'Fair', 'Poor'].every(key => 
                            typeof item[key] === 'number' && 
                            !isNaN(item[key]) && 
                            item[key] >= 0 && 
                            item[key] <= 100
                          )
                        );
                    } else {
                      return questions
                        .filter(question => 
                          question && 
                          typeof question.id !== 'undefined' && 
                          (typeof question.question_text === 'string' || typeof question.text === 'string')
                        )
                        .map(question => {
                          const stats = calculateStats(question.id);
                          // Only proceed if we have valid stats and ratings
                          if (!stats || 
                              !stats.ratings || 
                              typeof stats.ratings !== 'object' || 
                              (!question.question_text && !question.text)) {
                            return null;
                          }

                          const total = Math.max(stats.totalResponses || 1, 1);
                          const questionText = ((question.question_text || question.text || '') + '').trim();
                          
                          // Only create data object if we have valid text
                          if (questionText) {
                            const data = {
                              name: questionText.substring(0, 50),
                              Excellent: Math.min(Math.max(0, Math.round(((stats.ratings[4] || 0) / total * 1000)) / 10), 100),
                              Good: Math.min(Math.max(0, Math.round(((stats.ratings[3] || 0) / total * 1000)) / 10), 100),
                              Fair: Math.min(Math.max(0, Math.round(((stats.ratings[2] || 0) / total * 1000)) / 10), 100),
                              Poor: Math.min(Math.max(0, Math.round(((stats.ratings[1] || 0) / total * 1000)) / 10), 100)
                            };

                            // Return only if at least one rating exists
                            if ([data.Excellent, data.Good, data.Fair, data.Poor].some(v => v > 0)) {
                              return data;
                            }
                          }
                          return null;
                        })
                        .filter(Boolean)
                        .filter(item => 
                          item && 
                          typeof item.name === 'string' && 
                          item.name.length > 0 && 
                          ['Excellent', 'Good', 'Fair', 'Poor'].every(key => 
                            typeof item[key] === 'number' && 
                            !isNaN(item[key]) && 
                            item[key] >= 0 && 
                            item[key] <= 100
                          )
                        );
                    }
                  })()}
                  title="Question-wise Rating Distribution"
                />
              </div>

              {/* Site-wise Statistics */}
              {selectedSite === 'All Sites' && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Site-wise Statistics</h2>
                  <div className="overflow-x-auto">
                    {/* Site Statistics Table */}
                    <table className="min-w-full border rounded-lg overflow-hidden shadow-sm mb-8">
                      <thead>
                        <tr>
                          <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b bg-gray-50">
                            Site Location
                          </th>
                          {RATINGS.map(rating => (
                            <th key={rating.level} className="px-2 py-2.5 text-center border-b bg-gray-50 min-w-[70px] sm:min-w-[80px]">
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-lg sm:text-xl mb-0.5">{rating.emoji}</span>
                                <span className="text-[10px] sm:text-xs font-medium text-gray-600">{rating.label}</span>
                              </div>
                            </th>
                          ))}
                          <th className="px-2 py-2.5 text-center border-b bg-blue-50/60">
                            <div className="flex flex-col items-center">
                              <span className="text-base sm:text-lg">📊</span>
                              <span className="text-[10px] sm:text-xs font-medium text-blue-700">Average</span>
                            </div>
                          </th>
                          <th className="px-2 py-2.5 text-center border-b bg-green-50/60">
                            <div className="flex flex-col items-center">
                              <span className="text-base sm:text-lg">📈</span>
                              <span className="text-[10px] sm:text-xs font-medium text-green-700">Total</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.values(calculateSiteStats()).map((site, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-900 border-r font-medium">
                              {site.name}
                            </td>
                            {[4, 3, 2, 1].map(level => (
                              <td key={level} className="px-2 py-2.5 text-center border-r hover:bg-gray-50/50">
                                <div className="flex flex-col items-center">
                                  <div className="text-xs sm:text-sm font-semibold text-gray-700">
                                    {site.totalResponses > 0 ? `${((site.ratings[level] / site.totalResponses) * 100).toFixed(1)}%` : '0%'}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-gray-500">
                                    ({site.ratings[level] || 0})
                                  </div>
                                </div>
                              </td>
                            ))}
                            <td className="px-2 py-2.5 text-center border-r bg-blue-50/60 hover:bg-blue-50">
                              <div className={`text-xs sm:text-sm font-bold ${
                                site.avgRating === 'N/A' ? 'text-gray-500' :
                                parseFloat(site.avgRating.toString()) >= 3.5 ? 'text-green-600' :
                                parseFloat(site.avgRating.toString()) >= 2.5 ? 'text-yellow-600' :
                                parseFloat(site.avgRating.toString()) >= 1.5 ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                {site.avgRating}
                              </div>
                              <div className="text-[10px] sm:text-xs text-blue-600 font-medium mt-0.5">
                                avg
                              </div>
                            </td>
                            <td className="px-2 py-2.5 text-center border-r bg-green-50/60 hover:bg-green-50">
                              <div className="text-xs sm:text-sm font-bold text-green-600">
                                {site.totalResponses}
                              </div>
                              <div className="text-[10px] sm:text-xs text-green-600 font-medium mt-0.5">
                                total
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Site Statistics Chart */}
                    <FeedbackChart 
                      data={Object.values(calculateSiteStats())
                        .filter(site => site && typeof site.name === 'string' && site.name.trim())
                        .map(site => {
                          const siteName = site.name.trim();
                          
                          // Ensure ratings is an object with numeric values
                          const ratings = site.ratings && typeof site.ratings === 'object' ? {
                            Excellent: typeof site.ratings[4] === 'number' ? site.ratings[4] : 0,
                            Good: typeof site.ratings[3] === 'number' ? site.ratings[3] : 0,
                            Fair: typeof site.ratings[2] === 'number' ? site.ratings[2] : 0,
                            Poor: typeof site.ratings[1] === 'number' ? site.ratings[1] : 0
                          } : { Excellent: 0, Good: 0, Fair: 0, Poor: 0 };

                          // Ensure totalResponses is valid
                          const totalResponses = typeof site.totalResponses === 'number' && site.totalResponses > 0 
                            ? site.totalResponses 
                            : Math.max(1, Object.values(ratings).reduce((sum, val) => sum + val, 0));

                          // Calculate percentages with strict validation
                          const percentages = Object.entries(ratings).reduce((acc, [key, value]) => ({
                            ...acc,
                            [key]: Math.min(Math.max(0, Math.round((value / totalResponses * 1000)) / 10), 100)
                          }), { name: siteName.substring(0, 50) });

                          // Only return if we have valid data
                          return Object.values(ratings).some(v => v > 0) ? percentages : null;
                        })
                        .filter(Boolean)
                        .filter(data => 
                          typeof data === 'object' && 
                          data !== null && 
                          typeof data.name === 'string' && 
                          ['Excellent', 'Good', 'Fair', 'Poor'].every(key => 
                            typeof data[key] === 'number' && 
                            !isNaN(data[key]) && 
                            data[key] >= 0 && 
                            data[key] <= 100
                          )
                        )}
                      title="Site-wise Rating Distribution"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No questions available for {selectedSite === 'All Sites' ? 'any site' : selectedSite}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackStatistics;
