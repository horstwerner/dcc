import React, {Component} from 'react';
import P from 'prop-types';
import css from './Moveable.module.css';
import {getTransformString} from './util.js'

export default class Moveable extends Component {

  static propTypes = {
    xAnchor: P.number,
    yAnchor: P.number,
    initialX: P.number.isRequired,
    initialY: P.number.isRequired,
    initialScale: P.number.isRequired,
    initialAlpha: P.number,
    children: P.node.isRequired,
    onClick: P.func
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  updateTransform(x, y, scale) {
    if (isNaN(x) || isNaN(y) || isNaN(scale)) {
      throw new Error(`${x} ${y} ${scale}`);
    }
    if (!this.hasPosition()) {
      this.setState({hasPosition: true, x, y, scale});
    } else {
      Object.assign(this.state, {x, y, scale});
      this.div.style.transform = getTransformString(x, y, scale);
    }
  }

  updateAlpha(alpha) {
    this.setState({alpha});
  }

  getPos() {
    const {initialX, initialY, initialScale} = this.props;
    const {x, y, scale} = {x: initialX, y: initialY, scale: initialScale, ...this.state};
    return {x, y, scale};
  }

  getAlpha() {
    return this.state.alpha || this.props.initialAlpha;
  }

  hasPosition() {
    return this.state.hasPosition;
  }

  render() {
    const {children, xAnchor, yAnchor, width, height, initialX, initialY, initialScale, initialAlpha, onClick} = this.props;

    const params = {x: initialX, y: initialY, scale: initialScale, alpha: initialAlpha, ...this.state};
    const {x, y, scale, alpha} = params;

    return (
        <div className={css.moveable} ref={(div) => {
          this.div = div;
        }}
             onClick={onClick}
             style={{
               width, height,
               transformOrigin: `${xAnchor * 100}% ${yAnchor * 100}%`,
               transform: `translate(${x}px, ${y}px) scale(${scale})`,
               opacity: (alpha)
             }}>
          {children}
        </div>
    );
  }
}