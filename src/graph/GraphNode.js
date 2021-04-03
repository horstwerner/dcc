import Cache, {
  DATATYPE_BOOLEAN,
  DATATYPE_FLOAT,
  DATATYPE_INTEGER,
  DATATYPE_STRING,
  TYPE_CONTEXTUAL_NODE,
  TYPE_THING
} from './Cache';
import {getConfig} from "@/Config";

// noinspection JSUnusedGlobalSymbols
export default class GraphNode {

  uri;
  type;
  uniqueKey;
  originalNode;

  static isGraphNode(o) {
    return o && typeof o === 'object' && o.constructor === GraphNode;
  }

  /**
   *
   * @param {String} typeUri
   * @param {String} uri - required to be unique within scope of type
   * @param {GraphNode?} originalNode
   */
  constructor(typeUri, uri, originalNode) {
    if (!uri ) {
      throw new Error('Undefined uri in node constructor');
    }
    this.uri = uri;
    if (originalNode) {
      if (typeUri !== TYPE_CONTEXTUAL_NODE) {
        throw new Error(`reference to original Node ${originalNode.uri} only allowed for ${TYPE_CONTEXTUAL_NODE}`);
      }
      this.originalNode = originalNode;
      this.uniqueKey = originalNode.getUniqueKey();
      this.type = Cache.getType(TYPE_CONTEXTUAL_NODE);
    } else if (typeUri) {
      this.setType(typeUri);
    }
  }

  equals(otherNode) {
    if (!GraphNode.isGraphNode(otherNode)) return false;
    if (this === otherNode) return true;
    return this.uri === otherNode.uri;
  }

  setType(typeUri) {
    const type = Cache.getType(typeUri);
    if (!type) throw new Error(`Type ${typeUri} not declared in type dictionary`);
    if (type.isAssociation) {
      throw new Error(`Can't use association type ${typeUri} as node type`);
    }
    this.type = type;
    if (this.type === undefined) throw new Error("Can't find type " + typeUri);
    this.uniqueKey = `${this.getTypeUri()}/${this.uri}`;
  }

  createContextual() {
    return new GraphNode(TYPE_CONTEXTUAL_NODE, this.uri, this);
  }

  getTypeUri() {
    if (!this.type) {
      return TYPE_THING;
    }
    return this.originalNode ? this.originalNode.type.uri : this.type.uri;
  };

  getDisplayName() {
    return this[getConfig('displayNameAttribute')] || this.uri;
  }

  // noinspection JSUnusedGlobalSymbols
  isOfType (typeUri) {
    return (this.type || Cache.getType(TYPE_THING)).isOfType(typeUri);
  }

  getUniqueKey () {
    return this.uniqueKey;
  };

  // getPropertyText(propertyname, separator) {
  //   let property;
  //   separator = separator || ', ';
  //   if (propertyname.includes('/')) {
  //     property = Cache.traverse(this, propertyname)
  //   } else {
  //     property = this[propertyname];
  //   }
  //   if (!property) return '';
  //
  //   if (property.constructor === GraphNode) {
  //     return property.displayname();
  //   }
  //   if (property.constructor === Array || property.constructor === Set) {
  //     let nameArray = [];
  //     property.forEach(function (el) {
  //       nameArray.push(el.displayname());
  //     });
  //     return nameArray.join(separator);
  //   }
  //   return property;
  // };

  // /**
  //  *
  //  * @param {string} path traversal path in xpath syntax
  //  * @param {function} callback
  //  * @param {function} filter optional, receives a node and returns true if that node is to be processed
  //  */
  // forEachRelatedNode(path, callback, filter) {
  //   const related = traverse(this, path);
  //   related.forEach(function (relnode) {
  //     if (filter && !filter(relnode)) return;
  //     callback(relnode);
  //   });
  // };

  get(propertyUri) {
    let propName = propertyUri;
    let filter = null;
    if (propertyUri.charAt(propertyUri.length - 1) === ']') {
      const propLen = propertyUri.indexOf('[');
      if (propLen > -1) {
        propName = propertyUri.substr(0, propLen);
        const typeUri = propertyUri.substring(propLen + 1, propertyUri.length - 1);
        filter = (node => node.isOfType(typeUri));
      }
    }
    let result = this[propName];
    if (result === undefined && this.originalNode) {
      result = this.originalNode.get(propName);
    }
    if (filter !== null && result) {
      if (Array.isArray(result)) return result.filter(filter);
      if (GraphNode.isGraphNode(result) && filter(result)) return result;
      return null;
    }
    return result;
  }

  setAttribute(propType, value) {

    switch (propType.dataType) {
      case DATATYPE_INTEGER:
      case DATATYPE_FLOAT:
        this[propType.uri] = Number(value);
        break;
      case DATATYPE_STRING:
        this[propType.uri] = String(value);
        break;
      case DATATYPE_BOOLEAN:
        this[propType.uri] = Boolean(value);
        break;
      default:
        throw new Error(`Data type ${propType.dataType} of ${propType.name} is not an attribute`);
    }
  }

  setAttributes(object) {
    Object.keys(object).forEach(prop => {
      const propType = Cache.getType(prop);
      if (!propType) {
        console.warn(`Ignoring property of unknown type ${prop} at import`);
        return;
      }
      this.setAttribute(propType, object[prop]);
    });
    return this;
  }

  setBulkAssociation(associationTypeUri, nodes) {
    if (nodes.constructor === Set) {
      this[associationTypeUri] = [...nodes]
    } else {
      this[associationTypeUri] = nodes;
    }
    return this;
  }

  removeBulkAssociation(associationTypeUri) {
    delete this[associationTypeUri];
  }

  getSummary() {
    let result = [];
    Object.keys(this).forEach(key => {
      let valueStr;
      const value = this[key];
      if (value == null || key === 'originalNode') return;
      if (key === 'type') {
        valueStr = value.uri;
      }
      else if (Array.isArray(value)) {
        valueStr = value.map(node => node.uri).join(', ');
      } else if (GraphNode.isGraphNode(value)) {
        valueStr = value.uri;
      } else {
        valueStr = String(value);
      }
      result.push(`${key}: ${valueStr}`);
    });
    return result.join(`\n`) + (this.originalNode ? `------------>\n${this.originalNode.getSummary()}`: '');
  }


  /**
   * private, lower level, one-directional addition of association
   * @param associationTypeUri
   * @param graphNode
   */
  addAssociatedNode(associationTypeUri, graphNode) {

    const property = this[associationTypeUri];
    if (property === undefined) {
      this[associationTypeUri] = graphNode;
      return;
    }
    if (Array.isArray(property)) {
      if (!property.includes(graphNode)) {
        property.push(graphNode);
      }
      return;
    }
    if (GraphNode.isGraphNode(property)) {
      if (property === graphNode) return; //already exists
      let newArray = [];
      newArray.push(property);
      newArray.push(graphNode);
      this[associationTypeUri] = newArray;
      return;
    }
    throw new Error("Unexpected type of associated object (" + this.uri + "->" + associationTypeUri + ")");
  };

  /**
   * creates bidirectional association
   * @param associationtype
   * @param {String | object} target
   * @param {String?} targetTypeUri
   */
  addAssociation(associationtype, target, targetTypeUri) {

    if (!target) return ;

    const nodeType = targetTypeUri || (!associationtype.isAssociation && associationtype.uri);

    const inverseTypeUri = associationtype.getInverseType(this.getTypeUri());

    if (typeof target === 'string') {
      const targetNode = Cache.getNode(nodeType, target);
      this.addAssociatedNode(associationtype.uri, targetNode);
      targetNode.addAssociatedNode(inverseTypeUri, this);
      return this;
    }
    else if (typeof target === 'object' && GraphNode.isGraphNode(target)) {
      this.addAssociatedNode(associationtype.uri, target);
      target.addAssociatedNode(inverseTypeUri, this);
      return this;
    }

    if (Array.isArray(target)) {
      for (let i = 0; i < target.length; i++) {
        let element = target[i];
        if (typeof element === 'string') {
          const targetNode = Cache.getNode(nodeType, element);
          this.addAssociatedNode(associationtype.uri, targetNode);
          targetNode.addAssociatedNode(inverseTypeUri, this);
        }
        else if (GraphNode.isGraphNode(element)) {
          this.addAssociatedNode(associationtype.uri, element);
          element.addAssociatedNode(inverseTypeUri, this);
        }
      }
      return this;
    }

    throw new Error("Unexpected type of associated object (" + this.uri + "->" + associationtype + ")");
  };

  hasDirectAssociation(association, targetnode) {
    if (!this[association]) return false;
    const asso = this[association];
    if (typeof asso === 'object' && asso.constructor === Array) {
      return asso.includes(targetnode);
    } else {
      return asso === targetnode;
    }
  };

  hasAssociationPathTo(path, targetnode) {
    if (path.includes('/')) {
      //separate first segment of path from rest
      const parts = path.split(/\/(.+)/);
      const direct = this[parts[0]];
      if (!direct) return false;
      if (typeof direct === 'object' && direct.constructor === Array) {
        for (let i = 0; i < direct.length; i++) {
          let node = direct[i];
          if (node.hasAssociationPathTo(parts[1], targetnode)) return true;
        }
        return false
      }
      else if (GraphNode.isGraphNode(direct)) {
        return direct.hasAssociationPathTo(parts[1], targetnode);
      }
    }
    else {
      return this.hasDirectAssociation(path, targetnode);
    }
  };

  hasAnyDirectAssociationTo(targetnode) {
    for (let key in this) {
      if (!this.hasOwnProperty(key)) continue;
      const propType = Cache.getType(key);
      if (propType && propType.isAssociation) {
        if (this.hasDirectAssociation(propType, targetnode)) return true;
      }
    }
    return false;
  };

}
