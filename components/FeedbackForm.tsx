
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ENDPOINTS } from '../constants';
import { RatingLevel, FeedbackResponse } from '../types';
import { feedbackService } from '../services/feedbackService';
import SmileyRating from './SmileyRating';

const USER_AUTH_KEY = 'canteenUserAuth';

interface FeedbackFormProps {
  jwt?: string | null;
  site?: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ jwt, site: propSite }) => {
  const [ratings, setRatings] = useState<Record<number, RatingLevel | undefined>>({});
  const [questions, setQuestions] = useState<{ id: number; question_text?: string; text?: string }[]>([]);
  
  // Add logo at the top
  const renderLogo = () => (
    <div className="flex flex-col items-center justify-center mb-6">
      <img src="https://catalystsolutions.eco/wp-content/uploads/2023/02/logo.png" alt="Catalyst Logo" className="h-16 mb-2" />
      <h2 className="text-xl font-semibold text-center text-gray-800">Canteen Feedback System</h2>
    </div>
  );
  // Auto-select site from URL query param if present
  const location = useLocation();
  const getSiteFromQuery = () => {
    const params = new URLSearchParams(location.search);
    return params.get('site') || '';
  };
  const initialSite = propSite || getSiteFromQuery();
  const [site, setSite] = useState<string>(initialSite);
  const [sites, setSites] = useState<string[]>([]);

  // Fetch dynamic site list on mount
  useEffect(() => {
  fetch(ENDPOINTS.SITES)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.sites)) {
          setSites(data.sites.map((s: any) => s.location));
        } else {
          setSites([]);
        }
      })
      .catch(() => setSites([]));
  }, []);
  // Get user info from localStorage if available
  const [userInfo] = useState<{ site: string; username: string; id?: number }>(() => {
    try {
      const auth = localStorage.getItem('canteenUserAuth');
      const jwt = localStorage.getItem('canteenUserJWT');
      if (auth && jwt) {
        // Decode JWT to get userId
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        return { ...JSON.parse(auth), id: payload.userId };
      }
      if (auth) return JSON.parse(auth);
    } catch {}
    return { site: '', username: '' };
  });
  const [canteen, setCanteen] = useState<string>('');
  const [canteens, setCanteens] = useState<string[]>([]);
  useEffect(() => {
    if (!site) return;
    // Try to fetch canteens and questions dynamically
    Promise.all([
      fetch(`${ENDPOINTS.CANTEENS}?site=${encodeURIComponent(site)}`).then(res => res.json()).catch(() => null),
      fetch(`${ENDPOINTS.QUESTIONS}?site=${encodeURIComponent(site)}`).then(res => res.json()).catch(() => null)
    ]).then(([canteenData, questionData]) => {
      setCanteens(Array.isArray(canteenData?.canteens) && canteenData.canteens.length > 0 ? canteenData.canteens : []);
      if (Array.isArray(questionData?.questions) && questionData.questions.length > 0) {
        setQuestions(questionData.questions.map(q => ({
          id: q.id,
          question_text: q.question_text ?? q.text
        })));
      } else {
        setQuestions([]);
      }
    });
  }, [site]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [username, setUsername] = useState(userInfo.username || '');

  const handleRatingChange = (questionId: number, level: RatingLevel) => {
    setRatings(prev => ({ ...prev, [questionId]: level }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site) {
      console.error('Please select a site.');
      return;
    }
    if (!canteen) {
      console.error('Please select a canteen.');
      return;
    }
    if (Object.keys(ratings).length !== questions.length) {
      console.error('Please provide feedback for all questions.');
      return;
    }
    setIsSubmitting(true);
    const responses: FeedbackResponse[] = questions.map(q => ({
      questionId: q.id,
      rating: ratings[q.id]!,
    }));
    try {
  const res = await fetch(ENDPOINTS.SUBMIT_FEEDBACK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        },
        body: JSON.stringify({ site, canteen, responses, userId: userInfo.id || null, username })
      });
      if (!res.ok) {
        console.error('Failed to submit feedback', await res.text());
      }
    } catch (err) {
      console.error('Network error', err);
    }
    setIsSubmitting(false);
    setIsSubmitted(true);
    setRatings({});
    setCanteen('');
    setUsername(userInfo.username || '');
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg text-center transition-all duration-500">
        <div className="text-6xl mb-4">🎉</div>
  <h2 className="text-3xl font-bold text-gray-800 mb-2">Thank You!</h2>
        <p className="text-gray-600">Your feedback has been submitted successfully. We appreciate you taking the time to help us improve.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg text-center">
  <h2 className="text-2xl font-bold text-gray-800 mb-2">No feedback questions found for this site.</h2>
        <p className="text-gray-600">Please contact the administrator.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 bg-gradient-to-r from-primary-50 to-primary-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center flex flex-col items-center justify-center">
          <img src="/src/images/clogo.png" alt="Catalyst Logo" className="h-16 w-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Canteen Feedback System</h1>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Share Your Feedback</h2>
          <p className="text-gray-500 text-sm">Help us improve your dining experience!</p>
        </div>
        
        <div className="text-sm font-semibold text-primary-600">
          {initialSite ? (
            <div className="text-center">
              <span>Site: <b>{initialSite}</b></span>
            </div>
          ) : (
            <div>
              <label className="block mb-2">Select Site</label>
              <select
                value={site}
                onChange={e => setSite(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
              >
                <option value="" disabled>Select a site...</option>
                {sites.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-2 rounded bg-gray-50 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Select Canteen</label>
          <select
            value={canteen}
            onChange={e => setCanteen(e.target.value)}
            required
            className="w-full p-1 rounded border border-gray-300 text-xs h-7"
          >
            <option value="" disabled>Select a canteen...</option>
            {canteens.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {questions.map((question, index) => (
          <div key={question.id} className="p-2 rounded bg-gray-50 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-1">{index + 1}. {question.question_text}</label>
            <SmileyRating
              selectedValue={ratings[question.id]}
              onChange={(level) => handleRatingChange(question.id, level)}
            />
          </div>
        ))}
        <div className="p-2 rounded bg-gray-50 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Username <span className="text-xs text-gray-400">(optional)</span></label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter your username (optional)"
            className="w-full p-1 rounded border border-gray-300 text-xs h-7"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || Object.keys(ratings).length !== questions.length || !site || !canteen}
          className="w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send-horizontal"><path d="m3 3 3 9-3 9 19-9Z"/><path d="M6 12h16"/></svg>
          )}
          <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
        </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
