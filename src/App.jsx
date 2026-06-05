function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">⚡ PaperPal</h1>
        <p className="text-sm text-gray-500 mb-6">AI 驱动的文献深度阅读工具</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-blue-800 mb-2">📥 下载后端程序</p>
          <p className="text-xs text-blue-700 mb-2">下载后双击运行，选文件夹，托盘图标出现后浏览器会自动打开。</p>
          <p className="text-xs text-blue-700 font-medium">然后打开 http://localhost:8000 注册使用</p>
        </div>

        <div className="space-y-3 mb-4">
          <a href="https://github.com/WLT40/Paperpal/raw/master/docs/paperpal-backend.exe"
            className="block w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            📥 线路一：GitHub 下载
          </a>
          <a href="https://pan.baidu.com/s/1xyx_iyPXjFSJ93HnfMJubQ?pwd=e6hk" target="_blank"
            className="block w-full py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            📥 线路二：百度网盘下载（提取码 e6hk）
          </a>
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <p>下载后双击运行 → 选储存文件夹 → 托盘出现 ✅</p>
          <p>浏览器打开 <code className="bg-gray-100 px-1 rounded">http://localhost:8000</code> → 注册登录 → 开始使用</p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <a href="https://github.com/WLT40" target="_blank" className="text-xs text-gray-400 hover:text-blue-500">WLT40@GitHub</a>
          <span className="text-xs text-gray-300 mx-2">|</span>
          <span className="text-xs text-gray-400">PaperPal v0.2</span>
        </div>
      </div>
    </div>
  )
}

export default App
