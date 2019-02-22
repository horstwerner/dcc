import P from 'prop-types';
import Component from "./Component";
import ComponentFactory from "./ComponentFactory"

const TABLE = 'table';
const ROW = 'row';
const HEADER = 'header';
const CELL = 'cell';

export class Table extends Component {
  static type = TABLE;
  static baseTag = 'table';
  static propTypes = {children: P.arrayOf(P.object)}
}

export class Row extends Component {
  static type = ROW;
  static baseTag = 'tr';
  static propTypes = {children: P.arrayOf(P.object)}
}

export class Cell extends Component {
  static type = CELL;
  static baseTag = 'td';
}

export class Header extends Component {
  static type = HEADER;
  static baseTag = 'th';
}

[Table, Header, Row, Cell].forEach(type => ComponentFactory.registerType(type));

// Syntactical sugar makes for better readability

export const Header_ = (props, children) => ({_Header: {type: HEADER, children, ...props}});

export const Row_ = (props, children) => ({_Row: {type: ROW, children, ...props}});

export const Table_ = (props, children) => ({_Table: {type: TABLE, children, ...props}});

export const Cell_ = (props, children) => ({_Cell:{type: CELL, children, ...props}});
