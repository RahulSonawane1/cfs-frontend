/// <reference types="vite/client" />

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { ENDPOINTS, FRONTEND_URL } from '../constants';
import { useAuth } from '../hooks/useAuth';

interface SiteData {
  location: string;
  branch_location: string;
}

const getQRCodeUrl = (site: string) => {
  const baseUrl = FRONTEND_URL.endsWith('/') ? FRONTEND_URL.slice(0, -1) : FRONTEND_URL;
  return `${baseUrl}/#/feedback?site=${encodeURIComponent(site)}`;
};

const QRCodePrintPage: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [sites, setSites] = useState<SiteData[]>([]);
  const [modalSite, setModalSite] = useState<string | null>(null);

  // Add print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 0;
        }
        html, body {
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        body * {
          visibility: hidden !important;
        }
        #qr-print-area, #qr-print-area * {
          visibility: visible !important;
        }
        #qr-print-area {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: 100vh !important;
          transform: none !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          background: orange !important;
          border-radius: 0 !important;
        }
        .qr-container {
          padding: 1.5rem !important;
          margin: 1rem auto !important;
          background: white !important;
          border-radius: 1rem !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch sites on component mount
  useEffect(() => {
    fetch(ENDPOINTS.SITES)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.sites)) {
          setSites(data.sites);
        } else {
          setSites([]);
        }
      })
      .catch(() => setSites([]));
  }, []);

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg py-2 mb-4 shadow flex items-center justify-center px-4">
        <h1 className="text-lg font-semibold text-white">Site QR Codes for Feedback</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => (
          <div key={site.location} className="flex flex-col items-center p-4 border rounded-lg shadow bg-gray-50 min-w-[220px] max-w-xs mx-auto relative">
            <h2 className="text-base font-semibold mb-2 text-primary-700">{site.branch_location}</h2>
            <div className="relative w-[180px] h-[180px] flex items-center justify-center">
              <div className={modalSite === site.location ? "" : "blur-sm brightness-90"} style={{ transition: 'filter 0.3s' }}>
                <QRCode value={getQRCodeUrl(site.location)} size={180} />
              </div>
              {modalSite !== site.location && (
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 text-white font-bold rounded hover:bg-opacity-50 text-xs"
                  onClick={() => setModalSite(site.location)}
                >
                  View QR Code
                </button>
              )}
            </div>
            <div className="flex flex-col items-center">
              <p className="mt-2 text-gray-600 text-xs text-center font-semibold">{site.branch_location}</p>
              <p className="mt-1 text-gray-500 text-xs break-all text-center">{getQRCodeUrl(site.location)}</p>
            </div>
          </div>
        ))}
      </div>

      {modalSite && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black opacity-50 no-print" onClick={() => setModalSite(null)} />
          <div id="qr-print-area" className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center"
            style={{ 
              background: 'orange',
              borderRadius: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              padding: '24px 18px',
              minWidth: '280px',
              maxWidth: '90vw'
            }}
          >
            <button
              className="absolute top-2 right-2 text-white bg-black bg-opacity-60 rounded-full w-8 h-8 flex items-center justify-center text-xl no-print"
              onClick={() => setModalSite(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="text-center mb-2">
              <img src="/src/images/clogo.png" alt="Catalyst Logo" className="h-20 mx-auto mb-0.5" />
            </div>
            <div className="text-center mb-2">
              <span className="block text-lg font-bold text-white tracking-wide" style={{ letterSpacing: '2px' }}>
                {sites.find(s => s.location === modalSite)?.branch_location || modalSite}
              </span>
            </div>
            <div className="text-center mb-2">
              <span className="block text-2xl font-extrabold text-white" style={{ letterSpacing: '1px', marginBottom: '4px' }}>
                SCAN ME!
              </span>
            </div>
            <div className="qr-container bg-white rounded-xl mx-auto" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <QRCode value={getQRCodeUrl(modalSite)} size={300} bgColor="#fff" fgColor="#000" />
            </div>
            <div className="text-gray-600 mb-2 break-all text-center print-show">{getQRCodeUrl(modalSite)}</div>
            <a
              href="https://www.catalystsolutions.eco/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-lg font-medium text-white hover:text-blue-100 transition-colors"
              style={{ letterSpacing: '0.5px', marginBottom: '1rem' }}
            >
              www.catalystsolutions.eco
            </a>
            <div className="mt-4 flex gap-4 justify-center no-print">
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => window.print()}
              >
                Print QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <button
          className="fixed bottom-4 right-4 px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 no-print"
          onClick={logout}
        >
          Logout
        </button>
      )}
    </div>
  );
};

export default QRCodePrintPage;
