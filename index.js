const async = require('async');
const INTERNAL = Symbol('INTERNAL');
const utils = require('./utils');

/**
 * @name PromisePlaceholder.withAsync
 * @description Ability to pass custom async library such as another version of async or any other library.
 *  Will map that libraries method instead of async as above
 * @example
 *  // Instead of 
 *      new PromisePlaceholder //(See below),
 *      new (PromisePlaceholder.withAsync(customAsyncOrOtherLib)) // The outer brackets are necessary
 */
const withAsync = function (async) {
    class PromisePlaceholder {
        constructor() {
            const internal = {
                refs: [],
                parallels: [],
                reviver: null,
                results: null
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

        /**
         * @description Sets a reviver otherwise plain assignment is used. Can be used to revive manually! 
         * @param {function(original_object, key, value, complete_result_set, result_index) | string} reviver If reviver = 'ignore', the revival will be skipped and the values need to be revived manually
         */
        setReviver(reviver) {
            this[INTERNAL].reviver = reviver;
        }

        /**
         * @description Returns results array of execution
         * @returns results
         */
        getResults() {
            return this[INTERNAL].results;
        }
        
        /**
         * @description Returns internal references
         * @returns refs
         */
        getRefs() {
            return this[INTERNAL].refs;
        }
        
        /**
         * @returns Length of current of functions in the queue
         */
        size() {
            return this[INTERNAL].refs.length;
        }

        /**
         * @description Calls async.parallel and stores the values at the respective places!
         * @returns Result of async.parallel (may be discarded)
         */
        async exec() {
            return this.execParallel();
        }

        /**
         * @description Instead of calling the promisePlaceholder at every step, it may be desirable to deep iterate the object and collect all the functions!
         * @param { Object } obj 
         * @returns { PromisePlaceholder }
         * 
         * @example 
         *  // In the example for {@link Placeholder}, instead of wrapping every object having a promise inside a pp() call,
         *  // just call once like:
         *  const obj = {
         *      data1: {
         *          teams: async () => getTeamsFromApi(),
         *          playersInfo: {
         *              active: async () => getActivePlayersFromApi(),
         *              retired: async () => getRetiredPlayersFromApi(),
         *              joinedIn2007: async () => getPlayersFromApi(2007),
         *              joinedLater: {
         *                      2008: async () => getJoinedLaterThanFromApi(2007)
         *              }
         *          }
         *      }
         *  }
         * 
         * // Now:
         * await (new PromisePlaceholder()).collect(obj).exec();
         * After await resumes, obj will have all the values instead of functions! 
         */
        collect(obj) {
            const f = this;
            utils.iterEx(obj, (o) => {
                f(o);
            });
            return f;
        }
    }

    Object.keys(async).forEach(asyncKey => {
        const execAsyncKey = 'exec' + asyncKey[0].toUpperCase() + asyncKey.substr(1);
        PromisePlaceholder.prototype[execAsyncKey] = async function (...args) {
            const internal = this[INTERNAL];
            const refs = internal.refs;
            const parallels = internal.parallels;
            const reviver = internal.reviver;

            args.unshift(parallels);
            const results = await async[asyncKey].apply(async, args);
            internal.results = results;

            if(reviver === 'ignore') {
                return;
            }
            refs.forEach(({ obj, k }, i) => {
                if(reviver) {
                    reviver(obj, k, results[i], results, i);
                } else {
                    obj[k] = results[i];
                }
            });

            return results;
        }
    });

    return PromisePlaceholder;
}

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
 *                      2008: async () => getJoinedLaterThanFromApi(2007)
 *              })
 *          })
 *      })
 *  }
 * 
 *  // Note: pp() -> This call collects all the keys with value as a function in the object. It DOES NOT iterate deep, that's the reason pp() is should be called on every object which has a function value in any key which should be included in a parallel call.
 *  // In case of deep-iteration is deserved, see {@link PromisePlaceholder#collect}
 *  // Now, we need all the async calls to execute and the value to be set at the respective places.
 *  await pp.exec(); // By default executes async.parallel(); ,, other async.method can be used as an uppercase version (Example below)
 *  
 *  // By default, the above outputs the result of async[method] call but this will ideally not be required and can be ignored! 
 *  // Troper values will be placed in obj itself.
 * 
 *  console.log(obj); // will log:
 *  {
 *      data1: {
 *          teams: ['team1','team2'],
 *          playersInfo: {
 *              active: ['activeplayer1', 'activeplayer2'],
 *              retired: <retired player list>,
 *              joinedIn2007: <desired list>,
 *              joinedLater: {
 *                      2008: <desired list>
 *              }
 *          }
 *      }
 *  }
 * 
 * @notes 
 *    1. All the methods of async library are mapped with exec followed by first letter uppercase method name. <br/>
 *    For example: <br/>
 *    ```async.parallelLimit``` will be used when ```pp.execParallelLimit(2)``` will be called // This will make 2 concurrent calls at a time <br/>
 *    ... etc
 *    2. exec is short for execParallel which uses async.parallel <br/>
 */
const PromisePlaceholder = withAsync(async);

PromisePlaceholder.withAsync = withAsync;

module.exports = PromisePlaceholder;
