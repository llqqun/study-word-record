# Promse学习笔记

## 1.基本概念

`Promise`是一个对象拥有三种状态

- 待定(pending): 初始状态，既没有被兑现，也没有被拒绝
- 已完成(fulfilled): 意味着操作成功完成
- 已拒绝(rejected): 意味着操作失败

同一个`Promise`的状态确定后就不能更改

原型函数:

then(), catch(), finally()

构造函数方法

race(),reject(),resolve(),all(), any()

## 2.Promise运行过程解析

```js
new Promise((resolve, reject)=>{
  console.log("1")
  resolve()
}).then(()=>{// then1
  console.log("2")
  new Promise((resolve, reject)=>{
      console.log("10")
      resolve()
  }).then(()=>{ // then3
      console.log("20")
  }).then(()=>{ // then4
      console.log("30")
  })
}).then(()=>{ // then2
  console.log("3")
})
// 1 2 10 20 3 30
```

1. new Promise时的参数回调是同步执行的, 输出1
2. resolve()执行将新创建的Promise状态修改为Fulfilled
3. 新建的Promise执行then方法,由于调用的P(Promise简称)状态是fulfilled,所以回调函数直接进入微任务队列
4. 接着执行后面的then2,因为调用的P状态是pending,所以讲回调函数加入P的缓存队列,**此时回调还没有进入微任务队列**,自此外层宏任务完成
5. 开始执行微任务队列中then1回调,输出2,同步新建一个P,输出10,修改新P状态为Fulfilled
6. 执行then3,因为调用的P是Fulfilled状态,回调函数直接加入微任务队列
7. 执行then4, 因为调用的P是pending状态,所以P缓存then4的回调函数
8. then1回调执行完成,返回值undefined,P状态修改为fulfilled,将then2的回调函数加入微任务队列
9. 执行微任务队列中then3的回调函数,输入20,将then4的回调函数加入微任务队列
10. 执行then2的回调,输出3
11. 执行then4的回调,输出30



then 返回return 是Promise测试代码, resolve入参是Promise测试代码

```js
const p1 = new Promise(res => res())
const p2 = Promise.resolve(p1)
console.log(p1 === p2) // true
```



```js
Promise.resolve(1).then(res => {
	console.log(res)
	return Promise.resolve(2)
}).then(res => {
    console.log(res) // p1-t2
})

Promise.resolve('ok').then(res => {
	console.log(res)
	return res + 1
}).then(res => {
    console.log(res)
}).then(res => {
    console.log(3)
}).then(res => {
    console.log(4)
})
// 1 ok | ok1 | 3 2 4
//这里两个 | 代表返回Promise时添加的两个微任务,延迟了p1-t2 的执行,也可以说延迟了promise的状态更新
```



总结:

1. then始终返回一个新的Promise对象

2. then方法是同步执行的,只是它的回调函数,会根据调用的Promise状态进入微任务队列

   - 调用P的状态是成功的, 则直接将回调加入微任务队列
   - 调用P的状态是失败的, 则直接将回调加入微任务队列
   - 调用P的状态是pending,将回调函数包裹缓存到新P数组中,直到调用P状态改变,新P运行自身Resolve方法将实例数组中缓存的回调加入微任务队列

3. **then和Resolve中返回Promise对象处理过程不一样**

   若then方法的参数回调函数的返回值为Promise对象，则会影响then方法返回值Promise对象的pending状态延迟2个微任务后改变。
   
   ECMA 262 规定这个动作必须通过一个 job `NewPromiseResolveThenableJob` 以异步的方式来完成，也就是说这个 job 其实执行了一个微任务，后面在执行 `NewPromiseResolveThenableJob` 时又调用了 then 函数（类似我们上面手写 Promise 时，如果返回 Promise 的话，内部回调用这个 Promise 的 then 方法），这个时候又执行了一个微任务，所以是两次微任务
   
   
   
   测试题
   
   ```js
   new Promise((reslove, reject) => {
     setTimeout(() => {
       console.log(10);
     }, 2000);
     setTimeout(() => {
       console.log(20);
     }, 1000);
     reslove();
   }).then(() => {
     console.log(1);
     return new Promise((reslove, reject) => {
       console.log('1-1');
       setTimeout(() => {
         console.log(30);
         reslove();
       }, 500);
     });
   }).then(() => {
     console.log(2);
     return new Promise((reslove, reject) => {
       console.log('2-1');
       setTimeout(() => {
         console.log(40);
         reslove();
       }, 200);
     });
   }).then(() => {
     console.log(3);
   });
   
   // 1 1-1 30 2 2-1 40 3 20 10
   ```
   
   

## 3.手写Promise

```js
export class PromiseA {
    // 状态描述 pending resolved rejected
    status: string = 'pending';
    // 结果
    value: any = undefined;
    // 保存成功回调
    onResolvedCallbacks: any = [];
    // 保存失败回调
    onRejectedCallbacks: any = [];
    constructor(executor: any) {
        // 托管构造函数的this指向
        let _this = this;
        // 让入参函数立即执行
        try {
            executor(resolve, reject);
        } catch (e) {
            reject(e);
        }
        // 修改状态为成功
        function resolve(params: any) {
            // 判断当前态是否为pending，只有pending时可更该状态
            if (_this.status === 'pending') {
                // 保存结果
                _this.value = params;
                // 设置状态
                _this.status = 'resolved';
                // 遍历执行成功回调函数
                _this.onResolvedCallbacks.forEach((fn: Function) => {
                    fn(_this.value);
                });
            }
        }
        // 修改状态为失败
        function reject(params: any) {
            // 判断当前态是否为pending，只有pending时可更该状态
            if (_this.status === 'pending') {
                _this.value = params;
                _this.status = 'rejected';
                _this.onRejectedCallbacks.forEach((fn: Function) => {
                    fn(_this.value);
                });
            }
        }
    }
    static resolve(val: any) {
        // 直接抛出一个成功状态的Promise
        return new PromiseA((resolve: any, reject: any) => {
            resolve(val);
        });
    }
    static reject(val: any) {
        if (val && typeof val.then === 'function') {
            return val;
        }
        return 1;
    }
    static all(arr: Array<PromiseA>) {
        //获取到所有的promise，都执行then，把结果放到数组，一起返回
        let resultArr: Array<any> = [];
        let result = new PromiseA((resolve: Function, reject: Function) => {
            let i = 0;
            arr.forEach((item) => {
                item.then((val: any) => {
                    resultArr.push(val);
                    if (resultArr.length === arr.length) {
                        resolve(resultArr);
                    }
                });
            });
        });
        return result;
    }
    // 只要有一个状态改变返回的Promise状态也立马改变
    static race(promises: Array<PromiseA>) {
        // return一个Promise
        return new PromiseA((resolve: Function, reject: Function) => {
            // 遍历执行promises
            for (let i = 0; i < promises.length; i++) {
                // then只要接收到状态改变，直接抛出
                promises[i].then(resolve, reject);
            }
        });
    }
    /**
     * then原型方法
     * 永远返回一个新的promise
     * @param onFulFilled 成功的回调函数
     * @param onRejected 失败的回调函数
     * @returns 一个新的PromiseA
     */
    then(onFulFilled: any, onRejected?: any) {
        // 判断参数不为函数时变成普通函数，成功-直接返回接收值 失败-抛出错误
        onFulFilled = typeof onFulFilled === 'function' ? onFulFilled : (value: any) => value;
        onRejected =
            typeof onRejected === 'function'
                ? onRejected
                : (err: any) => {
                      throw err;
                  };
        // 创建一个新的Promise实例
        let PromiseB = new PromiseA((res: any, rej: any) => {
            // 等待态判断，此时异步代码还未走完，回调入数组队列
            if (this.status === 'pending') {
                // 将成功回调push入成功队列
                this.onResolvedCallbacks.push(() => {
                    // 使用queueMicrotask实现微任务
                    queueMicrotask(() => {
                        try {
                            let val = onFulFilled(this.value);
                            // 处理返回值
                            resolvePromise(PromiseB, val, res, rej);
                        } catch (error) {
                            rej(error);
                        }
                    });
                });
                // 将失败回调push入失败队列
                this.onRejectedCallbacks.push(() => {
                    queueMicrotask(() => {
                        try {
                            let val = onRejected(this.value);
                            resolvePromise(PromiseB, val, res, rej);
                        } catch (error) {
                            rej(error);
                        }
                    });
                });
            }
            if (this.status === 'resolved') {
                queueMicrotask(() => {
                    try {
                        let val = onFulFilled(this.value);
                        resolvePromise(PromiseB, val, res, rej);
                    } catch (error) {
                        rej(error);
                    }
                });
            }
            if (this.status === 'rejected') {
                queueMicrotask(() => {
                    try {
                        let val = onRejected(this.value);
                        resolvePromise(PromiseB, val, res, rej);
                    } catch (error) {
                        rej(error);
                    }
                });
            }
        });
        return PromiseB;
    }
    catch(errFn: any) {
        // 直接执行then方法，onFulfilled为null，传入onRejected
        return this.then(null, errFn);
    }
    finally() {}
}
/**
 *解析then返回值与新Promise对象
 * @param promiseB 返回新的Promise
 * @param v 上一个then返回的值
 * @param resolved
 * @param rejected
 */
function resolvePromise(promiseB: PromiseA, v: any, resolved: Function, rejected: Function) {
    // 定义状态-防止多次调用
    let called: Boolean;
    // 解决循环引用报错
    if (promiseB === v) {
        rejected(new TypeError('避免Promise循环引用'));
    }
    if (v !== null && (typeof v === 'object' || typeof v === 'function')) {
        try {
            let then = v.then;
            if (typeof then === 'function') {
                then.call(
                    v,
                    (x: any) => {
                        if (called) return;
                        called = true;
                        resolvePromise(promiseB, x, resolved, rejected);
                    },
                    (r: any) => {
                        if (called) return;
                        called = true;
                        rejected(r);
                    }
                );
            } else {
                resolved(v);
            }
        } catch (error) {
            rejected(error);
        }
    } else {
        resolved(v);
    }
}

```

