# A virtual list which can handle child items with variable heights.
     
### Usage:

`virtualList(config: Config): Instance`

```
type Config = {
  container: Element                    // target element
  containerHeight?: Number              // default: 500px
  itemsCount: Number                    // items count
  render: (index: Number) => Element    // callback to get item element
  throttleMs?: Number                   // throttle updates
}
```
    
```
type Instance = {
  update(newItemsCount: Number)         // re-calculate items
  dispose()                             // remove event listeners
}
```
