const async = require('async');
const INTERNAL = Symbol('INTERNAL');
/**
 * @description Creates a placeholder object which can be used to keep functions which can be called in parallel and post execution, the values will be assigned at proper places!
 * @example
 *  // Consider the following scenario where we need complete data on teams.
 *  // We need the data at the respective points by calling the api. (get...FromApi are async functions that make http call to some server which outputs the desired array!)
 *  const PromisePlaceholder = require('promise-placeholder');
 *  const pp = new PromisePlaceholder;
 * 
 *  const obj = {
 *      data1: pp({
 *          teams: async () => getTeamsFromApi(),
 *          playersInfo: pp({
 *              active: async () => getActivePlayersFromApi(),
 *              retired: async () => getRetiredPlayersFromApi(),
 *              joinedIn2007: async () => getPlayersFromApi(2007),
 *              joinedLater: pp({
 *                      async () => getJoinedLaterThanFromApi(2007)
 *              })
 *          })
 *      })
 *  }
 * 
 *  // Now, we need all the async calls to execute and the value to be set at the respective places.
 *  await pp.exec(); // By default executes async.parallel(); ,, other async.method can be used as an uppercase version (Example below)
 *  
 *  // By default, the above outputs the result of async[method] call but this will ideally not be required and can be ignored! 
 *  // Troper values will be placed in obj itself.
 * 
 *  console.log(obj); // will log:
 *  {
 *      data1: pp({
 *          teams: ['team1','team2'],
 *          playersInfo: pp({
 *              active: ['activeplayer1', 'activeplayer2'],
 *              retired: <retired player list>,
 *              joinedIn2007: <desired list>,
 *              joinedLater: pp({
 *                      async () => <desired list>
 *              })
 *          })
 *      })
 *  }
 * 
 * @notes 
 *    1. All the methods of async library are mapped with exec followed by first letter uppercase method name. <br/>
 *    For example: <br/>
 *    ```async.parallelLimit``` will be used when ```pp.execParallelLimit(2)``` will be called // This will make 2 concurrent calls at a time <br/>
 *    ... etc
 *    2. exec is short for execParallel which uses async.parallel <br/>
 */
class PromisePlaceholder {
    constructor() {
        const internal = {
            refs: [],
            parallels: []
        }
        const refs = internal.refs;
        const parallels = internal.parallels;
        const f = (obj) => {
            Object.entries(obj).forEach(([k, v]) => {
                if (v instanceof Function) {
                    refs.push({ obj, k });
                    parallels.push(v);
                }
            });
            return obj;
        };

        Object.setPrototypeOf(f, PromisePlaceholder.prototype);
        f[INTERNAL] = internal;

        return f;
    }

    async exec() {
        return this.execParallel();
    }
}

Object.keys(async).forEach(asyncKey => {
    const execAsyncKey = 'exec' + asyncKey[0].toUpperCase() + asyncKey.substr(1);
    PromisePlaceholder.prototype[execAsyncKey] = async function (...args) {
        const internal = this[INTERNAL];
        const refs = internal.refs;
        const parallels = internal.parallels;

        args.unshift(parallels);
        const results = await async[asyncKey].apply(async, args);
        refs.forEach(({ obj, k }, i) => {
            obj[k] = results[i];
        });
        return results;
    }
});

module.exports = PromisePlaceholder;