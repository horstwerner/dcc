import Type from './Type';
import GraphNode from './GraphNode';

export const DATATYPE_INTEGER = 'INTEGER';
export const DATATYPE_STRING = 'STRING';
export const DATATYPE_BOOLEAN = 'BOOLEAN';
export const DATATYPE_FLOAT = 'FLOAT';
export const DATATYPE_ENTITY = 'ENTITY';

export const TYPE_NAME = 'core:name';
export const TYPE_AGGREGATOR = 'core:aggregator';
export const TYPE_CONTEXTUAL_NODE = 'core:contextual';
export const TYPE_PREDECESSOR_COUNT = 'core:predecessorCount';
export const TYPE_SUCCESSOR_COUNT = 'core:successorCount';
export const TYPE_NODES = 'core:subNodes';
export const TYPE_ALL_NODES = 'core:allNodes';
export const TYPE_NODE_COUNT = 'core:nodeCount';
export const TYPE_DEPTH = 'core:depth';
export const TYPE_MIN_VALUES = 'core:minValues';
export const TYPE_MAX_VALUES = 'core:maxValues';

class Cache {

  idCount = 0;
  
  typeDic;
  lookUpByType;
  rootNode = {};

  constructor () {
    this.typeDic = {};
    this.lookUpByType = {};
    this.rootNode = {};
    this.createType({uri: TYPE_CONTEXTUAL_NODE, name: 'contextual', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_AGGREGATOR, name: 'aggregated', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_NODES, name: 'nodes', dataType: DATATYPE_ENTITY, isAssociation: true});
    this.createType({uri: TYPE_NODE_COUNT, name: 'node count', dataType: DATATYPE_INTEGER, isAssociation: false});
  };

  createUri() {
    return `core:surrogate${this.idCount++}`;
  }
  
  createType (descriptor) {
    let type = new Type(descriptor);
    this.typeDic[descriptor.uri] = type;
    if (type.dataType === DATATYPE_ENTITY && !type.isAssociation) {
      this.rootNode[descriptor.uri] = [];
      this.lookUpByType[descriptor.uri] = {};
    }
    return type;
  };

  getType (typeuri) {
    return this.typeDic[typeuri];
  };

  getNode (typeUri, uri) {
    let dictionary = this.lookUpByType[typeUri];
    if (!dictionary) {
      dictionary = {};
      this.lookUpByType[typeUri] = dictionary;
      this.rootNode[typeUri] = [];
    }
    let node = dictionary[uri];
    if (!node) {
      node = new GraphNode(typeUri, uri);
      dictionary[uri] = node;
      this.rootNode[typeUri].push(node);
    }
    return node;
  };

  getEntityTypes() {
    return Object.keys(this.rootNode);
  }
  
  getAllNodesOf (nodeType) {
    return this.rootNode[nodeType] || [];
  };

  mapAllNodesOf (nodeType, callback) {
    return (this.rootNode[nodeType] || []).map(callback);
  };

  findNode (typeUri, uri) {
    const dictionary = this.lookUpByType[typeUri];
    if (!dictionary) {
      throw new Error("Unknown type: " + typeUri);
    }
    return dictionary[uri];
  };
  
  importTypes(typeArray) {
    for (let i = 0; i < typeArray.length; i++) {
      let typeDescriptor = typeArray[i];
      this.createType(typeDescriptor);
    }
  };

  importNodeTable(typeUri, headerRow, valueRows) {
    const idIndex = Math.max(headerRow.indexOf('id'), 0);
    for (let rowIdx = 0; rowIdx < valueRows.length; rowIdx ++) {
      const row = valueRows[rowIdx];
      const nodeUri = row[idIndex];
      const newNode = this.getNode(typeUri, nodeUri);
      for (let colIdx = 0; colIdx < headerRow.length; colIdx ++) {
        let prop = headerRow[colIdx];
        let targetType;
        if (prop.includes('->')) {
          const parts = prop.split('->')
          prop = parts[0];
          targetType = parts[1];
        }
        const propType = this.getType(prop);
        if (propType && propType.dataType === DATATYPE_ENTITY) {
          const target = row[colIdx].includes('+') ? row[colIdx].split('+') : row[colIdx];
          newNode.addAssociation(propType, target, targetType);
        }
        else {
          newNode[prop] = row[colIdx];
        }
      }
    }
  }
  
  // importNodesJson(array) {
  //   for (let i = 0; i < array.length; i++) {
  //     const rawNode = array[i];
  //     const nodeType = rawNode["core:type"];
  //     if (nodeType === undefined) {
  //       throw new Error("Can't import node with missing type: " + rawNode.toString());
  //     }
  //     const nodeUri = rawNode["core:uri"];
  //     if (nodeUri === undefined) {
  //       throw new Error("Can't import node with missing uri: " + rawNode.toString());
  //     }
  //     let newNode = this.getNode(nodeType, nodeUri);
  //     for (let prop in rawNode) {
  //       if (!rawNode.hasOwnProperty(prop) || prop === 'core:type') continue;
  //       const proptype = this.getType(prop);
  //       if (proptype && proptype.isAssociation) {
  //         newNode.addAssociation(proptype, rawNode[prop]);
  //       }
  //       else {
  //         newNode[prop] = rawNode[prop];
  //       }
  //     }
  //   }
  // };
  
  // loadTypeDic(wsname, callback) {
  //   const request = new XMLHttpRequest();
  //   request.onreadystatechange =  () => {
  //     if (request.readyState === 4 && (request.status === 200 || request.status === 0)) {
  //       const response = JSON.parse(request.responseText);
  //       const dicArray = response['TypeDictionary'];
  //       this.importTypes(dicArray);
  //       callback();
  //     }
  //   };
  //   const url = 'data/dictionary.json'; //"http://localhost:8080/ws/dictionary/" + wsname
  //   request.open("GET", url, true);
  //   request.send(null);
  // };

}

const cacheInstance = new Cache();

export default cacheInstance;

export const traverse = function(source, path) {
  const steps = path.split('/');
  let curSet = new Set();

  if (source.constructor === Array) {
    for (let i = 0; i < source.length; i++) {
      let sourcenode = source[i];
      curSet.add(sourcenode);
    }
  }
  else {
    curSet.add(source);
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    let nextSet = new Set();

    curSet.forEach(node => {
          const related = node.get(step);
          if (related != null) {
            if (related.constructor === Array) {
              for (let j = 0; j < related.length; j++) {
                nextSet.add( related[j]);
              }
            }
            else if (related.constructor === GraphNode) {
              nextSet.add(related);
            }
          }
        }
    );
    curSet = nextSet;
  }
  return curSet;
};

/**
 *
 * @param {GraphNode} node
 * @param {String[] | String} path
 * @return {String | Number} resolved attribute or display name of resolved node
 */
export const resolveAttribute = function (node, path) {
  let result;

  if (Array.isArray(path) || path.includes('/')) {
    const segments = Array.isArray(path) ? path : path.split('/');
    let current = node;
    for (let segIdx = 0; segIdx < segments.length; segIdx++) {
      current = current.constructor === GraphNode ? current.get(segments[segIdx]) : current[segments[segIdx]];
      // simplistic disambiguation - if multiple, select first
      if (segIdx < segments.length - 1 && Array.isArray(current)) {
        current = current[0];
      }
    }
    result = current;
  } else {
    result = node.constructor === GraphNode ? node.get(path) : node[path];
  }

  return (result && result.constructor === GraphNode) ?
      result.displayName() :
      result;
};

