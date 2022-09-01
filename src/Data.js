import omit from 'lodash/omit';
import Cache from "@/graph/Cache";
import TemplateRegistry from "@/templates/TemplateRegistry";
import {getConfigs, OFFLINE_MODE, setConfig} from "@/Config";
import {
  getCardDescriptorsOffline,
  getClientConfigOffline,
  getDataOffline,
  getDictionaryOffline,
  getToolDescriptorsOffline
} from "@/OfflineData/pseudobackend";
import {BLANK_NODE_URI} from "@/components/Constants";
import GraphNode from "@/graph/GraphNode";

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
    const rest = {...omit(value, ['$'])};
    processObject(constants, rest);
    return {...constant, ...rest};
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
        onError(error.message);
      });
};

export const getClientConfig = function (onError) {
  return OFFLINE_MODE ? getClientConfigOffline(onError) : getClientConfigFromDB(onError);
}

export const getClientConfigFromDB = function (onError) {

  const urlParams = new URLSearchParams(window.location.search);
  const configUrl = urlParams.has('configUrl') ? urlParams.get(`configUrl`) : '/api/config';

  return fetch(configUrl)
      .then(handleResponse)
      .then(result => {
        setConfig(result.data);})
      .catch(error => {
        console.log(error.stack);
        onError(`Error while fetching client configuration:\n${error.message}`);
      });
}

export const getCardDescriptors = function (onError) {
  return OFFLINE_MODE ? getCardDescriptorsOffline(onError) : getCardDescriptorsFromDb(onError);
}

export const getCardDescriptorsFromDb = function (onError) {
  return fetch(getParameterizedTemplateUrl('/api/templates'))
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
        onError(error.message);
      });
};

export const getParameterizedTemplateUrl = function getParameterizedUrl(baseUrl) {
  const urlParams = new URLSearchParams(window.location.search);
  const templateParams = {};
  urlParams.forEach((value, key) => {
    if (key.startsWith('templates-')) {
      templateParams[key.substr('templates-'.length)] = value;
    }
  });

  const templateParamKeys = Object.keys(templateParams);
  if (templateParamKeys.length > 0) {
    const queryParts = templateParamKeys.map(key => `${key}=${encodeURIComponent(templateParams[key])}`);
    return `${baseUrl}?${queryParts.join('&')}`;
  } else {
    return baseUrl;
  }
}

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
        onError(`Error while fetching tools:\n${error.message}`)
      });
};

export const getData = function (onError) {
  return OFFLINE_MODE ? getDataOffline(onError) : getDataFromDB(onError);
}

export const fetchSubGraph = function fetchSubGraph(queryUrl, entryPointType, entryPointUri, onError) {
  return fetch(queryUrl, {})
      .then(handleResponse)
      .then(res => {
        if (res.data) {
          Cache.importNodes(res.data);
        }
        if (res.entryPoint && entryPointType) {
          const entryNode = entryPointUri ? Cache.getNode(entryPointType, entryPointUri).clearProperties() : new GraphNode(entryPointType, BLANK_NODE_URI);
          Cache.importNodeData(entryNode, res.entryPoint);
          return entryNode;
        }
      }).catch(error => {
    console.log(error.stack);
    onError(`Error while fetching graph data:\n${error.message}`);
  });
}

export const getParameterizedDataUrl = function getParameterizedUrl(baseUrl) {
  const {getGraph} = getConfigs(['getGraph']);
  const graphParams = (typeof getGraph === 'object') ? getGraph : {};
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.forEach((value, key) => {
    if (key.startsWith('graph-')) {
      graphParams[key.substr('graph-'.length)] = value;
    }
  });

  const graphParamKeys = Object.keys(graphParams);
  if (graphParamKeys.length > 0) {
    const queryParts = graphParamKeys.map(key => `${key}=${encodeURIComponent(graphParams[key])}`);
    return `${baseUrl}?${queryParts.join('&')}`;
  } else {
    return baseUrl;
  }
}

export const getDataFromDB = function(onError) {

  const {getTables, getGraph} = getConfigs(['getTables', 'getGraph']);

  /**
   * @type {Promise[]}
   */
  const result = [];
  if (getGraph) {
    const queryUrl = getParameterizedDataUrl('/api/graph');
    result.push(fetchSubGraph(queryUrl,null, null, onError));
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
            onError(`Error while retrieving table data:\n${error.message}`);
          })
      );
    });
  }

  return result;
}