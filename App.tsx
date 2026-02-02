
import React, { useState } from 'react';
import { AppView } from './types';
import Layout from './components/Layout';
import ChatView from './components/ChatView';
import VisionStudio from './components/VisionStudio';
import PresenceLive from './components/PresenceLive';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.INTELLIGENCE);

  const renderView = () => {
    switch (currentView) {
      case AppView.INTELLIGENCE:
        return <ChatView />;
      case AppView.VISION:
        return <VisionStudio />;
      case AppView.PRESENCE:
        return <PresenceLive />;
      default:
        return <ChatView />;
    }
  };

  return (
    <Layout activeView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;
