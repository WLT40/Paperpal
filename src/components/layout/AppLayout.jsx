import { useState, useCallback } from 'react';
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
  const [leftWidth, setLeftWidth] = useState(256);
  const [rightWidth, setRightWidth] = useState(384);

  const { data: paperDetail } = useQuery({
    queryKey: ['paper', selectedPaperId],
    queryFn: () => papersApi.get(selectedPaperId),
    enabled: !!selectedPaperId,
  });

  // Drag handlers for resizable panels
  const dragLeft = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = leftWidth
    const onMove = (ev) => { setLeftWidth(Math.max(180, Math.min(500, startW + ev.clientX - startX))) }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [leftWidth])

  const dragRight = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = rightWidth
    const onMove = (ev) => { setRightWidth(Math.max(280, Math.min(700, startW - ev.clientX + startX))) }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [rightWidth])

  return (
    <div className="h-screen flex flex-col bg-white">
      <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <>
            <div style={{ width: leftWidth, flexShrink: 0 }} className="border-r border-gray-200">
              <LeftPanel />
            </div>
            <div onMouseDown={dragLeft}
              className="w-1 bg-transparent hover:bg-blue-300 cursor-col-resize flex-shrink-0 transition-colors" />
          </>
        )}
        <div className="flex-1 overflow-hidden">
          <CenterPanel />
        </div>
        {selectedPaperId && (
          <>
            <div onMouseDown={dragRight}
              className="w-1 bg-transparent hover:bg-blue-300 cursor-col-resize flex-shrink-0 transition-colors" />
            <div style={{ width: rightWidth, flexShrink: 0 }} className="border-l border-gray-200 overflow-y-auto">
              <RightPanel paper={paperDetail} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
