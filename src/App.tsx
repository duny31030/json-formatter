import JsonEditor from "./components/JsonEditor";
import "./App.css";

function App() {
  const sampleJson = `{
  "name": "JSON格式化工具",
  "version": "1.0.0",
  "description": "一个简洁、优雅的JSON格式化工具",
  "features": [
    "JSON解析与格式化",
    "JSON压缩（去除空白）",
    "对象/数组的展开和收缩",
    "树形视图和原始视图切换",
    "实时编辑与验证"
  ],
  "settings": {
    "theme": "auto",
    "indentSize": 2,
    "autoFormat": true,
    "showLineNumbers": false
  },
  "author": {
    "name": "Tauri Developer",
    "email": "dev@tauri.app"
  }
}`;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>JSON 格式化工具</h1>
        <p className="app-subtitle">简洁、优雅、实用</p>
      </header>
      
      <main className="app-main">
        <JsonEditor 
          initialJson={sampleJson}
          height="calc(100vh - 120px)"
        />
      </main>
    </div>
  );
}

export default App;
