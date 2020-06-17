import Cache, {traverse} from './Cache';

export default class GraphNode {

  constructor(typeuri, uri) {
    this.type = Cache.typeDic[typeuri];
    if (this.type === undefined) throw new Error("Can't find type " + typeuri);
    this.uri = uri;
    this.uniqueKey = this.uri.startsWith(this.type.uri) ? this.uri : `${this.type.uri}/${this.uri}`;
  }

  getTypeUri() {
    return this.type.uri;
  };

  getUniqueKey () {
    return this.uniqueKey;
  };

  getPropertyText(propertyname, separator) {
    let property;
    separator = separator || ', ';
    if (propertyname.includes('/')) {
      property = Cache.traverse(this, propertyname)
    } else {
      property = this[propertyname];
    }
    if (!property) return '';

    if (property.constructor === GraphNode) {
      return property.displayname();
    }
    if (property.constructor === Array || property.constructor === Set) {
      let nameArray = [];
      property.forEach(function (el) {
        nameArray.push(el.displayname());
      });
      return nameArray.join(separator);
    }
    return property;
  };
  
  /**
   *
   * @param {string} path traversal path in xpath syntax
   * @param {function} callback
   * @param {function} filter optional, receives a node and returns true if that node is to be processed
   */
  forEachRelatedNode(path, callback, filter) {
    const related = traverse(this, path);
    related.forEach(function (relnode) {
      if (filter && !filter(relnode)) return;
      callback(relnode);
    });
  };

  displayName() {
    return this['core:name'] === undefined ? this.uri : this['core:name'];
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
   * @param graphnode
   */
  addAssociatedNode(associationTypeUri, graphnode) {
    const property = this[associationTypeUri];
    if (property === undefined) {
      this[associationTypeUri] = graphnode;
      return;
    }
    if (Array.isArray(property)) {
      if (!property.includes(graphnode)) {
        property.push(graphnode);
      }
      return;
    }
    if (property.constructor === GraphNode) {
      if (property === graphnode) return; //already exists
      let newArray = [];
      newArray.push(property);
      newArray.push(graphnode);
      this[associationTypeUri] = newArray;
      return;
    }
    throw new Error("Unexpected type of associated object (" + this.uri + "->" + associationTypeUri + ")");
  };

  /**
   * creates bidirectional association
   * @param associationtype
   * @param target
   */
  addAssociation(associationtype, target) {
    const inversetypeuri = associationtype.getInverseType(this.type).uri;

    if (typeof target === 'string') {
      const targetnode = Cache.getNode(associationtype.uri, target);
      this.addAssociatedNode(associationtype.uri, targetnode);
      targetnode.addAssociatedNode(inversetypeuri, this);
      return this;
    }
    else if (typeof target === 'object' && target.constructor === GraphNode) {
      this.addAssociatedNode(associationtype.uri, target);
      target.addAssociatedNode(inversetypeuri, this);
      return this;
    }

    if (typeof target === 'object' && target.constructor === Array) {
      for (let i = 0; i < target.length; i++) {
        let element = target[i];
        if (typeof element === 'string') {
          const targetnode = Cache.getNode(associationtype.uri, element);
          this.addAssociatedNode(associationtype.uri, targetnode);
          targetnode.addAssociatedNode(inversetypeuri, this);
        }
        else if (typeof element === 'object' && element.constructor === GraphNode) {
          this.addAssociatedNode(associationtype.uri, element);
          element.addAssociatedNode(inversetypeuri, this);
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