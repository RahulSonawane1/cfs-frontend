import React from 'react';
import { RATINGS } from '../constants';
import { RatingLevel } from '../types';

interface SmileyRatingProps {
  selectedValue?: RatingLevel;
  onChange: (level: RatingLevel) => void;
}

const SmileyRating: React.FC<SmileyRatingProps> = ({ selectedValue, onChange }) => {
  return (
    <div
      className="flex flex-row items-center justify-center w-full"
      style={{ gap: '1.5em', flexWrap: 'nowrap', overflow: 'visible', minWidth: 0 }}
    >
      {RATINGS.map(({ level, label, emoji, color }) => (
        <div key={level} className="flex flex-col items-center justify-center" style={{ minWidth: '48px' }}>
          <button
            type="button"
            onClick={() => onChange(level)}
            className={`text-3xl md:text-4xl p-1 rounded-full transition-all duration-300 focus:outline-none ${selectedValue === level ? 'bg-primary-100 scale-110 ring-2 ring-primary-500' : 'hover:scale-125'}`}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color:
                level === 4 ? '#22c55e' : // green
                level === 3 ? '#eab308' : // yellow
                level === 2 ? '#f97316' : // orange
                level === 1 ? '#ef4444' : // red
                undefined
            }}
          >
            {emoji}
          </button>
          <span className={`mt-1 block text-xs font-medium transition-colors ${selectedValue === level ? color : 'text-gray-500'}`} style={{ textAlign: 'center', maxWidth: '60px' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SmileyRating;
