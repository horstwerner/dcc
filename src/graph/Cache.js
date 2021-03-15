import {mapValues} from 'lodash';
import Type from './Type';
import GraphNode from './GraphNode';

export const DATATYPE_INTEGER = 'INTEGER';
export const DATATYPE_STRING = 'STRING';
export const DATATYPE_BOOLEAN = 'BOOLEAN';
export const DATATYPE_FLOAT = 'FLOAT';
export const DATATYPE_ENTITY = 'ENTITY';

export const TYPE_NAME = 'core:name';
export const TYPE_THING = 'core:thing'; // fallback type
export const TYPE_AGGREGATOR = 'core:aggregator';
export const TYPE_CONTEXTUAL_NODE = 'core:contextual';
export const TYPE_PREDECESSOR_COUNT = 'core:predecessorCount';
export const TYPE_SUCCESSOR_COUNT = 'core:successorCount';
export const TYPE_NODES = 'core:subNodes';
export const TYPE_TYPE = 'core:type';
export const TYPE_CONTEXT = 'core:context';
export const TYPE_NODE_COUNT = 'core:nodeCount';
export const TYPE_DEPTH = 'core:depth';

class Cache {

  idCount = 0;

  config;
  typeDic;
  lookUpGlobal;
  rootNode = {};

  constructor () {
    this.typeDic = {};
    this.lookUpGlobal = {};
    this.rootNode = {};
    this.config = null;
    this.createType({uri: TYPE_CONTEXTUAL_NODE, name: 'contextual', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_AGGREGATOR, name: 'aggregated', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_NODES, name: 'nodes', dataType: DATATYPE_ENTITY, isAssociation: true});
    this.createType({uri: TYPE_THING, name: 'thing', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_NODE_COUNT, name: 'node count', dataType: DATATYPE_INTEGER, isAssociation: false});
  };

  setConfig(config) {
    this.config = config;
    if (!this.config.displayNameAttribute){
      this.config.displayNameAttribute = 'core:name';
    }
  }

  getConfig() {
    return this.config;
  }

  createUri() {
    return `core:surrogate${this.idCount++}`;
  }

  createType (descriptor) {
    let type = new Type(descriptor);
    this.typeDic[descriptor.uri] = type;
    if (type.dataType === DATATYPE_ENTITY && !type.isAssociation) {
      this.rootNode[descriptor.uri] = [];
    }
    return type;
  };

  getType (typeuri) {
    return this.typeDic[typeuri];
  };

  getNode (typeUri, uri) {
    if (typeUri && !this.rootNode[typeUri]) {
      this.rootNode[typeUri] = [];
    }
    let node = this.lookUpGlobal[uri];
    if (!node) {
      node = new GraphNode(typeUri, uri);
      this.lookUpGlobal[uri] = node;
      if (typeUri) {
        this.rootNode[typeUri].push(node);
      }
    } else if (!node.type && typeUri) { // node definition after importing reference
      node.setType(typeUri);
      this.rootNode[typeUri].push(node);
    }
    return node;
  };

  getNodeByUniqueKey(key) {
    //separate first segment of path from rest
    const parts = key.split(/\/(.+)/);

    return this.getNode(parts[0], parts[1]);
  }

  getEntityTypes() {
    return Object.keys(this.rootNode);
  }

  getAllNodesOf (nodeType) {
    return this.rootNode[nodeType] || [];
  };

  mapAllNodesOf (nodeType, callback) {
    return (this.rootNode[nodeType] || []).map(callback);
  };

  search(searchTerm) {

    const searchString = searchTerm.toLowerCase().replace(String.fromCharCode(160), ' ');

    const typeHits = mapValues(this.rootNode, (value) => value.filter(node => {
      const name = node.getDisplayName();
         return !!name && String(name).toLowerCase().includes(searchString)}
         ));

    return Object.keys(typeHits).filter(typeUri => typeHits[typeUri].length > 0).map(typeUri => ({
      nodeType: this.getType(typeUri),
      results: typeHits[typeUri]
    }));
  }

  importTypes(typeArray) {
    for (let i = 0; i < typeArray.length; i++) {
      let typeDescriptor = typeArray[i];
      this.createType(typeDescriptor);
    }
    Object.values(this.typeDic).forEach(type => {
      if (type.subclassOf) {
        const superType = this.typeDic[type.subclassOf];
        if (!superType) {
          throw new Error(`Type ${type.uri} declares nonexistent super type ${type.subclassOf}`);
        }
        type.superType = superType;
      }
    })
  };

  importNodes(nodeArray) {
    if (!nodeArray) {
      console.log('Warning: Cache.importNodes called without argument');
      return;
    }
    nodeArray.forEach(rawNode => {
      const { id, type } = rawNode;
      const node = this.getNode(type, id);
      Object.keys(rawNode).forEach(propUri => {
        if (propUri === 'id' || propUri === 'type') return;
        const propType = this.getType(propUri);
        if (!propType) {
          throw new Error(`Property type ${propUri} not declared in data dictionary`);
        }
        switch (propType.dataType) {
          case DATATYPE_ENTITY:
            node.addAssociation(propType, rawNode[propUri], null);
            break;
          case DATATYPE_INTEGER:
          case DATATYPE_FLOAT:
            node[propUri] = Number(rawNode[propUri]);
            break;
          case DATATYPE_BOOLEAN:
            node[propUri] = Boolean(rawNode[propUri]);
            break;
          default:
            node[propUri] = String(rawNode[propUri]);
        }
      })
    });
  }

  importNodeTable(typeUri, headerRow, valueRows) {
    const idIndex = Math.max(headerRow.indexOf('id'), 0);
    for (let rowIdx = 0; rowIdx < valueRows.length; rowIdx ++) {
      const row = valueRows[rowIdx];
      const nodeUri = row[idIndex];
      const newNode = this.getNode(typeUri, nodeUri);
      for (let colIdx = 0; colIdx < headerRow.length; colIdx ++) {
        if (row[colIdx] == null || row[colIdx] === '') continue;
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
          if (propType) {
            newNode.setAttribute(propType, row[colIdx]);
          } else {
            console.warn(`Ignoring attribute of unknown type ${prop}`);
          }
        }
      }
    }
  }

  validateNodes() {
    Object.values(this.lookUpGlobal).forEach(node => {
      if (!node.type) {
        console.error(`node ${node.uri} has no type`);
      }
    });
  }
}

const cacheInstance = new Cache();

export default cacheInstance;

export const traverse = function(source, path) {
  const steps = path.split('/');
  let curSet = new Set(Array.isArray(source) ? source : [source]);

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

export const resolve = function (node, path) {

  if (path.charAt(0) === '~') {
    return cacheInstance.getAllNodesOf(path.substring(1));
  }  else if (path.charAt(0) === '#') {
    return cacheInstance.getNode(null, path.substring(1));
  }
  else {
    return resolveProperty(node, path);
  }

}

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

/**
 *
 * @param {GraphNode} node
 * @param {String[] | String} path
 * @return {String | Number} resolved attribute or resolved node
 */
export const resolveProperty = function (node, path) {
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

  return result;
};

