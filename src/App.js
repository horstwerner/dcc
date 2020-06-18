import P from 'prop-types';
import { omit } from 'lodash';
import Component from '@symb/Component';
import css from './App.css';
import ComponentFactory from "@symb/ComponentFactory";
import Cache from './graph/Cache';
import TemplateRegistry from './templates/TemplateRegistry';
import {Div_} from '@symb/Div';
import {fit} from "@symb/util";
import {Card_} from "@/components/Card";

const APP = 'app';

const handleResponse = function (response) {
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
    debugger
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
  array.forEach(element => {
    if (Array.isArray(element)) {
      processArray(constants, element);
    } else if (typeof element === 'object') {
      processObject(constants, element);
    }
  })
};

const preprocess = function preprocess(constantList, templates) {
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

export default class App extends Component {

  static type = APP;
  static className = css.app;

  static propTypes = {
    title: P.string
  };

  constructor(props, domNode) {
    super(props, domNode);
    this.state = {
      dataLoaded: false,
      error: null,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    };

    this.getDictionaryFromDb()
        .then(() => Promise.all([...Cache.getEntityTypes().map(type => this.getDataFromDb(type)), this.getCardDescriptorsFromDb()]))
        .then(() => {
          if (!this.state.error) {
            this.setState({
              dataLoaded: true,
              // currentMap: TemplateRegistry.getStartMap()
            })
          }
        });
    this.onElementClick = this.onElementClick.bind(this);

  }

  onElementClick(card, newArrangement) {
    // const tween = new Tween(DURATION_REARRANGEMENT);
    // card.morph(newArrangement, tween);
    // tween.start();
  }

  getDictionaryFromDb() {
    return fetch('/api/dictionary')
        .then(handleResponse)
        .then(result => {
          Cache.importTypes(result.data)})
        .catch(error => {
          console.log(error.stack);
          this.setState({error})
        });
  };

  getCardDescriptorsFromDb() {
    return fetch('/api/cards')
        .then(handleResponse)
        .then(result => {
          const {constants, cards} = result.data;
          preprocess(constants, cards)
          cards.forEach(descriptor => {
            TemplateRegistry.registerTemplate(descriptor);
          })
        })
        .catch(error => {
          console.log(error.stack);
          this.setState({error})
        });
  };

  // getNavigationFromDb() {
  //   return fetch('/api/navigation')
  //       .then(handleResponse)
  //       .then(result => {
  //         if (result && result.data) {
  //           TemplateRegistry.registerNavigationMaps(result.data.maps);
  //           TemplateRegistry.setStartMap(result.data.startmap);
  //         }
  //       })
  //       .catch(error => {
  //         console.log(error.stack);
  //         this.setState({error})
  //       });
  // }

  getViewsFromDb() {
    return fetch('/api/views')
        .then(handleResponse)
        .then(result => {
          if (result && result.data) {
            TemplateRegistry.registerViews(result.data);
          }
        })
        .catch(error => {
          console.log(error.stack);
          this.setState({error})
        });
  }

  getDataFromDb(type) {
    return fetch(`/api/data?type=${encodeURI(type)}`, {})
        .then(handleResponse)
        .then(res => {
          if (res.data) {
            Cache.importNodeTable(res.data.type, res.data.headerRow, res.data.valueRows);
          }
        })
        .catch(error => {
          console.log(error.stack);
          this.setState({ error });
        });
  }

  updateContents(props) {
    const {dataLoaded, error, windowWidth, windowHeight} = this.state;
    // const backgroundColor = (map && map.backColor) || '#ffffff';
    const {currentMap} = this.state;
    const template = dataLoaded && TemplateRegistry.getTemplate('root');
    if (template) {
      document.body.style.backgroundColor = template.background.color;
    }

    this.createChildren([
      error && Div_({}, `An error occurred: ${error.message}`)._Div,

      dataLoaded && Card_({
        key: 'navigation',
        spatial: fit(windowWidth, windowHeight, template.background.w, template.background.h),
        data: Cache.rootNode,
        template,
        onClick: null
      })._Card]);

    //   NavigationMap_({
    //       key: 'navigation',
    //       spatial: fit(windowWidth, windowHeight, currentMap.width, currentMap.height),
    //       dataSource: Cache,
    //       onElementClick: this.onElementClick,
    //       ...currentMap
    //     })._NavigationMap
    // ]);
  }

  onResize(width, height) {
    this.setState({windowWidth: width, windowHeight: height});
  }

  // mapActorFocused(key, map) {
  //   const {width, height} = this.state;
  //   const scale = Math.min(width / map.width, height / map.height);
  //   const xOffset = Math.floor((width - scale * map.width) / 2);
  //   const yOffset = Math.floor((height - scale * map.height) / 2);
  //
  //   return new Actor({
  //     key,
  //     x: xOffset,
  //     y: yOffset,
  //     scale,
  //     node: (<NavigationMap {...map} dataSource={Cache} onElementClick={(key, description) => {
  //     this.createTransition(key, description);
  //   }}/>)
  // });
  // };

};

ComponentFactory.registerType(App);

export const App_ = (props, children) => ({_App: {type: APP, children, ...props}});
