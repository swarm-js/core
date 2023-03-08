# Swarm plugins

You can extend Swarm with plugins. A plugin is an ES6 class with a setup static method.

```js
//class MyController {}

export default class MySwarmPlugin {
  static async setup(instance) {
    // And then, you can call every Swarm method here
    // Ex: instance.addController(MyController)
  }
}
```
