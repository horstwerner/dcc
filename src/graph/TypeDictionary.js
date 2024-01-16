import Type from "@/graph/Type";
import {
  DATATYPE_ENTITY,
  DATATYPE_INTEGER,
  TYPE_AGGREGATOR,
  TYPE_CONTEXT,
  TYPE_CONTEXTUAL_NODE,
  TYPE_NODE_COUNT,
  TYPE_SERIES,
  TYPE_NODES,
  TYPE_THING,
  TYPE_TIME,
  DATATYPE_SERIES, DATATYPE_DATETIME
} from "@/graph/BaseTypes";

class TypeDictionary {

  typeMap = {};

  constructor() {
    this.createType({uri: TYPE_CONTEXTUAL_NODE, name: 'contextual', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_AGGREGATOR, name: 'aggregated', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_NODES, name: 'nodes', dataType: DATATYPE_ENTITY, isAssociation: true});
    this.createType({uri: TYPE_THING, name: 'Thing', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_NODE_COUNT, name: 'node count', dataType: DATATYPE_INTEGER, isAssociation: false});
    this.createType({uri: TYPE_CONTEXT, name: 'DCC card context', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_SERIES, name: 'Data Series', dataType: DATATYPE_SERIES, isAssociation: false});
    this.createType({uri: TYPE_TIME, name: 'Time', dataType: DATATYPE_DATETIME, isAssociation: false});
  }

  createType (descriptor) {
    let type = new Type(descriptor);
    this.typeMap[descriptor.uri] = type;
    return type;
  };

  getType (typeUri) {
    return this.typeMap[typeUri];
  };

  isAssociation(typeUri) {
    if (!this.typeMap[typeUri]) return false;
    return this.typeMap[typeUri].dataType === DATATYPE_ENTITY;
  }

  getTypeList() {
    return Object.values(this.typeMap);
  };

  resolveSuperTypes() {
    this.getTypeList().forEach(type => {
      if (type.subClassOf) {
        const superType = this.typeMap[type.subClassOf];
        if (!superType) {
          throw new Error(`Error in Type Dictionary:\nType ${type.uri} declares nonexistent super type ${type.subClassOf}`);
        }
        type.superType = superType;
        superType.subTypes.push(type);
      }
    })

  }
}

const instance = new TypeDictionary();
export default instance;