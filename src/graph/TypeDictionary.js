import Type from "@/graph/Type";

export const DATATYPE_INTEGER = 'INTEGER';
export const DATATYPE_STRING = 'STRING';
export const DATATYPE_BOOLEAN = 'BOOLEAN';
export const DATATYPE_FLOAT = 'FLOAT';
export const DATATYPE_ENTITY = 'ENTITY';
export const TYPE_URI = 'core:uri';
export const TYPE_NAME = 'core:name';
export const TYPE_THING = 'core:thing';  // fallback type
export const TYPE_AGGREGATOR = 'core:aggregator';
export const TYPE_CONTEXTUAL_NODE = 'core:contextual';
export const TYPE_PREDECESSOR_COUNT = 'core:predecessorCount';
export const TYPE_SUCCESSOR_COUNT = 'core:successorCount';
export const TYPE_NODES = 'core:subNodes';
export const TYPE_TYPE = 'core:type';
export const TYPE_CONTEXT = 'core:context';
export const TYPE_NODE_COUNT = 'core:nodeCount';
export const TYPE_DEPTH = 'core:depth';

class TypeDictionary {

  typeMap = {};

  constructor() {
    this.createType({uri: TYPE_CONTEXTUAL_NODE, name: 'contextual', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_AGGREGATOR, name: 'aggregated', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_NODES, name: 'nodes', dataType: DATATYPE_ENTITY, isAssociation: true});
    this.createType({uri: TYPE_THING, name: 'thing', dataType: DATATYPE_ENTITY, isAssociation: false});
    this.createType({uri: TYPE_NODE_COUNT, name: 'node count', dataType: DATATYPE_INTEGER, isAssociation: false});
    this.createType({uri: TYPE_CONTEXT, name: 'DCC card context', dataType: DATATYPE_ENTITY, isAssociation: false});
  }

  createType (descriptor) {
    let type = new Type(descriptor);
    this.typeMap[descriptor.uri] = type;
    return type;
  };

  getType (typeUri) {
    return this.typeMap[typeUri];
  };

  getTypeList() {
    return Object.values(this.typeMap);
  };

  resolveSuperTypes() {
    this.getTypeList().forEach(type => {
      if (type.subClassOf) {
        const superType = this.typeMap[type.subClassOf];
        if (!superType) {
          throw new Error(`Type ${type.uri} declares nonexistent super type ${type.subClassOf}`);
        }
        type.superType = superType;
        superType.subTypes.push(type);
      }
    })

  }
}

const instance = new TypeDictionary();
export default instance;