import Cache, {TYPE_CONTEXTUAL_NODE, TYPE_NAME} from './Cache';

export default class GraphNode {

  /**
   *
   * @param {String} typeUri
   * @param {String} uri - required to be unique within scope of type
   * @param {GraphNode?} originalNode
   */
  constructor(typeUri, uri, originalNode) {
    if (Cache.getType(typeUri).isAssociation) {
      throw new Error(`Can't use association type ${typeUri} as node type`);
    }

    if (originalNode) {
      if (typeUri !== TYPE_CONTEXTUAL_NODE) {
        throw new Error(`reference to original Node ${originalNode.uri} only allowed for ${TYPE_CONTEXTUAL_NODE}`);
      }
      this.originalNode = originalNode;
    }
    this.type = Cache.typeDic[typeUri];
    if (this.type === undefined) throw new Error("Can't find type " + typeUri);
    this.uri = uri;
    this.uniqueKey = originalNode ? originalNode.getUniqueKey() :
        this.uri.startsWith(this.type.uri) ? this.uri : `${this.type.uri}/${this.uri}`;
  }

  createContextual() {
    return new GraphNode(TYPE_CONTEXTUAL_NODE, this.uri, this);
  }

  getTypeUri() {
    return this.type.uri;
  };

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
    let result = this[propertyUri];
    if (result === undefined && this.originalNode) {
      return this.originalNode.get(propertyUri);
    }
    return result;
  }

  displayName() {
    const name = this.get(TYPE_NAME);
    return name === undefined ? this.uri : name;
  };

  setAttributes(object) {
    Object.assign(this, object);
    return this;
  }

  setBulkAssociation(associationTypeUri, nodes) {
    this[associationTypeUri] = nodes;
    return this;
  }

  removeBulkAssociation(associationTypeUri) {
    delete this[associationTypeUri];
  }

  /**
   * private, lower level, one-directional addition of association
   * @param associationTypeUri
   * @param graphNode
   */
  addAssociatedNode(associationTypeUri, graphNode) {

    if(this.originalNode) {
      console.log(`Contextual:`);
    }
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
    if (property.constructor === GraphNode) {
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

    if (associationtype.isAssociation && (!targetTypeUri || Cache.getType(targetTypeUri).isAssociation)) {
      throw new Error(`No valid entity type specified for association ${associationtype.uri}`);
    }

    const inverseTypeUri = associationtype.getInverseType(this.type);

    const nodeType = targetTypeUri || associationtype.uri;

    if (typeof target === 'string') {
      const targetNode = Cache.getNode(nodeType, target);
      this.addAssociatedNode(associationtype.uri, targetNode);
      targetNode.addAssociatedNode(inverseTypeUri, this);
      return this;
    }
    else if (typeof target === 'object' && target.constructor === GraphNode) {
      this.addAssociatedNode(associationtype.uri, target);
      target.addAssociatedNode(inverseTypeUri, this);
      return this;
    }

    if (typeof target === 'object' && target.constructor === Array) {
      for (let i = 0; i < target.length; i++) {
        let element = target[i];
        if (typeof element === 'string') {
          const targetNode = Cache.getNode(nodeType, element);
          this.addAssociatedNode(associationtype.uri, targetNode);
          targetNode.addAssociatedNode(inverseTypeUri, this);
        }
        else if (typeof element === 'object' && element.constructor === GraphNode) {
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
      else if (typeof direct === 'object' && direct.constructor === GraphNode) {
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