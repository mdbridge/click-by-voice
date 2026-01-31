///
/// Framework for alternating sensing and mutating the DOM to avoid
/// extra forced layouts.
///
/// Provides Batcher

"use strict";

let Batcher = null;

(function() {

    let sensing_work  = [];
    let mutating_work = [];

    // Use these functions to submit work for this cycle.
    function sensing(thunk) {
        sensing_work.push(thunk);
    }
    function mutating(thunk) {
        mutating_work.push(thunk);
    }

    // Run all work for the current cycle, continuing until no more
    // work submitted for the current cycle.
    function do_work() {
        let result = "";
        while (sensing_work.length + mutating_work.length > 0) {
            let work = sensing_work; sensing_work = [];
            result += "; " + run_sensing_stage(work);
            work = mutating_work; mutating_work = [];
            result += "; " + run_mutating_stage(work);
        }
        return result.substring(2);
    }


    // These are separate helping functions so they can be
    // distinguished in stack traces.
    function run_sensing_stage(work) {
        const start = performance.now();
        work.map(function (thunk) {
            thunk();
        });
        return Util.time(start);
    }
    function run_mutating_stage(work) {
        const start = performance.now();
        work.map(function (thunk) {
            thunk();
        });
        return Util.time(start);
    }


    Batcher = {
        sensing: sensing,
        mutating: mutating,
        do_work: do_work
    };
})();
