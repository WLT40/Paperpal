import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { api } from './api/client';
import LoginPage from './components/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!backendOnline) return;
    const token = api.getToken();
    if (token) {
      fetch('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setUser(data))
        .catch(() => api.clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    const handler = () => setUser(null);
    window.addEventListener('paperpal-auth-error', handler);
    return () => window.removeEventListener('paperpal-auth-error', handler);
  }, [backendOnline]);

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-400">正在连接本地服务...</p></div>;

  if (!backendOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">📋 PaperPal</h1>
          <p className="text-sm text-gray-500 mb-6">AI 驱动的文献深度阅读工具</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-yellow-800 mb-2">⚡ 未检测到本地服务</p>
            <p className="text-xs text-yellow-700">请先下载并运行 PaperPal 后端程序，选择储存路径后刷新页面。</p>
          </div>
          <div className="space-y-2 mb-4">
            <a href="https://github.com/WLT40/Paperpal/raw/master/public/paperpal-backend.exe"
              className="block w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              📥 线路一：GitHub 下载
            </a>
            <a href="https://pan.baidu.com/s/1ux8Zhjc300sW3rPgUe1UqA?pwd=y2mc" target="_blank"
              className="block w-full py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              📥 线路二：百度网盘下载（提取码 y2mc）
            </a>
          </div>
          <p className="text-xs text-gray-400">下载后双击运行，选择任意文件夹储存数据，然后刷新网页即可使用。</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-400">加载中...</p></div>;
  if (!user) return <LoginPage onLogin={setUser} />;
  return <Routes><Route path="/*" element={<AppLayout user={user} onLogout={() => { api.clearToken(); setUser(null); }} />} /></Routes>;
}

export default App;
