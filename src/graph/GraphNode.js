import Cache from './Cache';
import TypeDictionary, {
  DATATYPE_BOOLEAN,
  DATATYPE_FLOAT, DATATYPE_INTEGER,
  DATATYPE_STRING,
  TYPE_CONTEXTUAL_NODE, TYPE_NAME,
  TYPE_THING, TYPE_TYPE, TYPE_URI
} from './TypeDictionary';
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
    this.properties = {};
    if (originalNode) {
      if (typeUri !== TYPE_CONTEXTUAL_NODE) {
        throw new Error(`reference to original Node ${originalNode.uri} only allowed for ${TYPE_CONTEXTUAL_NODE}`);
      }
      this.originalNode = originalNode;
      this.uniqueKey = originalNode.getUniqueKey();
      this.type = TypeDictionary.getType(TYPE_CONTEXTUAL_NODE);
    } else if (typeUri) {
      this.setType(typeUri);
    }
  }

  clearProperties() {
    this.properties = {};
    return this;
  }

  clone(uri) {
    const result = new GraphNode(this.getTypeUri(), uri);
    result.properties = {...this.properties};
    return result;
  }

  equals(otherNode) {
    if (!GraphNode.isGraphNode(otherNode)) return false;
    if (this === otherNode) return true;
    return this.uri === otherNode.uri;
  }

  set(propKey, property) {
    this.properties[propKey] = property;
    return this;
  }

  setType(typeUri) {
    const type = TypeDictionary.getType(typeUri);
    if (!type) throw new Error(`Type ${typeUri} not declared in type dictionary`);
    if (type.isAssociation) {
      throw new Error(`Can't use association type ${typeUri} as node type`);
    }
    this.type = type;
    if (this.type === undefined) throw new Error("Can't find type " + typeUri);
    this.uniqueKey = `${this.getTypeUri()}/${this.uri}`;
  }

  createContextual() {
    if (this.originalNode) {
      const result = new GraphNode(TYPE_CONTEXTUAL_NODE, this.uri, this.originalNode);
      Object.assign(result.properties, this.properties);
      return result;
    }
    return new GraphNode(TYPE_CONTEXTUAL_NODE, this.uri, this);
  }

  mergeContextual(other) {
    if (other.getUniqueKey() !== this.getUniqueKey()) {
      throw new Error(`Can't merge different nodes ${other.getUniqueKey()} and ${this.getUniqueKey()}`);
    }
    if (!this.originalNode) return other;
    if (!other.originalNode) return this;
    const result = new GraphNode(TYPE_CONTEXTUAL_NODE, this.uri, this.originalNode);
    //TODO: unify associations
    Object.assign(result.properties, this.properties);
    Object.assign(result.properties, other.properties);
    return result;
  }

  getTypeUri() {
    if (!this.type) {
      return TYPE_THING;
    }
    return this.originalNode ? this.originalNode.type.uri : this.type.uri;
  };

  getDisplayName() {
    const result = this.properties[getConfig('displayNameAttribute')];
    if (result) return result;
    return this.originalNode ? this.originalNode.getDisplayName() : this.uri;
  }

  // noinspection JSUnusedGlobalSymbols
  isOfType (typeUri) {
    return (this.type || TypeDictionary.getType(TYPE_THING)).isOfType(typeUri);
  }

  getUniqueKey () {
    return this.uniqueKey;
  };

  get(propertyUri) {

    switch (propertyUri) {
      case TYPE_TYPE:
        return this.type;
      case TYPE_URI:
        return this.uri;
      case TYPE_NAME:
        return this.getDisplayName();
    }

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
    let result = this.properties[propName];
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
        this.properties[propType.uri] = Number(value);
        break;
      case DATATYPE_STRING:
        this.properties[propType.uri] = String(value);
        break;
      case DATATYPE_BOOLEAN:
        this.properties[propType.uri] = Boolean(value);
        break;
      default:
        throw new Error(`Data type ${propType.dataType} of ${propType.name} is not an attribute`);
    }
  }

  setAttributes(object) {
    Object.keys(object).forEach(prop => {
      const propType = TypeDictionary.getType(prop);
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
      this.properties[associationTypeUri] = [...nodes]
    } else {
      this.properties[associationTypeUri] = nodes;
    }
    return this;
  }

  removeBulkAssociation(associationTypeUri) {
    delete this.properties[associationTypeUri];
  }

  getSummary() {
    let result = [`Type: ${this.type.uri}, uri: ${this.uri}`];
    Object.keys(this.properties).forEach(key => {
      let valueStr;
      const value = this.properties[key];
      if (Array.isArray(value)) {
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

    const property = this.properties[associationTypeUri];
    if (property === undefined) {
      this.properties[associationTypeUri] = graphNode;
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
      this.properties[associationTypeUri] = newArray;
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
    if (!this.properties[association]) return false;
    const asso = this.properties[association];
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
      const direct = this.properties[parts[0]];
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
      const propType = TypeDictionary.getType(key);
      if (propType && propType.isAssociation) {
        if (this.hasDirectAssociation(propType, targetnode)) return true;
      }
    }
    return false;
  };

}
