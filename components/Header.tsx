
import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto flex items-center justify-center py-4">
        <div className="text-center">
          <img src="/src/images/clogo.png" alt="Catalyst Logo" className="h-10 mx-auto mb-1" />
          <h1 className="text-xl font-bold text-gray-900">Canteen Feedback System</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
