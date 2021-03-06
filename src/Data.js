import {omit} from "lodash";
import Cache from "@/graph/Cache";
import TemplateRegistry from "@/templates/TemplateRegistry";
import {OFFLINE_MODE} from "@/Config";
import {
  getCardDescriptorsOffline,
  getClientConfigOffline, getDataOffline,
  getDictionaryOffline,
  getToolDescriptorsOffline
} from "@/OfflineData/pseudobackend";

export const handleResponse = function (response) {
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
};

const getGlobal = function getGlobal(constants, value) {
  const constant = constants[value['$']];
  if (constant === undefined) {
    throw new Error(`Can't find global constant ${value['$']}`)
  }
  if (Object.keys(value).length === 1) {
    return constant;
  } else {
    if (Array.isArray(constant) || typeof constant !== 'object'){
      throw new Error(`Can't override parts of constant ${value['$']} - not an object`)
    }
    return {...constant, ...omit(value, ['$'])};
  }
};

const processObject = function (constants, object) {
  if (object == null) {
    debugger
  }
  Object.keys(object).forEach(key => {
    const value = object[key];
    if (value == null) {
      debugger
    }
    if (Array.isArray(value)) {
      processArray(constants, value);
    } else if (typeof value === 'object') {
      if ( value['$']) {
        object[key] = getGlobal(constants, value);
      } else {
        processObject(constants, value);
      }
    }
  });
};


const processArray = function(constants, array) {
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    if (Array.isArray(element)) {
      processArray(constants, element);
    } else if (typeof element === 'object') {
      if ( element['$']) {
        array[i] = getGlobal(constants, element);
      } else {
        processObject(constants, element);
      }
    }
  }
};


export const preprocess = function preprocess(constantList, templates) {
  const constants = {};
  // constants can use constants that precede them in list
  constantList.forEach(constObj => {
    processObject(constants, constObj);
    const key = Object.keys(constObj)[0];
    constants[key] = constObj[key];
  });

  //now that all constants are processed, process templates
  processArray(constants, templates);
}

export const getDictionary = function (onError) {
  return OFFLINE_MODE ? getDictionaryOffline(onError) : getDictionaryFromDb(onError);
}

export const getDictionaryFromDb = function (onError) {
  return fetch('/api/dictionary')
      .then(handleResponse)
      .then(result => {
        Cache.importTypes(result.data)})
      .catch(error => {
        console.log(error.stack);
        onError(error);
      });
};

export const getClientConfig = function (onError) {
  return OFFLINE_MODE ? getClientConfigOffline(onError) : getClientConfigFromDB(onError);
}

export const getClientConfigFromDB = function (onError) {
  return fetch('/api/config')
      .then(handleResponse)
      .then(result => {
        Cache.setConfig(result.data)})
      .catch(error => {
        console.log(error.stack);
        onError(error);
      });
}

export const getCardDescriptors = function (onError) {
  return OFFLINE_MODE ? getCardDescriptorsOffline(onError) : getCardDescriptorsFromDb(onError);
}

export const getCardDescriptorsFromDb = function (onError) {
  return fetch('/api/templates')
      .then(handleResponse)
      .then(result => {
        const {constants, cards} = result.data;
        preprocess(constants, cards);
        cards.forEach(descriptor => {
          TemplateRegistry.registerTemplate(descriptor);
        })
      })
      .catch(error => {
        console.log(error.stack);
        onError(error);
      });
};

export const getToolDescriptors = function (onError) {
  return OFFLINE_MODE ? getToolDescriptorsOffline(onError) : getToolDescriptorsFromDb(onError);
}

export const getToolDescriptorsFromDb = function (onError) {
  return fetch('/api/tools')
      .then(handleResponse)
      .then(result => {
        const {tools} = result.data;
        tools.forEach(descriptor => {
          TemplateRegistry.registerTool(descriptor);
        })
      })
      .catch(error => {
        console.log(error.stack);
        onError(error)
      });
};

export const getData = function (onError) {
  return OFFLINE_MODE ? getDataOffline(onError) : getDataFromDB(onError);
}

export const getDataFromDB = function(onError) {
  const config = Cache.getConfig();

  /**
   * @type {Promise[]}
   */
  const result = [];
  const {getTables, getGraph} = config;
  if (getGraph) {
    result.push(
        fetch(`/api/graph`, {})
            .then(handleResponse)
            .then(res => {
              if (res.data) {
                Cache.importNodes(res.data);
              }
            }).catch(error => {
              console.log(error.stack);
              onError(error);
            })
    );
  }

  if (getTables) {
    getTables.forEach(tableName => {
      result.push(fetch(`/api/data?type=${encodeURI(tableName)}`, {})
          .then(handleResponse)
          .then(res => {
            if (res.data) {
              Cache.importNodeTable(res.data.type, res.data.headerRow, res.data.valueRows);
            }
          })
          .catch(error => {
            console.log(error.stack);
            onError(error);
          })
      );
    });
  }

  return result;
}