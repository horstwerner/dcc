import Type from './Type';
import GraphNode from './GraphNode';

class Cache {
  
  typeDic = {};
  rootNode = {};
  
  createType (descriptor) {
    let type = new Type(descriptor);
    this.typeDic[descriptor.uri] = type;
    if (type.dataType === 'ENTITY' && !type.isAssociation) {
      this.rootNode[descriptor.uri] = {};
    }
    return type;
  };

  getType (typeuri) {
    return this.typeDic[typeuri];
  };

  createNode (typeUri, uri) {
    if (this.rootNode[typeUri] === undefined) {
      this.rootNode[typeUri] = {};
    }
    let result = this.rootNode[typeUri][uri];
    if (!result) {
      result = new GraphNode(typeUri, uri);
      this.rootNode[typeUri][uri] = result;
    }
    return result;
  };
  
  getNode (typeUri, uri) {
    let dictionary = this.rootNode[typeUri];
    if (!dictionary) {
      dictionary = {};
      this.rootNode[typeUri] = dictionary;
    }
    let node = dictionary[uri];
    if (!node) {
      node = new GraphNode(typeUri, uri);
      dictionary[uri] = node;
    }
    return node;
  };

  getEntityTypes() {
    return Object.keys(this.rootNode);
  }
  
  forAllNodesOf (nodeType, callback) {
    const dictionary = this.rootNode[nodeType];
    if (dictionary) {
      for (let uri in dictionary) {
        if (!dictionary.hasOwnProperty(uri)) continue;
        callback(dictionary[uri]);
      }
    }
  };

  mapAllNodesOf (nodeType, callback) {
    const dictionary = this.rootNode[nodeType];
    if (dictionary) {
      return Object.keys(dictionary).map(key => callback(dictionary[key]));
    } else {
      return [];
    }
  };

  findNode (typeUri, uri) {
    const dictionary = this.rootNode[typeUri];
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
      const newNode = this.createNode(typeUri, nodeUri);
      for (let colIdx = 0; colIdx < headerRow.length; colIdx ++) {
        const prop = headerRow[colIdx];
        const proptype = this.getType(prop);
        if (proptype && proptype.isAssociation) {
          newNode.addAssociation(proptype, row[colIdx]);
        }
        else {
          newNode[prop] = row[colIdx];
        }
      }
    }
  }
  
  importNodesJson(array) {
    for (let i = 0; i < array.length; i++) {
      const rawNode = array[i];
      const nodeType = rawNode["core:type"];
      if (nodeType === undefined) {
        throw new Error("Can't import node with missing type: " + rawNode.toString());
      }
      const nodeUri = rawNode["core:uri"];
      if (nodeType === undefined) {
        throw new Error("Can't import node with missing uri: " + rawNode.toString());
      }
      let newNode = this.createNode(nodeType, nodeUri);
      for (let prop in rawNode) {
        if (!rawNode.hasOwnProperty(prop) || prop === 'core:type') continue;
        const proptype = this.getType(prop);
        if (proptype && proptype.isAssociation) {
          newNode.addAssociation(proptype, rawNode[prop]);
        }
        else {
          newNode[prop] = rawNode[prop];
        }
      }
    }
  };
  
  loadTypeDic(wsname, callback) {
    const request = new XMLHttpRequest();
    request.onreadystatechange =  () => {
      if (request.readyState === 4 && (request.status === 200 || request.status === 0)) {
        const response = JSON.parse(request.responseText);
        const dicArray = response['TypeDictionary'];
        this.importTypes(dicArray);
        callback();
      }
    };
    const url = 'data/dictionary.json'; //"http://localhost:8080/ws/dictionary/" + wsname
    request.open("GET", url, true);
    request.send(null);
  };

  loadGraph (wsname, callback) {
    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
      if (request.readyState === 4 && (request.status === 200 || request.status === 0)) {
        const response = JSON.parse(request.responseText);
        const wsnode = response['Workspace'];
        const nodearray = wsnode['nodes'];
        this.importNodes(nodearray);
        callback();
      }
    };
    const url = 'data/workspace.json';//
    // const url = 'http://localhost:8080/ws/workspace?uri=' + wsname + '&cql=/rock15:industry';
    request.open("GET", url, true);
    request.send(null);
  };

  loadWorkspace (wsname, callback) {
    this.loadTypeDic(wsname, () => {
      this.loadGraph(wsname, callback);
    });
  };
}

export default new Cache();

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
          const related = node[step];
          if (related !== undefined) {
            if (related.constructor === Array) {
              for (let j = 0; j < related.length; j++) {
                let node = related[j];
                nextSet.add(node);
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

