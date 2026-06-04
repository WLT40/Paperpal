import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAppStore from '../../stores/appStore';
import { papersApi } from '../../api/papers';
import TopBar from './TopBar';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';

export default function AppLayout({ user, onLogout }) {
  const { selectedPaperId } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: paperDetail } = useQuery({
    queryKey: ['paper', selectedPaperId],
    queryFn: () => papersApi.get(selectedPaperId),
    enabled: !!selectedPaperId,
  });

  return (
    <div className="h-screen flex flex-col bg-white">
      <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="w-64 border-r border-gray-200 flex-shrink-0">
            <LeftPanel />
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <CenterPanel />
        </div>
        {selectedPaperId && (
          <div className="w-96 border-l border-gray-200 flex-shrink-0 overflow-y-auto">
            <RightPanel paper={paperDetail} />
          </div>
        )}
      </div>
    </div>
  );
}
