# Designing Card Templates

A card template is a JSON object with the following properties:

* `id`: this is the key by which a template can be unambiguously referenced
* `appliesTo` is the type of object the template can visualize. These types are defined in the data dictionary (see `Data_model.md`)
* `name` is the name of the view this template represents. For each object type, multiple views can be specified
* `aggregate` has a boolean value `true` or `false`. If `true`, the template visualizes a set of graph nodes instead of a single node
* `size`: an object containing the properties `w` and `h` to describe the native (unscaled) size of the card in pixels
* `clickable` boolean. It defines whether this card can be clicked and thus become the focus card or whether it is only 
used as a layout element in other cards.
* `background` The background can have two values for `type`:  `rect` or `image`
* `colorcoding` optional. Describes how the background color is derived from attribute values of the data node
* `elements` An array of JSON objects defining the inner layout. Each element must have a `key` and `type` attribute, as well as `x`, `y`, `w` and `h` to define position and size. Other attributes depend on the element type.

There are currently the following types of elements:
* `textfield` a text element that binds directly to the specified `attribute` of the data node
* `caption` caption can mix predefined text and data attributes. The attribute names are enclosed in handlebars `{{` and `}}`
* `box` a (optionally rounded) rectangle
* `image` an image
* `link` a hyperlink
* `chart` currently only four `chartType` values are supported: `rect`, `stackedBar`, `graph` and `polar`
* `trellis` will group nodes in a node set by a specified attribute and create a set of cards representing each subset respectively.
* `card` displays an aggregation of associated nodes in a single nested card
* `cards` displays associated nodes as a set of cards which are arranged in a raster

Here is an example from the development server:
```    {
      "id": "ticket-compact",
      "name": "Compact",
      "appliesTo": "jira:ticket",
      "aggregate": false,
      "size": { "w": 220, "h": 120},
      "background": { "type": "rect", "w": 220, "h": 120, "cornerRadius": "6px"},
      "clickable": true,
      "colorcoding": {
        "type": "selection",
        "attribute": "jira:status",
        "cases": {
          "$": "COLOR_BY_STATUS"
        },
        "default": {
          "$": "DEFAULT_TICKET_COLOR"
        }
      },
      "elements": [
        {
          "key": "heading-large",
          "type": "textfield",
          "x": 10, "y": 35, "w": 200, "h": 50,
          "attribute": "uri",
          "style": {"font-weight": "bold", "color": "white", "font-size": "30px", "h-align": "center"}
        }
      ]
    },
```

## Element parameters

### All elements:
* `key` an identifier that must be unique in the scope of the parent element
* `x`, `y`, `w`, `h` x and y position, width and height of the element (in the parent element's coordinate system)

### textfield
* `attribute` the attribute of the card node to be displayed
* `style` an object that corresponds to a css style, supporting these attributes
  * `color`
  * `background-color`
  * `border-radius`
  * `font-weight`
  * `font-size`
  * `padding`
  * `z-index`
  * `font-family`
  In addition, these non-css style attributes are supported:
  * `h-align` (`left`, `center` or `right`)
  * `v-align` (`top`, `center` or `bottom`)

### caption
Caption is the same as a text field, but instead of `attribute`, it has a `text` attribute, which is a text literal
which can embed node attribute values with handlebar syntax, e.g. `Node {{core:name}}`

### box
The box is the same as a text field without any text. It's appearance is controlled by the style attributes

### image
  * `source` URL of the image source
  * `color` (optional) background color behind the image
  * `style` as in textfield

### link
  * `urlAttribute` node attribute containing the link target
  * `text` Link text
  * `style` as in textfield

### chart
  * `chartType` (`rect`, `stackedBar`, `graph` or `polar`)
  * `source` node attribute containing the data for the chart
  * `inputSelector` `{"<attribute>": "<comparator><comparand>"}`
    where `<comparator>` is one of `=`, `!=`, `<`, `<=`, `>`,`>=`, `empty`, `exists`, `contains`, `!contains`, `->`
    The input selector filters the data from `source` before it is fed into the chart
  * `overlay` a set of contextual nodes that amend the nodes fed into the chart by calculated attributes - arcane

For chart type `rect`, a single bar proportional to an attribute value is rendered:
  * `maxValue` specifies the largest possible attribute value 
  * `maxW` specifies the width of the bar for the largest possible attribute value
  * `h` the height of the bar
  * `color`
  * `attribute` the node attribute to evaluate

For chart type `stackedBar`:
  * `totalWidthValue` either a number or the name of an attribute that specifies the attribute value corresponding with the total width of the stacked bar
  * `widthAttribute` the attribute to evaluate for the width of each node's bar
  * `h` the height of the stacked bar
  * `colorAttribute` the attribute used to choose the color for each node's bar
  * `colors`: an array of objects of the form `{"condition": "<comparator><comparand>","color": "<color>"},
  * `sortSequence` (`asc`, `desc`, `byUri`) if `asc` or `desc`, the nodes are sorted by the attribute specified in `colorAttribute`

For chart type `graph`:
  * `path` a path expression used to traverse from one graph node to the next
    can contain multiple associations separated by `/`. A `*` at the end of a path segment means that this
    association is evaluated recursively
  * `bounded` (`true` or `false`) If `true` only nodes that were in the chart source (before the inputselector is applied)
    are rendered in the graph
  * `nodeAspectRatio` width to height ration of the graph nodes
  * `viewName` name of the template view to be selected for each graph node

For chart type `polar`:
  * `dimensions` an array of attribute names
  * `maxValues` an object assigning a maximal value for each of the dimensions
  * `labels` an array of Label texts for the dimensions
  * `labelStyle` same as `style` in `textfield`
  * `diameter`
  * `colorStops` an array of objects of the form `{"percent": "<number>", "color":  "<color>"}`

### cards
Displays individual cards for each associated node of the specified association in a grid
  * `source` the association type to evaluate
  * `arrangement` an object with the following attributes:
    * `type` currently only `grid` is supported
    * `padding` fraction of card size left free between cards, e.g. 0.1 for 10%
    * `maxScale` if specified prevents children from being scaled up beyond this factor even if more space is available
    * `centerX`, `centerY` if set to `true` the cards grid is centered in the available space
  * `inputSelector` as in chart
  * `template` (optional) id of the template to use for the card layout - if left out will be determined by node type 
  * `viewName` if `template` is not specified, specifies which of the applicable templates for the node type is chosen
  * `options` a key-value object that preselects view options of the applied template

### card
Similar to `cards`, but displays one card for the totality of the associated nodes. The template that is used
must have `aggregate: true`. The `template` must be specified, `viewName` is not applicable.
`name` can be specified 

## Color coding

The `colorcoding` attribute of a template specifies the color of the card background depending on an attribute value

* `type` (`selection` or `gradient`) for discrete colors or a continuous range of colors
* `attribute` the attribute to be evaluated for the color coding
* `cases` only applicable for `selection`, it is the same as `colors` in the stacked bar chart:
    an array of objects of the form `{"condition": "<comparator><comparand>","color": "<color>"},
* `default` the color to choose if the color attribute is missing
* `markers` only applicable for `gradient`: An array of objects with tke keys `value` and `color`, same as in polar chart

## Aggregate Card Templates
Before an aggregate card is created, an artificial graph node (the "aggregate node" representing the whole node set is
created. By default, it has the properties `core:subNodes` which contains the set of individual nodes the card represents
and `core:nodeCount` which indicates the number of nodes in that set. It will also have a `core:name` attribute if `name`
was specified in the `card` element of the parent template. The `core:name` attribute is automatically set by a `trellis`
element for each subgroup.

## Preprocessing

Both single node and aggregate templates can specify certain preprocessing steps to be applied to the node set before rendering:
`preprocess`: An array of preprocessing directives
Each directive is an object with the following attributes:
`input`: the property (association type) of the card node to evaluate
`inputSelector`: a filter as described above
`method`: (`aggregate`, `set-context`, `path-analysis`, `derive-associations`)
`result` name of the attribute of the card node in which the result is stored



