# Data Model of the Development Control Center
The DCC is using a graph model for all the data. This graph model is mapped to Javascript objects, which means that edges
are no first-class citizens. Instead, nodes have properties with the name of the respective association type as key and
the associated nodes as value. The type of associated entities can also be used as association type.
To ensure that edges can be traversed in either direction, the DCC will automatically generate an inverse association at
the target node pointing back to the source node.

In oder to tell the DCC which properties are associations and which are attributes (with atomic values), a data dictionary
is required. For the test data, it is contained in the file `dictionary.json`.

It has this form:
```
{
  "TypeDictionary": [
  <type definition>,
  <type definition>,
  ...
  ]}
```
Where a type definition is a json object with these properties:

```
{
  "uri": "jira:ticket",
  "dataType": "ENTITY",
  "name": "Ticket",
  "isAssociation": false
},
```

`uri` is a globally unique identifier for each type. To make these uris shorter, the usage of a namespace prefix is
recommended: in the example `jira:`. A mapping of prefixes to urls may be added later for interoperability purposes.
The namespace `core:` is reserved for the DCC's built-in data types.

`dataType` can be one of the following: `ENTITY`, `INTEGER`, `FLOAT`, `STRING` or `BOOLEAN`.
`name` is the display name of the data type.
`isAssociation` is specified if `dataType` is `Entity` to tell whether the type is only used for associations or whether
entities of this type can exist. If `isAssociation` is `true`, an additional property `inverseType` can be specified:

``` 
{
  "uri": "jira:depends-on",
  "dataType": "ENTITY",
  "name": "depends on",
  "isAssociation": true,
  "inverseType": "jira:is-prerequisite-for"
}
```

If no inverse type is specified, the DCC will always use the type of the associated entity as association type when it
creates an inverse (or backward) association.
