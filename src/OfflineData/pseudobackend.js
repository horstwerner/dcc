import {config, dictionary, templates, tools} from "@/OfflineData/metadata";
import {data, graph} from '@/OfflineData/data';
import Cache from "@/graph/Cache";
import TemplateRegistry from "@/templates/TemplateRegistry";
import {preprocess} from "@/Data";
import {getConfigs, setConfig} from "@/Config";

export const OFFLINE_DATA = { config, dictionary, templates, tools, data, graph };

export const getDictionaryOffline = function (onError) {
  return pseudoFetch(OFFLINE_DATA.dictionary)
      .then(data => {
        Cache.importTypes(data)})
      .catch(error => {
        console.log(error.stack);
        onError(error);
      });
};

export const getClientConfigOffline = function () {
  return pseudoFetch(OFFLINE_DATA.config)
      .then(data => {
        setConfig(data)});
}

export const getCardDescriptorsOffline = function (onError) {
  return pseudoFetch(OFFLINE_DATA.templates)
      .then(data => {
        const {constants, cards} = data;
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


export const getToolDescriptorsOffline = function (onError) {
  return pseudoFetch(OFFLINE_DATA.tools)
      .then(data => {
        const {tools} = data;
        tools.forEach(descriptor => {
          TemplateRegistry.registerTool(descriptor);
        })
      })
      .catch(error => {
        console.log(error.stack);
        onError(error)
      });
};


export const getDataOffline = function(onError) {

  /**
   * @type {Promise[]}
   */
  const result = [];
  const { getTables, getGraph } = getConfigs('getTables', 'getGraph');
  if (getGraph) {
    result.push(
       pseudoFetch(OFFLINE_DATA.graph)
            .then(data => {
                Cache.importNodes(data);
            }).catch(error => {
          console.log(error.stack);
          onError(error);
        })
    );
  }

  if (getTables) {
    getTables.forEach(tableName => {
      result.push(
          pseudoFetch(OFFLINE_DATA.data[tableName])
          .then(data => {
            if (data) {
              Cache.importNodeTable(data.type, data.headerRow, data.valueRows);
            } else {
              console.log(`Warning: No offline data for ${tableName} found`)
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

export const pseudoFetch = function (result) {
  return new Promise(( resolve ) => {
    setTimeout(() => resolve(result), 10);
  })
}