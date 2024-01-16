import Cache from './Cache';
import TypeDictionary from './TypeDictionary';
import {getConfig, PATH_SEPARATOR} from "@/Config";
import {nodeArray} from "@symb/util";
import {
  DATATYPE_BOOLEAN,
  DATATYPE_FLOAT, DATATYPE_INTEGER, DATATYPE_STRING,
  TYPE_AGGREGATOR,
  TYPE_CONTEXTUAL_NODE,
  TYPE_NAME,
  TYPE_NODES,
  TYPE_THING,
  TYPE_TYPE,
  TYPE_URI
} from "@/graph/BaseTypes";

// noinspection JSUnusedGlobalSymbols
export default class GraphNode {

  uri;
  type;
  uniqueKey;
  originalNode;
  isSynthetic;
  valid;

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
    this.isSynthetic = false;
    this.valid = true;
    this.properties = {};
    // these associations are pointing back - and belong - to another graph node, which points to this
    this.inverseAssociations = {};
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
      throw new Error(`Can't use association type ${typeUri} as node type for node ${this.uri}`);
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
    return this.originalNode ? this.originalNode.getTypeUri() : this.type.uri;
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
        return this.originalNode ? this.originalNode.get(propertyUri) : this.type;
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
    if (TypeDictionary.isAssociation(propertyUri)) {
      if (Array.isArray(result)) {
        result = result.filter(node => node.isValid());
      } else if (GraphNode.isGraphNode(result) && !result.isValid()) {
        result = undefined;
      }
    }
    if (filter !== null && result) {
      if (Array.isArray(result)) return result.filter(filter);
      if (GraphNode.isGraphNode(result) && filter(result)) return result;
      return null;
    }
    // suppress destroyed node

    return result;
  }

  isValid() {
    if (this.originalNode) {
      return this.originalNode.isValid();
    }
    return this.valid;
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

  markAsSynthetic() {
    this.isSynthetic = true;
  }

  isSyntheticNode() {
    if (this.originalNode) {
      return this.originalNode.isSyntheticNode();
    }
    return this.isSynthetic;
  }

  getReference() {
    if (this.type.uri === TYPE_AGGREGATOR) {
      const nodes = nodeArray(this.get(TYPE_NODES));
      return !nodes.some(node => node.isSyntheticNode()) ? nodes.map(node => node.uri) : null;
    } else {
      return this.isSyntheticNode() ? null: this.uri;
    }
  }


  /**
   * private, lower level, one-directional addition of association
   * @param associationTypeUri
   * @param graphNode
   * @param isInverse keep track of this being an inverse association
   */
    addAssociatedNode(associationTypeUri, graphNode, isInverse) {

    if (isInverse) {
      let inverseTypeList = this.inverseAssociations[associationTypeUri];
      if (!inverseTypeList) {
        inverseTypeList = [];
        this.inverseAssociations[associationTypeUri] = inverseTypeList;
      }
      inverseTypeList.push(graphNode);
    }

    const property = this.properties[associationTypeUri];
    if (property == null) {
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
    throw new Error(`Unexpected type of existing association (${this.uri})->${associationTypeUri}: ${typeof property}, expected GraphNode, Array or null`);
  };

  isInverseAssociation(type, graphNode) {
    return this.inverseAssociations[type] && this.inverseAssociations[type].includes(graphNode);
  }

  removeLocalInverseAssociation(type, graphNode) {
    if (!this.isInverseAssociation(type, graphNode)) {
      console.warn(`Attempt to remove not-inverse association ${type}->${graphNode.getDisplayName()}`);
      return;
    }
    this.removeAssociation(type, graphNode);
    const inverse = this.inverseAssociations[type];
    const index = inverse.indexOf(graphNode);

    inverse.splice(index, 1);
  }

  removeAssociation (type, graphNode) {
    const associated = this.properties[type];
    if (associated === graphNode) {
      delete this.properties[type];
      return;
    }
    else if (Array.isArray(associated)) {
      const index = associated.indexOf(graphNode);
      if (index > -1) {
        associated.splice(index, 1);
        return;
      }
    }
    throw new Error(`attempt to remove non-existing association`);
  }

  removeRemoteInverseAssociations() {
    for (let propUri of Object.keys(this.properties)) {
      const type = TypeDictionary.getType(propUri);
      if (type.isAssociation) {
        const prop = this.properties[propUri];
        if (!prop) continue;
        const inverseTypeUri = type.getInverseType(this.getTypeUri());
        (Array.isArray(prop) ? prop : [prop]).forEach(targetNode => {
          if (!this.isInverseAssociation(type.uri, targetNode)) {
            targetNode.removeLocalInverseAssociation(inverseTypeUri, this);}
        });
      }
    }
  }

  removeRemoteAssociations() {
    const processed = {};
    Object.values(this.inverseAssociations).forEach(associated => {
      (Array.isArray(associated) ? associated : [associated])
          .forEach(targetNode => {
            if(!processed[targetNode.getUniqueKey()]) {
              targetNode.removeAssociationsTo(this);
              processed[targetNode.getUniqueKey()] = true;
            }
          })
    });
  }

  removeAssociationsTo(node) {
      Object.keys(this.properties).forEach(propUri => {
        const propType = TypeDictionary.getType(propUri);
        if (propType.isAssociation) {
          const associated = this.properties[propUri];
          if (associated === node || (Array.isArray(associated) && associated.includes(node))) {
            this.removeAssociation(propType, node);
          }
        }
      });
  }

  clearOwnProperties() {
    // remove inverse associations which this object has created in other nodes
    this.removeRemoteInverseAssociations();
    this.clearProperties();

    //restore inverse associations coming from other nodes
    Object.keys(this.inverseAssociations).forEach(assoTypeUri => {
      const associated = this.inverseAssociations[assoTypeUri];
      (Array.isArray(associated) ? associated : [associated])
          .forEach(targetNode => this.addAssociatedNode(assoTypeUri, targetNode, false));
          // isInverse only false because already in inverse association list
    });
  }

  destroy() {
    // remove inverses resulting from associations this has to other nodes
    this.removeRemoteInverseAssociations();
    // remove direct associations other nodes have to this
    this.removeRemoteAssociations();
    // TODO: handle contextual nodes pointing to this
    this.valid = false;
  }


  /**
   * creates bidirectional association
   * @param associationType
   * @param {String | object} target
   * @param {String?} targetTypeUri
   */
  addAssociation(associationType, target, targetTypeUri) {

    if (!target) return ;

    const nodeType = targetTypeUri || (!associationType.isAssociation && associationType.uri);

    const inverseTypeUri = associationType.getInverseType(this.getTypeUri());

    if (typeof target === 'string') {
      const targetNode = Cache.getNode(nodeType, target);
      this.addAssociatedNode(associationType.uri, targetNode, false);
      targetNode.addAssociatedNode(inverseTypeUri, this, true);
      return this;
    }
    else if (typeof target === 'object' && GraphNode.isGraphNode(target)) {
      this.addAssociatedNode(associationType.uri, target, false);
      target.addAssociatedNode(inverseTypeUri, this, true);
      return this;
    }

    if (Array.isArray(target)) {
      for (let i = 0; i < target.length; i++) {
        let element = target[i];
        if (typeof element === 'string') {
          const targetNode = Cache.getNode(nodeType, element);
          this.addAssociatedNode(associationType.uri, targetNode, false);
          targetNode.addAssociatedNode(inverseTypeUri, this, true);
        }
        else if (GraphNode.isGraphNode(element)) {
          this.addAssociatedNode(associationType.uri, element, false);
          element.addAssociatedNode(inverseTypeUri, this, true);
        }
      }
      return this;
    }

    throw new Error(`Unexpected type of associated object (${this.uri}->${associationType}): ${typeof target}`);
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
    const separator = getConfig(PATH_SEPARATOR);
    const sepIndex = path.indexOf(separator)
    if (sepIndex > -1) {
      //separate first segment of path from rest
      const part0 = path.substring(0, sepIndex);
      const part1 = path.substring(sepIndex + separator.length);
      const direct = this.properties[part0];
      if (!direct) return false;
      if (typeof direct === 'object' && direct.constructor === Array) {
        for (let i = 0; i < direct.length; i++) {
          let node = direct[i];
          if (node.hasAssociationPathTo(part1, targetnode)) return true;
        }
        return false
      }
      else if (GraphNode.isGraphNode(direct)) {
        return direct.hasAssociationPathTo(part1, targetnode);
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
