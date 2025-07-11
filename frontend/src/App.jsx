import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from "react-router-dom";
import StoreSelection from "./components/StoreSelection";
import SectionSelection from "./components/SectionSelection";
import Assessment from "./components/Assessment";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import { STORES, SECTIONS, QUESTIONS, STORE_FOUNDATIONS } from "./data/osrData";
import apiService from "./utils/apiService";
import "./App.css";

// Wrapper component for SectionSelection to handle navigation
function SectionSelectionWrapper({ sections, responses, storeProgress }) {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const handleSectionSelect = (sectionId) => {
    navigate(`/assessment/${storeId}/${sectionId}`);
  };

  const handleNavigateToStores = () => {
    navigate('/');
  };

  return (
    <SectionSelection 
      store={storeId}
      sections={sections}
      storeFoundations={STORE_FOUNDATIONS}
      onSectionSelect={handleSectionSelect}
      onNavigateToStores={handleNavigateToStores}
      responses={responses}
      storeProgress={storeProgress}
    />
  );
}

// Wrapper component for Assessment to handle navigation and params
function AssessmentWrapper({ questions, onSaveResponse, onGetResponse, onFinish, storeProgress, onRefreshProgress }) {
  const { storeId, sectionId } = useParams();
  const navigate = useNavigate();

  const handleFinish = () => {
    navigate(`/sections/${storeId}`);
  };

  const handleNavigateToSections = () => {
    navigate(`/sections/${storeId}`);
  };

  const handleNavigateToStores = () => {
    navigate('/');
  };

  // ENHANCED: Get the questions for the specific section with Foundation questions
  const processCheckQuestions = questions[sectionId]?.processCheck || [];
  const foundationQuestions = questions[sectionId]?.foundations || [];
  
  // Check if this store has Foundation questions for this section
  const storeFoundations = STORE_FOUNDATIONS[storeId] || [];
  const hasFoundationQuestions = storeFoundations.includes(sectionId);
  
  // FIXED: Combine Process Check and Foundation questions when appropriate
  const sectionQuestions = hasFoundationQuestions 
    ? [...processCheckQuestions, ...foundationQuestions]
    : processCheckQuestions;
  
  // Enhanced debug logging
  console.log(`🔍 FOUNDATION DEBUG - Store ${storeId}, Section ${sectionId}:`, {
    processCheck: processCheckQuestions.length,
    foundations: foundationQuestions.length,
    storeFoundations: storeFoundations,
    hasFoundationQuestions,
    total: sectionQuestions.length,
    questionIds: sectionQuestions.map(q => q.id)
  });

  // Additional validation
  if (hasFoundationQuestions && foundationQuestions.length === 0) {
    console.warn(`⚠️ Store ${storeId} should have Foundation questions for ${sectionId} but none found!`);
  }

  return (
    <Assessment 
      store={storeId}
      section={sectionId}
      questions={sectionQuestions}
      sectionInfo={SECTIONS[sectionId]}
      onSaveResponse={onSaveResponse}
      onGetResponse={onGetResponse}
      onFinish={handleFinish}
      onNavigateToSections={handleNavigateToSections}
      onNavigateToStores={handleNavigateToStores}
      onRefreshProgress={onRefreshProgress}
    />
  );
}

function AppContent() {
  const [responses, setResponses] = useState({});
  const [storeProgress, setStoreProgress] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ isHealthy: false });
  const navigate = useNavigate();

  // Load store progress on app start
  useEffect(() => {
    const loadStoreProgress = async () => {
      try {
        setIsLoading(true);
        const progressData = {};
        
        for (const storeId of STORES) {
          try {
            const result = await apiService.getStoreScore(storeId);
            if (result.success && result.score) {
              progressData[storeId] = result.score;
            } else {
              progressData[storeId] = {
                overall_percentage: 0,
                overall_score: 0,
                overall_max_score: 46,
                overall_color: 'red',
                section_scores: {}
              };
            }
          } catch (error) {
            console.warn(`Failed to load progress for store ${storeId}:`, error);
            progressData[storeId] = {
              overall_percentage: 0,
              overall_score: 0,
              overall_max_score: 46,
              overall_color: 'red',
              section_scores: {}
            };
          }
        }
        
        setStoreProgress(progressData);
        console.log('Loaded store progress:', progressData);
      } catch (error) {
        console.error('Error loading store progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoreProgress();
  }, []);

  // Update backend status
  useEffect(() => {
    const updateBackendStatus = () => {
      setBackendStatus(apiService.getBackendStatus());
    };
    
    updateBackendStatus();
    const interval = setInterval(updateBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSaveResponse = async (store, section, questionId, procedureIndex, response) => {
    try {
      const responseKey = `${questionId}-${procedureIndex}`;
      
      // Update local state immediately
      setResponses(prev => ({
        ...prev,
        [responseKey]: response
      }));

      // Save to localStorage as backup
      const storageKey = `osr_response_${store}_${section}_${questionId}_${procedureIndex}`;
      localStorage.setItem(storageKey, JSON.stringify(response));

      // Save to API
      const result = await apiService.saveResponse(store, section, questionId, procedureIndex, response);
      if (!result.success) {
        console.warn('Failed to save to API, but saved locally');
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving response:', error);
      return { success: false, error: error.message };
    }
  };

  const handleGetResponse = (store, section, questionId, procedureIndex) => {
    const responseKey = `${questionId}-${procedureIndex}`;
    return responses[responseKey] || null;
  };

  const handleFinish = () => {
    navigate('/');
  };

  const handleRefreshProgress = async () => {
    // Refresh progress for current store only to avoid excessive API calls
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/');
    
    if (pathParts.length >= 3 && pathParts[1] === 'assessment') {
      const currentStore = pathParts[2];
      
      try {
        const result = await apiService.getStoreScore(currentStore);
        if (result.success && result.score) {
          setStoreProgress(prev => ({
            ...prev,
            [currentStore]: result.score
          }));
        }
      } catch (error) {
        console.warn(`Failed to refresh progress for store ${currentStore}:`, error);
      }
    }
  };

  const handleStoreSelect = (storeId) => {
    navigate(`/sections/${storeId}`);
  };

  return (
    <div className="App">
      <ErrorBoundary>
        <Header backendStatus={backendStatus} />
        <Routes>
          <Route 
            path="/" 
            element={
              <StoreSelection 
                stores={STORES}
                onStoreSelect={handleStoreSelect}
                storeProgress={storeProgress}
                isLoading={isLoading}
              />
            } 
          />
          <Route 
            path="/sections/:storeId" 
            element={
              <SectionSelectionWrapper 
                sections={SECTIONS}
                responses={responses}
                storeProgress={storeProgress}
              />
            } 
          />
          <Route 
            path="/assessment/:storeId/:sectionId" 
            element={
              <AssessmentWrapper 
                questions={QUESTIONS}
                onSaveResponse={handleSaveResponse}
                onGetResponse={handleGetResponse}
                onFinish={handleFinish}
                storeProgress={storeProgress}
                onRefreshProgress={handleRefreshProgress}
              />
            } 
          />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

