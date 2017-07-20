/**
 * @param {function} fn
 * @return {PromiseLike}
 */
function when(fn) {
  const p = create();
  setTimeout(
    (p, fn) => {
      try {
        const result = fn(result => {
          p.result = result;
          next.call(p);
        });
        if (result !== undefined) {
          p.result = result;
          next.call(p);
        }
      } catch (err) {
        p.result = err;
        next.call(p);
      }
    },
    0,
    p,
    fn
  );
  return p;
}

function next() {
  this.next.forEach(next => {
    next(this.result);
  });
  this.next = [];
}

/**
 * @param {function} fn
 * @param {any} result
 */
function run(fn, result) {
  setTimeout(
    (p, fn, result) => {
      try {
        const r = fn(result);
        if (r && r.then instanceof Function) {
          r.then(d => {
            p.result = d;
            next.call(p);
          });
        } else {
          p.result = r;
          next.call(p);
        }
      } catch (err) {
        p.result = err;
        next.call(p);
      }
    },
    0,
    this,
    fn,
    result
  );
}

/**
 * @param {function} fn
 * @return {PromiseLike}
 */
function onNext(fn) {
  const p = create();
  if (Object.prototype.hasOwnProperty.call(this, 'result')) {
    if (this.result instanceof Error) {
      p.result = this.result;
    } else {
      run.call(p, fn, this.result);
    }
  } else {
    this.next.push(result => {
      if (result instanceof Error) {
        p.result = result;
        next.call(p);
      } else {
        run.call(p, fn, result);
      }
    });
  }
  return p;
}

/**
 * @param {function} fn
 * @return {PromiseLike}
 */
function onError(fn) {
  const p = create();
  if (Object.prototype.hasOwnProperty.call(this, 'result')) {
    if (this.result instanceof Error) {
      run.call(p, fn, this.result);
    } else {
      p.result = this.result;
    }
  } else {
    this.next.push(result => {
      if (result instanceof Error) {
        run.call(p, fn, result);
      } else {
        p.result = result;
        next.call(p);
      }
    });
  }
  return p;
}

let id = 0;
/**
 * @return {PromiseLike}
 */
function create() {
  const p = Object.create(null);
  p.id = ++id;
  p.then = onNext.bind(p);
  p.catch = onError.bind(p);
  p.next = [];
  return p;
}

/**
 * @param {any} data
 * @return {PromiseLike}
 */
function resolve(data) {
  const p = create();
  p.result = data;
  return p;
}

/**
 * @param {string|Error} reason
 * @return {PromiseLike}
 */
function reject(reason) {
  const p = create();
  if (reason instanceof Error) {
    p.result = reason;
  } else {
    p.result = new Error(String.prototype.toString.call(reason || ''));
  }
  return p;
}

/**
 * @param {any[]} arr
 * @return {PromiseLike}
 */
function race(arr) {
  const p = create();
  const set = data => {
    if (!Object.prototype.hasOwnProperty.call(p, 'result')) {
      p.result = data;
    }
  };
  if (Array.isArray(arr)) {
    arr.forEach(pc => {
      if (pc && pc.then instanceof Function) {
        if (Object.prototype.hasOwnProperty.call(pc, 'result')) {
          set(pc.result);
        } else {
          pc.then(data => {
            set(data);
            next.call(p);
          });
        }
      } else {
        set(pc);
      }
    });
  } else {
    p.result = undefined;
  }
  return p;
}

/**
 * @param {any[]} arr
 * @return {PromiseLike}
 */
function all(arr) {
  const p = create();
  if (Array.isArray(arr)) {
    const total = arr.length;
    const result = new Array(total);
    let count = 0;
    const check = () => {
      if (count === total) {
        const errs = result.filter(e => e instanceof Error);
        if (errs.length > 0) {
          p.result = errs[0];
        } else {
          p.result = result;
        }
        next.call(p);
      }
    };
    arr.forEach((pc, i) => {
      if (pc && pc.then instanceof Function) {
        if (Object.prototype.hasOwnProperty.call(pc, 'result')) {
          result[i] = pc.result;
          ++count;
        } else {
          pc
            .then(data => {
              result[i] = data;
              ++count;
              check();
            })
            .catch(err => {
              result[i] = err;
              ++count;
              check();
            });
        }
      } else {
        result[i] = pc;
        ++count;
      }
      check();
    });
  } else {
    p.result = [];
  }
  return p;
}

module.exports = {
  when,
  resolve,
  reject,
  all,
  race,
};
