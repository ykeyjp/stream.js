import test from 'ava';
import promise from '../promise';

test('when -> then', async t => {
  t.plan(1);
  await promise
    .when(() => {
      return 1;
    })
    .catch(() => {
      t.fail();
    })
    .then(data => {
      t.is(data, 1);
    })
    .catch(() => {
      t.fail();
    });
});

test('when -> then(x2)', async t => {
  t.plan(2);
  const p = promise.when(resolve => {
    setTimeout(() => {
      resolve(1);
    }, 50);
  });
  p.then(data => {
    t.is(data, 1);
  });
  p.then(data => {
    t.is(data, 1);
  });
  p.catch(() => {
    t.fail();
  });
  await p;
});

test('when -> then -> then', async t => {
  t.plan(2);
  await promise
    .when(resolve => {
      setTimeout(() => {
        resolve(1);
      }, 10);
    })
    .then(data => {
      t.is(data, 1);
      return 2;
    })
    .then(data => {
      t.is(data, 2);
    });
});

test('when -> then -> when -> then', async t => {
  t.plan(1);
  await promise
    .when(resolve => {
      setTimeout(() => {
        resolve(1);
      }, 10);
    })
    .then(data => {
      return promise.when(resolve => {
        setTimeout(() => {
          resolve(data * 10);
        }, 10);
      });
    })
    .then(data => {
      t.is(data, 10);
    });
});

test('when -> catch', async t => {
  t.plan(1);
  await promise
    .when(() => {
      throw new Error('err');
    })
    .then(() => {
      t.fail();
    })
    .catch(err => {
      t.deepEqual(err, new Error('err'));
    });
});

test('when -> catch -> then', async t => {
  t.plan(1);
  await promise
    .when(() => {
      throw new Error('err');
    })
    .then(() => {
      t.fail();
    })
    .catch(() => {
      return 1;
    })
    .then(data => {
      t.is(data, 1);
    });
});

test('when -> then -> catch', async t => {
  t.plan(2);
  await promise
    .when(() => {
      return 1;
    })
    .then(data => {
      t.is(data, 1);
      throw new Error('err');
    })
    .catch(err => {
      t.deepEqual(err, new Error('err'));
    });
});

test('resolve -> then', async t => {
  t.plan(1);
  await promise
    .resolve(1)
    .catch(() => {
      t.fail();
    })
    .then(data => {
      t.is(data, 1);
    })
    .catch(() => {
      t.fail();
    });
});

test('reject -> catch', async t => {
  t.plan(2);
  await promise
    .reject('err')
    .then(() => {
      t.fail();
    })
    .catch(err => {
      t.deepEqual(err, new Error('err'));
    });
  await promise
    .reject(new Error('err'))
    .then(() => {
      t.fail();
    })
    .catch(err => {
      t.deepEqual(err, new Error('err'));
    });
});

test('reject -> catch -> then', async t => {
  t.plan(1);
  await promise
    .reject('err')
    .then(() => {
      t.fail();
    })
    .catch(() => {
      return 1;
    })
    .then(data => {
      t.is(data, 1);
    });
});

test('race', async t => {
  t.plan(4);
  await promise
    .race([
      promise.resolve(1),
      promise.when(resolve => {
        setTimeout(() => {
          resolve(2);
        }, 10);
      }),
    ])
    .then(data => {
      t.is(data, 1);
    });
  await promise
    .race([
      promise.when(resolve => {
        setTimeout(() => {
          resolve(1);
        }, 10);
      }),
    ])
    .then(data => {
      t.is(data, 1);
    });
  await promise.race([1, 2]).then(data => {
    t.is(data, 1);
  });
  await promise.race(null).then(data => {
    t.is(data, undefined);
  });
});

test('all', async t => {
  t.plan(3);
  await promise
    .all([
      0,
      promise.resolve(1),
      promise.when(resolve => {
        setTimeout(() => {
          resolve(2);
        }, 10);
      }),
      promise.when(resolve => {
        setTimeout(() => {
          resolve(3);
        }, 30);
      }),
    ])
    .then(data => {
      t.deepEqual(data, [0, 1, 2, 3]);
      return 4;
    })
    .then(data => {
      t.is(data, 4);
    });
  await promise.all(null).then(data => {
    t.deepEqual(data, []);
  });
});

test('all - error', async t => {
  await promise
    .all([promise.reject()])
    .then(() => {
      t.fail();
    })
    .catch(() => {
      t.pass();
    });
});
