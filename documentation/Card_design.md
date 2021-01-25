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
* `chart` currently only four `chartType` values are supported: `rect`, `stackedBar`, `graph` and `polar`
* `trellis` will group nodes in a node set by a specified attribute and create a set of cards representing each subset respectively.
* `card` displays an associated node or an aggregation of these in a single nested card
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
