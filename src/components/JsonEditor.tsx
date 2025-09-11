import React, { useState, useCallback, useMemo } from 'react';
import { JsonUtils, JsonNode, JsonParseError } from '../utils/JsonUtils';
import './JsonEditor.css';

interface JsonEditorProps {
  initialJson?: string;
  height?: string;
  readOnly?: boolean;
}

const JsonEditor: React.FC<JsonEditorProps> = ({
  initialJson = '{\n  "name": "示例",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.0.0",\n    "typescript": "^4.5.0"\n  }\n}',
  height = '600px',
  readOnly = false
}) => {
  const [jsonInput, setJsonInput] = useState(initialJson);
  const [jsonTree, setJsonTree] = useState<JsonNode[]>([]);
  const [error, setError] = useState<JsonParseError | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  const [isEditing, setIsEditing] = useState(false);

  const parseJson = useCallback((jsonString: string) => {
    const { data, error } = JsonUtils.parse(jsonString);
    
    if (error) {
      setError(error);
      setJsonTree([]);
      return;
    }
    
    setError(null);
    const tree = JsonUtils.toJsonTree(data);
    setJsonTree(tree);
  }, []);

  React.useEffect(() => {
    parseJson(jsonInput);
  }, [parseJson]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonInput(value);
    
    if (viewMode === 'raw') {
      parseJson(value);
    }
  };

  const formatJson = () => {
    if (error) return;
    const formatted = JsonUtils.format(JSON.parse(jsonInput));
    setJsonInput(formatted);
  };

  const compactJson = () => {
    if (error) return;
    const compacted = JsonUtils.compact(JSON.parse(jsonInput));
    setJsonInput(compacted);
  };

  const toggleNode = (path: string) => {
    const updateExpanded = (nodes: JsonNode[]): JsonNode[] => {
      return nodes.map(node => {
        if (node.path === path) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateExpanded(node.children) };
        }
        return node;
      });
    };
    
    setJsonTree(prev => updateExpanded(prev));
  };

  const renderNode = (node: JsonNode, isArray = false): React.ReactNode => {
    const indent = node.level * 20;
    const isExpandable = node.type === 'object' || node.type === 'array';
    
    return (
      <div key={node.path} className="json-node">
        <div 
          className="json-node-content"
          style={{ paddingLeft: `${indent}px` }}
        >
          {isExpandable && (
            <button
              className="expand-btn"
              onClick={() => toggleNode(node.path)}
            >
              {node.expanded ? '▼' : '▶'}
            </button>
          )}
          
          {!isExpandable && <span className="no-expand-spacer" />}
          
          <span className="json-key">
            {isArray ? `[${node.key}]` : `"${node.key}"`}
          </span>
          
          <span className="json-colon">:</span>
          
          {isExpandable && node.expanded ? (
            <span className="json-bracket">
              {node.type === 'object' ? '{' : '['}
            </span>
          ) : isExpandable ? (
            <span className="json-bracket">
              {node.type === 'object' ? '{...}' : '[...]'}
            </span>
          ) : (
            <span 
              className="json-value" 
              style={{ color: JsonUtils.getTypeColor(node.type) }}
            >
              {typeof node.value === 'string' ? `"${node.value}"` : node.value}
            </span>
          )}
        </div>
        
        {isExpandable && node.expanded && node.children && (
          <div className="json-children">
            {node.children.map((child, index) => 
              renderNode(child, node.type === 'array')
            )}
            <div 
              className="json-node-content"
              style={{ paddingLeft: `${indent}px` }}
            >
              <span className="json-bracket">
                {node.type === 'object' ? '}' : ']'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const toggleEditMode = () => {
    if (isEditing) {
      parseJson(jsonInput);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="json-editor" style={{ height }}>
      <div className="json-editor-header">
        <div className="view-mode-toggle">
          <button
            className={viewMode === 'tree' ? 'active' : ''}
            onClick={() => setViewMode('tree')}
          >
            树视图
          </button>
          <button
            className={viewMode === 'raw' ? 'active' : ''}
            onClick={() => setViewMode('raw')}
          >
            原始视图
          </button>
        </div>
        
        <div className="json-actions">
          {viewMode === 'tree' && (
            <>
              <button onClick={formatJson} disabled={!!error}>
                格式化
              </button>
              <button onClick={compactJson} disabled={!!error}>
                压缩
              </button>
            </>
          )}
          <button onClick={toggleEditMode}>
            {isEditing ? '应用' : '编辑'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="json-error">
          JSON解析错误 (行 {error.line}, 列 {error.column}): {error.message}
        </div>
      )}
      
      {viewMode === 'tree' ? (
        <div className="json-tree-view">
          {isEditing ? (
            <textarea
              className="json-textarea"
              value={jsonInput}
              onChange={handleInputChange}
              spellCheck={false}
              style={{ height: `calc(${height} - 60px)` }}
            />
          ) : (
            <div className="json-tree-container">
              {jsonTree.map(node => renderNode(node))}
            </div>
          )}
        </div>
      ) : (
        <textarea
          className="json-textarea"
          value={jsonInput}
          onChange={handleInputChange}
          spellCheck={false}
          style={{ height: `calc(${height} - 60px)` }}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};

export default JsonEditor;