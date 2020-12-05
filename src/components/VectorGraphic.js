  "use strict";
  const R = Render;
  const SVG = Render.SVG = {};

  const SVGNS = Render.SVG.SVGNS = "http://www.w3.org/2000/svg";
  // var svg = document.getElementById('svg');
  // var shape = document.createElementNS(svgns, "circle");
  // shape.setAttributeNS(null, "cx", 25);
  // shape.setAttributeNS(null, "cy", 25);
  // shape.setAttributeNS(null, "r",  20);
  // shape.setAttributeNS(null, "fill", "green");
  // svg.appendChild(shape);


  const VG = Render.VectorGraphic = function (width, height) {

    //noinspection JSUnresolvedFunction
    R.RenderElement.call(this, width, height);
    this.div.style.position = 'absolute';
    this.svg = document.createElementNS(SVGNS, 'svg');
    this.div.appendChild(this.svg);
    this.svg.setAttribute('width', width);
    this.svg.setAttribute('height', height);
  };

  //noinspection JSCheckFunctionSignatures: Inheritance
  Render.VectorGraphic.prototype = Object.create(R.RenderElement.prototype);


  Render.VectorGraphic.prototype.setSize = function(width, height) {
    if (!this.svg) return;
    this.svg.setAttribute('width', width.toString());
    this.svg.setAttribute('height', height.toString());
  };


  VG.prototype.addLine = function (x1, y1, x2, y2, color, width) {
    const newLine = new Render.Line(x1, y1, x2, y2, color || '#000', width | 1);
    this.svg.appendChild(newLine.div);
    return newLine;
  };


  VG.prototype.addPath = function (data) {
    const newPath = new Render.SvgPath(data);
    this.svg.appendChild(newPath.div);
    return newPath;
  };


  VG.prototype.addText = function (text, content) {
    const textElement = new Render.SvgText(text, content);
    this.svg.appendChild(textElement.div);
    return textElement;
  };


  VG.prototype.addRect = function (coords) {
    const newRect = new Render.SvgRect(coords);
    this.svg.appendChild(newRect.div);
    return newRect;
  };


  VG.prototype.addGroup = function () {
    const newGroup = new Render.SvgGroup();
    this.svg.appendChild(newGroup.div);
    return newGroup;
  };


  VG.prototype.addChild = function (child) {
    this.svg.appendChild(child.getDiv());
    child.setParent(this);
  };

  //----------------------------- S V G   E L E M E N T -------------------------------//


  const SvgElement = Render.SVG.SvgElement = function () {
  };

  SvgElement.prototype = Object.create(Render.RenderElement.prototype);


  SvgElement.prototype.setPos = function (x, y, scale, rotation) {
    this.hasPosition = true;

    if (scale) {
      this.scale = Number(scale);
    }
    this.x = Number(x);
    this.y = Number(y);

    //take into account anchor point
    const topLeftPos = this.getPos2TopLeft(this.x, this.y, -this.scale);

    if (rotation !== undefined) { this.rotation = rotation;}

    const rotateStr = this.rotation ? " rotate(" + this.rotation + ' ' + (this.xAnchor * this.width) +  ' ' + (this.yAnchor * this.height) + ')' : '';

    if (this.div) {
      this.div.setAttribute('transform', 'translate(' + topLeftPos.x + ' ' + topLeftPos.y + ') scale(' + this.scale + ')' + rotateStr);
    }

    this.updateLinks();
    if (this.getChildren) {
      const children = this.getChildren();
      if (children) {children.forEach(function (child) {
        child.updateLinks();
      })
      }
    }
    return this;
  };


  SvgElement.prototype.setColor = function(color) {
    this.div.setAttribute('fill', color);
  };


  SvgElement.prototype.getColor = function() {
    return this.div.getAttribute('fill');
  };


  SvgElement.prototype.setStroke = function(color) {
    this.div.setAttribute('stroke', color);
  };


  SvgElement.prototype.setStrokeWidth = function(width) {
    return this.div.setAttribute('stroke-width', width);
  };


  SvgElement.prototype.setOpacity = function(opacity) {
    this.isVisible = (opacity > 0.000001);
    this.div.setAttribute('opacity', opacity);
  };


  SvgElement.prototype.getOpacity = function() {
    const result = this.div.getAttribute('opacity');
    if (result === undefined || result === null) return 1;
    return Number(result);
  };


  SvgElement.prototype.setAnchor4div = function () {
    //NOP
  };

  //--------------------------------------------------------------------------------//


  Render.Line = function (x1, y1, x2, y2, color, width) {
    this.div = document.createElementNS(SVGNS, 'line');
    this.setEndPoints(x1, y1, x2, y2);
    this.color = color;
    this.width = width;
    this.div.setAttribute('style', 'stroke: ' + color + '; stroke-width:' + width);
  };


  Render.Line.prototype.setEndPoints = function (x1, y1, x2, y2) {
    this.div.setAttribute('x1', x1);
    this.div.setAttribute('y1', y1);
    this.div.setAttribute('x2', x2);
    this.div.setAttribute('y2', y2);
  };


  Render.Line.prototype.setColor = function (color) {
    this.color = color;
    this.div.setAttribute('style', 'stroke: ' + color + '; stroke-width:' + width);
  };


  Render.Line.prototype.setWidth = function (width) {
    this.width = width;
    this.div.setAttribute('style', 'stroke: ' + this.color + '; stroke-width:' + width);
  };

  //---------------------------------- SVG Path ------------------------------------//

  Render.SvgPath = function (data) {
    this.div = document.createElementNS(SVGNS, 'path');
    this.div.setAttribute('d', data['d']);
    if (data.fill) {
      this.div.setAttribute('fill', data['fill']);
    }

    if (data.stroke) {
      this.div.setAttribute('stroke', data['stroke']);
    }
    if (data.strokeWidth) {
      this.div.setAttribute('stroke-width', data['strokeWidth']);
    }
  };

  Render.SvgPath.prototype = Object.create(Render.RenderElement.prototype);
  Util.inherit(SvgElement, Render.SvgPath, ['setPos', 'setColor', 'getColor', 'setStroke', 'setStrokeWidth', 'setOpacity', 'getOpacity', 'setAnchor4div']);


  Render.SvgPath.prototype.setData = function (data) {
    this.div.setAttribute('d', data);
  };


  //------------------------------------ SVG Rect ------------------------------------//

  const createRect = Render.SVG.createRect = function (coords, style) {
    const result = document.createElementNS(SVGNS, 'rect');
    result.setAttribute('x', coords.x.toString());
    result.setAttribute('y', coords.y.toString());
    if (coords.rx) {
      result.setAttribute('rx', coords.rx.toString());
    }
    if (coords.ry) {
      result.setAttribute('ry', coords.ry.toString());
    }
    result.setAttribute('width', coords.width.toString());
    result.setAttribute('height', coords.height.toString());

    if (style.fill) {
      result.setAttribute('fill', style.fill);
    }
    if (coords.stroke) {
      result.setAttribute('stroke', style.stroke);
    }
    if (coords.strokeWidth) {
      result.setAttribute('stroke-width', style.strokeWidth);
    }
    return result;
  };


  Render.SvgRect = function (coords, style) {
    coords.x = 0;
    coords.y = 0;
    Render.RenderElement.call(this, coords.width, coords.height,  createRect(coords, style));
  };


  Render.SvgRect.prototype = Object.create(Render.RenderElement.prototype);
  Util.inherit(SvgElement, Render.SvgRect, ['setPos', 'setColor', 'getColor', 'setStroke', 'setStrokeWidth', 'setOpacity', 'getOpacity', 'setAnchor4div']);


  Render.SvgRect.prototype.setSize = function (width, height) {
    this.width = width;
    this.height = height;
    if (this.div) {
      this.div.setAttribute('width', width.toString());
      this.div.setAttribute('height', height.toString());
    }
    if (this.xAnchor !== 0 || this.yAnchor !== 0) {
      const topLeftPos = this.getPos2TopLeft(Number(this.x), Number(this.y), -this.scale);
      this.div.setAttribute('transform', 'translate(' + topLeftPos.x + ' ' + topLeftPos.y + ') scale(' + this.scale + ')' + (this.rotation || ''));
    }
    this.updateLinks();
    return this;
  };


  Render.SvgRect.prototype.getCornerRadius = function () {
    return {
      rx: (this.div.getAttribute('rx') || 0),
      ry: (this.div.getAttribute('ry') || 0)
    };
  };


  Render.SvgRect.prototype.setCornerRadius = function (rx, ry) {
     this.div.setAttribute('rx', rx);
     this.div.setAttribute('ry', ry);
  };


  Render.SvgPath.prototype.setParameter = function (name, value) {

  };


  //------------------------------------ SVG Circle ------------------------------------//

  const createCircle = Render.SVG.createCircle = function (coords, style) {
    const result = document.createElementNS(SVGNS, 'circle');
    result.setAttribute('cx', coords.cx.toString());
    result.setAttribute('cy', coords.cy.toString());
    result.setAttribute('r', coords.r.toString());

    if (style.fill) {
      result.setAttribute('fill', style.fill);
    }
    if (coords.stroke) {
      result.setAttribute('stroke', style.stroke);
    }
    if (coords.strokeWidth) {
      result.setAttribute('stroke-width', style.strokeWidth);
    }
    return result;
  };

  Render.SvgCircle = function (coords, style) {
    coords.cx = coords['r'];
    coords.cy = coords['r'];
    Render.RenderElement.call(this, 2 * Number(coords.r), 2* Number(coords.r),  createCircle(coords, style));
  };

  Render.SvgCircle.prototype = Object.create(Render.RenderElement.prototype);
  Util.inherit(SvgElement, Render.SvgCircle, ['setPos', 'getColor', 'setColor', 'setStroke', 'setStrokeWidth', 'getOpacity', 'setOpacity', 'setAnchor4div']);

  //------------------------------------ SVG Group ------------------------------------//

  Render.SVG.createGroup = function () {
    return document.createElementNS(SVGNS, 'g');
  };


  Render.SvgGroup = function (width, height) {
    Render.RenderElement.call(this, width, height, SVG.createGroup());
    this.div.style.transformOrigin = '';
    this.children = [];
  };

  Render.SvgGroup.prototype = Object.create(Render.RenderElement.prototype);
  Util.inherit(SvgElement, Render.SvgGroup, ['setPos', 'getColor', 'setColor', 'getOpacity', 'setOpacity', 'setAnchor4div']);


  Render.SvgGroup.prototype.setSize = function (width, height) {
    if (this.alignChildren) {
      this.alignChildren.forEach(function (child) {
        child.align(0, 0, width, height);
      });
    }
    this.width = Number(width);
    this.height = Number(height);

    this.div.setAttribute('width', width);
    this.div.setAttribute('height', height);
    if (this.xAnchor !== 0 || this.yAnchor !== 0) {
      const topLeftPos = this.getPos2TopLeft(Number(this.x), Number(this.y), -this.scale);
      this.div.setAttribute('transform', 'translate(' + topLeftPos.x + ' ' + topLeftPos.y + ') scale(' + this.scale + ')' + (this.rotation || ''));
    }
    this.updateLinks();
    if (this.backdrop) {
      this.backdrop.setSize(width, height);
    }
    return this;
  };


  Render.SvgGroup.prototype.setBindings = function (parameterBindings) {
    this.parameterBindings = parameterBindings;
    return this;
  };


  Render.SvgGroup.prototype.getParameterSource = function () {
    return this.parameterBindings === undefined ?
      {} :
      this.parameterBindings[0].getParameterSource();
  };


  Render.SvgGroup.prototype.hasParameterBindings = function () {
    return (this.parameterBindings !== undefined);
  };


  Render.SvgGroup.prototype.invalidateParameter = function (parameter) {
    this.parameterBindings.forEach(function (binding) {
      binding.invalidateParameter(parameter);
    });
    return this;
  };


  Render.SvgGroup.prototype.recalc = function () {
    this.parameterBindings.forEach(function (binding) {
      binding.recalc();
    });
    return this;
  };


  Render.SvgGroup.prototype.setParameters = function (parameterValues) {
    const parameterSource = this.getParameterSource();
    for (let parameter in parameterValues) {
      if (!parameterValues.hasOwnProperty(parameter)) continue;
      this.invalidateParameter(parameter);
      parameterSource[parameter] = parameterValues[parameter];
    }
    this.recalc();
    return this;
  };


  Render.SvgGroup.prototype.setBackdrop = function(backdrop) {
    this.backdrop = backdrop;
    return this;
  };


  Render.SvgGroup.prototype.getBackdrop = function () {
    return this.backdrop;
  };


  Render.SvgGroup.prototype.hasChildren = function () {
    return true;
  };


  Render.SvgGroup.prototype.setColor = function(color) {
    if (this.backdrop) {
      this.backdrop.setColor(color);
    }
    return this;
  };


  Render.SvgGroup.prototype.getColor = function() {
    if (this.backdrop) {
      return this.backdrop.getColor();
    }
  };


  Render.SvgGroup.prototype.addChild = function(element, autoalign) {
    this.children.push(element);
    element.setParent(this);
    this.div.appendChild(element.div);
    if (element.key === 'backdrop') {
      this.backdrop = element;
    }
    if (autoalign) {
      this.alignChildren = this.alignChildren || [];
      this.alignChildren.push(element);
      element.align(0, 0, this.width, this.height);
    }
  };


  const getChildIndex = function (group, key) {
    for (let i = 0; i < group.children.length; i++) {
      if (group.children[i].key === key) {
        return i;
      }
    }
    return -1;
  };


  Render.SvgGroup.prototype.substituteChild = function (key, newChild) {
    let childIndex = getChildIndex(this, key);

    if (childIndex === -1) throw new Error("Can't find child with key " + key);

    this.div.removeChild(this.children[childIndex].getDiv());
    this.div.appendChild(newChild.getDiv());
    newChild.key = key;
    this.children[childIndex] = newChild;
    newChild.setParent(this);
  };


  Render.SvgGroup.prototype.removeChild = function(child) {
    let childkey = (typeof child === 'string') ? child : child.key;
    const childIndex = getChildIndex(this, childkey);
    if (childIndex === -1) throw new Error("Can't find child with key " + key);
    if (typeof child === 'string') {
      child = this.children[child];
    }
    this.div.removeChild(child.getDiv());
    this.children.splice(childIndex, 1);
  };


  Render.SvgGroup.prototype.getChildren = function () {
    return this.children;
  };


  Render.SvgGroup.prototype.getChild = function (key) {
    if (Array.isArray(key)) {
      const first = this.getChild(key[0]);
      return key.length === 1 ? first : first.getChild(key.slice(1));
    }
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].key === key) return this.children[i];
    }
    return null;
  };

