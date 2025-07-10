import React from 'react';
import { ChevronLeft, Home, Building2, Wifi, WifiOff } from 'lucide-react';
import osrLogo from '../assets/OSR_LOGO.jpg';

const Header = ({ selectedStore, selectedSection, onBackToStores, onBackToSections, backendStatus }) => {
  return (
    <header className="header-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <img 
              src={osrLogo} 
              alt="OSR Logo" 
              className="h-10 w-auto"
            />
            <div>
              <h1 className="heading-primary text-2xl">Market 448 OSR Scoring Tool</h1>
              <p className="text-blue-100 text-sm">Operating System Review - Q2 FY2026</p>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-4">
            {selectedStore && (
              <>
                <button
                  onClick={onBackToStores}
                  className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors duration-200"
                >
                  <Home className="h-4 w-4" />
                  <span className="text-sm">All Stores</span>
                </button>
                
                <ChevronLeft className="h-4 w-4 text-blue-200" />
                
                <div className="flex items-center space-x-2 text-white">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Store {selectedStore}</span>
                </div>
                
                {selectedSection && (
                  <>
                    <ChevronLeft className="h-4 w-4 text-blue-200" />
                    <button
                      onClick={onBackToSections}
                      className="text-blue-100 hover:text-white transition-colors duration-200"
                    >
                      <span className="text-sm">Sections</span>
                    </button>
                    <ChevronLeft className="h-4 w-4 text-blue-200" />
                    <span className="text-sm font-medium text-white capitalize">
                      {selectedSection.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Backend API Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              backendStatus?.isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {backendStatus?.isHealthy ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span className="font-medium">
                {backendStatus?.isHealthy ? 'Backend API Connected' : 'Backend API Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

