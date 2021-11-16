<h1 align="center">Welcome to promise-placeholder 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/prkeshri/node-promise-placeholder#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/prkeshri/node-promise-placeholder/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/github/license/prkeshri/promise-placeholder" />
  </a>
</p>

> Creates a placeholder object which can be used to keep functions which can be called in parallel and post execution, the values will be assigned at proper places!

### 🏠 [Homepage](https://github.com/prkeshri/node-promise-placeholder#readme)

## Install

```sh
npm install
```

<a name="PromisePlaceholder"></a>

<a name="new_PromisePlaceholder_new"></a>

### new PromisePlaceholder()
Creates a placeholder object which can be used to keep functions which can be called in parallel and post execution, the values will be assigned at proper places!

**Example**  
```js
// Consider the following scenario where we need complete data on teams.
 // We need the data at the respective points by calling the api. (get...FromApi are async functions that make http call to some server which outputs the desired array!)
 const PromisePlaceholder = require('promise-placeholder');
 const pp = new PromisePlaceholder;

 const obj = {
     data1: pp({
         teams: async () => getTeamsFromApi(),
         playersInfo: pp({
             active: async () => getActivePlayersFromApi(),
             retired: async () => getRetiredPlayersFromApi(),
             joinedIn2007: async () => getPlayersFromApi(2007),
             joinedLater: pp({
                     async () => getJoinedLaterThanFromApi(2007)
             })
         })
     })
 }

 // Now, we need all the async calls to execute and the value to be set at the respective places.
 await pp.exec(); // By default executes async.parallel(); ,, other async.method can be used as an uppercase version (Example below)
 
 // By default, the above outputs the result of async[method] call but this will ideally not be required and can be ignored! 
 // Troper values will be placed in obj itself.

 console.log(obj); // will log:
 {
     data1: pp({
         teams: ['team1','team2'],
         playersInfo: pp({
             active: ['activeplayer1', 'activeplayer2'],
             retired: <retired player list>,
             joinedIn2007: <desired list>,
             joinedLater: pp({
                     async () => <desired list>
             })
         })
     })
 }
```
**Notes**: 
   1. All the methods of async library are mapped with exec followed by first letter uppercase method name. <br/>
   For example: <br/>
   ```async.parallelLimit``` will be used when ```pp.execParallelLimit(2)``` will be called // This will make 2 concurrent calls at a time <br/>
   ... etc
   2. exec is short for execParallel which uses async.parallel <br/>  

## Run tests

```sh
npm run test
```

## Author

👤 **Praveen Ranjan Keshri**

* Github: [@prkeshri](https://github.com/prkeshri)
* LinkedIn: [@prkeshri](https://linkedin.com/in/prkeshri)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/prkeshri/node-promise-placeholder/issues). 

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_