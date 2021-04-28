import {mapValues} from 'lodash';
import TypeDictionary, {
  DATATYPE_BOOLEAN,
  DATATYPE_ENTITY,
  DATATYPE_FLOAT,
  DATATYPE_INTEGER,
  TYPE_THING
} from './TypeDictionary';
import GraphNode from './GraphNode';
import {LOG_LEVEL_PATHS, LOG_LEVEL_RESULTS} from "@/components/Constants";
import {describeSource} from "@symb/util";

class Cache {

  idCount = 0;

  config;
  lookUpGlobal;
  rootNode = {};
  entityTypes = [];

  constructor () {
    this.lookUpGlobal = {};
    this.rootNode = new GraphNode(TYPE_THING, 'core:root');
    this.config = null;
  };

  createUri() {
    return `core:surrogate${this.idCount++}`;
  }

  createType(descriptor) {
    const type = TypeDictionary.createType(descriptor);
    if (type.dataType === DATATYPE_ENTITY && !type.isAssociation) {
      this.rootNode.set(descriptor.uri, []);
      this.entityTypes.push(descriptor.uri);
    }
    return type;
  }

  getEntityTypes() {
    return this.entityTypes;
  }


  getNodeByUri (uri) {
    return this.lookUpGlobal[uri];
  };


  getNode (typeUri, uri) {
    if (typeUri && !this.rootNode.get(typeUri)) {
      this.rootNode.set(typeUri, []);
    }
    let node = this.lookUpGlobal[uri];
    if (!node) {
      node = new GraphNode(typeUri, uri);
      this.lookUpGlobal[uri] = node;
      if (typeUri) {
        this.rootNode.get(typeUri).push(node);
      }
    } else if (!node.type && typeUri) { // node definition after importing reference
      node.setType(typeUri);
      this.rootNode.get(typeUri).push(node);
    }
    return node;
  };

  getNodeByUniqueKey(key) {
    //separate first segment of path from rest
    const parts = key.split(/\/(.+)/);

    return this.getNode(parts[0], parts[1]);
  }

  getAllNodesOf (nodeType) {
    let type = TypeDictionary.getType(nodeType);
    let result = [...this.rootNode.get(nodeType)] || [];
    type.subTypes.forEach(subType => result.push(...this.getAllNodesOf(subType.uri)));
    return result;
  };

  search(searchTerm) {

    const searchString = searchTerm.toLowerCase().replace(String.fromCharCode(160), ' ');

    const typeHits = mapValues(this.rootNode.properties, (value) => value.filter(node => {
      const name = node.getDisplayName();
      return !!name && String(name).toLowerCase().includes(searchString)}
    ));

    return Object.keys(typeHits).filter(typeUri => typeHits[typeUri].length > 0).map(typeUri => ({
      nodeType: TypeDictionary.getType(typeUri),
      results: typeHits[typeUri]
    }));
  }

  importTypes(typeArray) {
    for (let i = 0; i < typeArray.length; i++) {
      let typeDescriptor = typeArray[i];
      this.createType(typeDescriptor);
    }
    TypeDictionary.resolveSuperTypes();
  };

  importNodeData(node, rawNode) {
    Object.keys(rawNode).forEach(propUri => {
      if (propUri === 'id' || propUri === 'type') return;
      const propType = TypeDictionary.getType(propUri);
      if (!propType) {
        throw new Error(`Property type ${propUri} not declared in data dictionary`);
      }
      switch (propType.dataType) {
        case DATATYPE_ENTITY:
          node.addAssociation(propType, rawNode[propUri], null);
          break;
        case DATATYPE_INTEGER:
        case DATATYPE_FLOAT:
          node.set(propUri, Number(rawNode[propUri]));
          break;
        case DATATYPE_BOOLEAN:
          node.set(propUri, Boolean(rawNode[propUri]));
          break;
        default:
          node.set(propUri, String(rawNode[propUri]));
      }
    })
  }

  importNodes(nodeArray) {
    if (!nodeArray) {
      console.log('Warning: Cache.importNodes called without argument');
      return;
    }
    nodeArray.forEach(rawNode => {
      const { id, type } = rawNode;
      const node = this.getNode(type, id);
      this.importNodeData(node, rawNode);
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
        const propType = TypeDictionary.getType(prop);
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
        console.warn(`node ${node.uri} has no type`);
      }
    });
  }
}

const cacheInstance = new Cache();

export default cacheInstance;

const getSegmentData = function getSegmentData(current, segment) {
  if (segment.charAt(0) === '~') {
    return  cacheInstance.getAllNodesOf(segment.substring(1));
  } else if (segment.charAt(0) === '#') {
    return cacheInstance.getNode(null, segment.substring(1));
  } else {
    return GraphNode.isGraphNode(current) ? current.get(segment) : current[segment];
  }
}

export const traverse = function(source, path, logLevel) {
  if (logLevel === LOG_LEVEL_PATHS) {
    console.log (`resolving ${path}:`);
  }
  const steps = path.split('/');
  let curSet = new Set(Array.isArray(source) ? source : [source]);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    let nextSet = new Set();

    curSet.forEach(node => {
          const related = getSegmentData(node, step);
          if (related != null) {
            if (Array.isArray(related)) {
              for (let j = 0; j < related.length; j++) {
                nextSet.add( related[j]);
              }
            }
            else if (GraphNode.isGraphNode(related)) {
              nextSet.add(related);
            }
          }
        }
    );
    if (logLevel === LOG_LEVEL_PATHS) {
      console.log(`   ${step}: ${describeSource(Array.from(nextSet))}`);
    }
    curSet = nextSet;
  }
  if (logLevel === LOG_LEVEL_RESULTS) {
    console.log(describeSource(Array.from(curSet)));
  }
  return curSet;
};

export const resolve = function (node, path, logLevel) {
  if (path === 'this') return node;
  if (path.includes('/')) {
    return Array.from(traverse(node, path, logLevel));
  }
  return resolveProperty(node, path, logLevel);
}

/**
 *
 * @param {GraphNode} node
 * @param {String[] | String} path
 * @return {String | Number} resolved attribute or display name of resolved node
 */
export const resolveAttribute = function (node, path) {
  const result = resolveProperty(node, path, null);

  return (GraphNode.isGraphNode(result)) ?
      result.getDisplayName() :
      result;
};

/**
 *
 * @param {GraphNode} node
 * @param {String[] | String} path
 * @param {string} logLevel
 * @return {String | Number | Object} resolved attribute or resolved node
 */
export const resolveProperty = function (node, path, logLevel) {
  let result;
  if (logLevel === LOG_LEVEL_PATHS) {
    console.log (`resolving ${path}:`);
  }
  if (Array.isArray(path) || path.includes('/')) {
    const segments = Array.isArray(path) ? path : path.split('/');
    let current = node;
    for (let segIdx = 0; segIdx < segments.length; segIdx++) {
      if (!current) break;
      current = getSegmentData(current, segments[segIdx]);
      if (logLevel === LOG_LEVEL_PATHS) {
        console.log(`   ${segments[segIdx]}: ${describeSource(current)}`);
      }
      // simplistic disambiguation - if multiple, select first
      if (segIdx < segments.length - 1 && Array.isArray(current)) {
        current = current[0];
        if (logLevel === LOG_LEVEL_PATHS) {
          console.log(`     disambiguated to ${describeSource(current)}`);
        }
      }
    }
    result = current;
  } else {
    result = getSegmentData(node, path);
    if (logLevel === LOG_LEVEL_PATHS) {
      console.log(describeSource(result));
    }
  }

  if (logLevel === LOG_LEVEL_RESULTS) {
    console.log(describeSource(result));
  }
  return result;
};
