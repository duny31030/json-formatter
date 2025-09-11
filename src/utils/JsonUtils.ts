export interface JsonNode {
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  path: string;
  level: number;
  expanded?: boolean;
  children?: JsonNode[];
  index?: number;
}

export interface JsonParseError {
  message: string;
  line: number;
  column: number;
}

export interface JsonEditOperation {
  type: 'add' | 'update' | 'delete' | 'move';
  path: string;
  key?: string;
  value?: any;
  oldKey?: string;
  newPath?: string;
}

export class JsonUtils {
  static parse(jsonString: string): { data: any; error: JsonParseError | null } {
    try {
      const data = JSON.parse(jsonString);
      return { data, error: null };
    } catch (e: any) {
      const errorMatch = e.message.match(/position (\d+)/);
      const position = errorMatch ? parseInt(errorMatch[1]) : 0;
      const lines = jsonString.substring(0, position).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      return {
        data: null,
        error: {
          message: e.message,
          line,
          column
        }
      };
    }
  }

  static format(data: any, indent: number = 2): string {
    return JSON.stringify(data, null, indent);
  }

  static compact(data: any): string {
    return JSON.stringify(data);
  }

  static toJsonTree(data: any, parentPath: string = '', level: number = 0): JsonNode[] {
    const nodes: JsonNode[] = [];
    
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          const path = parentPath ? `${parentPath}[${index}]` : `[${index}]`;
          const node: JsonNode = {
            key: index.toString(),
            value: item,
            type: Array.isArray(item) ? 'array' : typeof item === 'object' && item !== null ? 'object' : typeof item,
            path,
            level,
            index,
            expanded: level < 2
          };
          
          if (node.type === 'object' || node.type === 'array') {
            node.children = this.toJsonTree(item, path, level + 1);
          }
          
          nodes.push(node);
        });
      } else {
        Object.entries(data).forEach(([key, value]) => {
          const path = parentPath ? `${parentPath}.${key}` : key;
          const node: JsonNode = {
            key,
            value,
            type: Array.isArray(value) ? 'array' : typeof value === 'object' && value !== null ? 'object' : typeof value,
            path,
            level,
            expanded: level < 2
          };
          
          if (node.type === 'object' || node.type === 'array') {
            node.children = this.toJsonTree(value, path, level + 1);
          }
          
          nodes.push(node);
        });
      }
    }
    
    return nodes;
  }

  static fromJsonTree(nodes: JsonNode[]): any {
    const result: any = Array.isArray(nodes) ? [] : {};
    
    nodes.forEach(node => {
      if (node.children && node.expanded) {
        result[node.key] = this.fromJsonTree(node.children);
      } else {
        result[node.key] = node.value;
      }
    });
    
    return result;
  }

  static findNodeByPath(nodes: JsonNode[], path: string): JsonNode | null {
    for (const node of nodes) {
      if (node.path === path) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  static applyEdit(root: JsonNode[], operation: JsonEditOperation): JsonNode[] {
    const newRoot = JSON.parse(JSON.stringify(root));
    
    switch (operation.type) {
      case 'add':
        return this._addNode(newRoot, operation);
      case 'update':
        return this._updateNode(newRoot, operation);
      case 'delete':
        return this._deleteNode(newRoot, operation);
      case 'move':
        return this._moveNode(newRoot, operation);
      default:
        return newRoot;
    }
  }

  private static _addNode(nodes: JsonNode[], operation: JsonEditOperation): JsonNode[] {
    const parentPath = operation.path.substring(0, operation.path.lastIndexOf('.'));
    const parentKey = operation.path.split('.').pop();
    
    if (!parentPath) {
      const newNode: JsonNode = {
        key: operation.key!,
        value: operation.value,
        type: typeof operation.value,
        path: operation.key!,
        level: 0
      };
      nodes.push(newNode);
      return nodes;
    }
    
    return nodes;
  }

  private static _updateNode(nodes: JsonNode[], operation: JsonEditOperation): JsonNode[] {
    const node = this.findNodeByPath(nodes, operation.path);
    if (node) {
      node.value = operation.value;
      node.type = typeof operation.value;
    }
    return nodes;
  }

  private static _deleteNode(nodes: JsonNode[], operation: JsonEditOperation): JsonNode[] {
    const parentPath = operation.path.substring(0, operation.path.lastIndexOf('.'));
    const key = operation.path.split('.').pop();
    
    if (!parentPath) {
      return nodes.filter(node => node.key !== key);
    }
    
    return nodes;
  }

  private static _moveNode(nodes: JsonNode[], operation: JsonEditOperation): JsonNode[] {
    return nodes;
  }

  static getTypeColor(type: string): string {
    const colors = {
      string: '#10b981',
      number: '#3b82f6',
      boolean: '#8b5cf6',
      null: '#6b7280',
      object: '#f59e0b',
      array: '#f59e0b'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  }

  static validatePath(path: string): boolean {
    return /^(\w+|\[\d+\])(\.(\w+|\[\d+\]))*$/.test(path);
  }
}