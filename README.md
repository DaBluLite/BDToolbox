# BDToolbox
A plugin that inserts a button next to the inbox button that opens a list of tools (Port of VencordToolbox, full credits to Vendicated and Autumnvn for the original plugin).

## For plugin devs
To add items to the Toolbox, the format is somewhat simmilar to that of VencordToolbox's:

```tsx
class MyPlugin {
  start() {}
  stop() {}
  getToolboxActions() {
    return {
      "My sirst option": () => console.log("hi"),
      "My second option": () => {
        const hi = "hi";
        console.log(hi);
      }
    }
  }
}
```
