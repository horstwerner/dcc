import {get} from 'lodash';
import Template from './Template';
import TypeDictionary, {TYPE_THING} from "@/graph/TypeDictionary";

export const DEFAULT_VIEW_NAME = 'default';

const fallbackTemplate = {
      "id": "core:thing",
      "name": "Compact",
      "appliesTo": "core:thing",
      "aggregate": false,
      "size": { "w": 220, "h": 120},
      "background": { "type": "rect", "w": 220, "h": 120, "cornerRadius": 6, color: '#D0D0D0'},
      "clickable": true,
      "elements": [
        {
          "key": "heading-large",
          "type": "textfield",
          "x": 15, "y": 20, "w": 190, "h": 80,
          "attribute": "core:name",
          "style": {"font-weight": "normal", "color": "#202020", "font-size": "18px", "h-align": "center", "v-align": "center"}
        }
      ]
    };

class TemplateRegistry {

  constructor() {
    this.templateById = {};
    this.templatesByContentType = {};
    this.toolsById = {};
    this.toolsByContentType = {};
    this.registerTemplate(fallbackTemplate);
  }

  registerTemplateForType(type, template) {
    if (!this.templatesByContentType[type]) {
      this.templatesByContentType[type] = [];
    }
    this.templatesByContentType[type].push(template);
  }

  registerTemplate(descriptor) {
    const { id, appliesTo } = descriptor;
    console.log(`registered template '${descriptor.id}'`);
    const template = new Template(descriptor);
    if (Array.isArray(appliesTo)) {
      appliesTo.forEach(type => this.registerTemplateForType(type, template));
    } else {
      this.registerTemplateForType(appliesTo, template);
    }
    this.templateById[id] = template;
  }

  registerToolForType(type, descriptor) {
    if (!this.toolsByContentType[type]) {
      this.toolsByContentType[type] = [];
    }
    this.toolsByContentType[type].push(descriptor);
  }

  registerTool(descriptor) {
    const {id, appliesTo} = descriptor;
    this.toolsById[id] = descriptor;
    if (Array.isArray(appliesTo)) {
      appliesTo.forEach(type => this.registerToolForType(type, descriptor));
    } else {
      this.registerToolForType(appliesTo, descriptor);
    }
  }

  getTemplate(id) {
    if (!this.templateById[id]) {
      throw new Error(`No template for type ${id} registered`)
    }
    return this.templateById[id];
  }

  getTemplateForSingleCard(typeUri, viewName) {

    const superType = get(TypeDictionary.getType(typeUri),'subClassOf');
    const searchName = viewName.toLowerCase();
    const candidates = this.getViewsFor(typeUri, false);
    if (candidates.length === 0)  {
      console.log(`No template registered for type ${typeUri} - falling back to generic`);
      if (superType) {
        return this.getTemplateForSingleCard(superType, viewName);
      } else {
        return this.getTemplate(TYPE_THING);
      }
    }
    let result = candidates.find(template => (template.name || '').toLowerCase() === searchName);
    if (result) return result;
    if (superType) {
      return this.getTemplateForSingleCard(superType, viewName);
    }

    console.log(`Warning: Can't find view ${viewName} for ${typeUri}. Falling back to default or other`);
    if (searchName !== DEFAULT_VIEW_NAME) {
      result = candidates.find(template => (template.name || '').toLowerCase() === DEFAULT_VIEW_NAME);
    }
    if (result) return result;

    return candidates[0];
  }

  getToolsFor(typeUri) {
    const result = this.toolsByContentType[typeUri] || [];
    const superType = get(TypeDictionary.getType(typeUri),'subClassOf');
    if (superType) {
      result.push(...this.getToolsFor(superType));
    }
    return result;
  }

  getViewsFor(typeUri, aggregate) {
    const superType = get(TypeDictionary.getType(typeUri),'subClassOf');

    const viewMap = {};
    if (superType) {
        this.getViewsFor(superType, aggregate).forEach(view => {if (view.name) {viewMap[view.name] = view}});
    }

    if (this.templatesByContentType[typeUri]) {
      this.templatesByContentType[typeUri]
          .filter(template => !template.aggregate === !aggregate)
          .forEach(view => {if (view.name) {viewMap[view.name] = view}});
    }

    return Object.values(viewMap);
  }

}

const registry = new TemplateRegistry();

export default registry;
