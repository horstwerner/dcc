import Component, {DEFAULT_SPATIAL} from "@symb/Component";
import css from "./Map.css";
import {Div_} from "@symb/Div";
import {zoomAround} from "@/util/CoordinateTransformation";
import ComponentFactory from "@symb/ComponentFactory";

const MAP = 'map';

const ZOOM_SENSITIVITY = 0.01;
export const MIN_DRAG_DIST_SQUARE = 4;

export const distSquare = (a, b) => (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);

class Map extends Component {
    static type = MAP;
    static className = css.map;

    state;

    constructor(props, parent, domNode) {
      super(props, parent, domNode);

      this.state = {
        transformation: props.innerSpatial || DEFAULT_SPATIAL,
        mouseIsDown: false,
        isDragging: false,
        mouseDownPos: {x: 0, y: 0},
        lastMousePos: {x: 0, y: 0}
      };
      this.handleMouseWheel = this.handleMouseWheel.bind(this);
      this.handleMouseDown = this.handleMouseDown.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.dom.onwheel = this.handleMouseWheel;
      this.dom.onmousedown = this.handleMouseDown;
    }

    inChildCoords(clientX, clientY) {
      const relSpatial = this.getRelativeSpatial(null);
      return ({x: (clientX - relSpatial.x) / relSpatial.scale, y: (clientY - relSpatial.y) / relSpatial.scale });
    }

    hasClickHandler() {
      return true;
    }

  handleMouseDown(event) {
      const pos = this.inChildCoords(event.clientX, event.clientY);
      this.setState({mouseIsDown: true, isDragging: false, mouseDownPos: pos, lastMousePos: pos});
      window.onmousemove = this.handleMouseMove;
      window.onmouseup = this.handleMouseUp;
      window.onmouseleave = this.handleMouseUp;
    }

    handleMouseMove(event) {
      const { mouseDownPos, transformation } = this.state;
      let { isDragging, lastMousePos } = this.state;


      const pos = this.inChildCoords(event.clientX, event.clientY);
      if (!isDragging && distSquare(mouseDownPos, pos) > MIN_DRAG_DIST_SQUARE) { // start dragging
        isDragging = true;
        lastMousePos = mouseDownPos;
      }
      if (isDragging) {
        const delta = {x: pos.x - lastMousePos.x, y: pos.y - lastMousePos.y};
        const newTransformation = {x: transformation.x + delta.x, y: transformation.y + delta.y, scale: transformation.scale};
        this.setState({isDragging, lastMousePos: pos, transformation: newTransformation});
      }
    }

    handleMouseUp(event) {
      const { isDragging } = this.state;
      window.onmousemove = null;
      window.onmouseup = null;
      window.onmouseleave = null;
      this.setState({isDragging: false});
      let clicked = event.target;
      let onClick;
      while (!(onClick = clicked.whenClicked) && clicked.parentNode) {
        clicked = clicked.parentNode;
      }
      // noinspection JSUnresolvedVariable
      if(!isDragging && onClick) {
        // noinspection JSUnresolvedFunction
        onClick(event);
      }
    }

    handleMouseWheel(event) {
      const {minScale, maxScale} = {minScale: 0.1, maxScale: 10, ...this.innerProps};

      event.preventDefault();
      const oldSpatial = this.state.transformation;
      const pivot = this.inChildCoords(event.clientX, event.clientY); //{x: (event.clientX - this.getSpatial().x), y: (event.clientY - this.getSpatial().y)};
      const factor = Math.min(1.15, Math.max(1 - event.deltaY * ZOOM_SENSITIVITY, 0.85));
      const newScale = Math.min(maxScale, Math.max(minScale, factor * oldSpatial.scale));
      this.setState({transformation: zoomAround(pivot, newScale, oldSpatial)});
    }

    createChildDescriptors({children}) {
      const { transformation } = this.state;
      return Div_({className: css.innerPlane, spatial: transformation, children})._Div;
    }
}

ComponentFactory.registerType(Map);

export const Map_ = (props, children) => ({_Map: {type: MAP, children, ...props}});
