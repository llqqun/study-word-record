```js
class People {
    // name; 这种显示声明会和set/get 语法绑定冲突
    #nameValue = '小明';
    age = 32; // 声明公共实例字段,并设置初始值
    #birthdate = '1991-01-01'; // 声明私有字段,只能在所属类中读取和修改
    
    static heartbeat = 80; // 静态字段,绑定在类上面,只能类.使用
    static #MAX_NUM = 3
    static instance = 0
    
    // 构造函数
    constructor(sex) {
        People.instance++
        if (People.instance > People.#MAX_NUM) {
            throw new Error('人数已经超过最大限制了')
        }
        console.log('新生了一个人')
        this.name = '人名' // 隐式声明实例变量,不会和set/get语法冲突
        this.sex = sex // 另一种方式声明实例字段
    }
    // 实例方法,实例通过实例方法进行计算或者操作内部私有变量,调用私有方法
    publicFun() {
        this.#privateFun()
    }
    setBirthdate(ages) {
        this.#birthdate = ages
    }
    // 内部访问私有变量
    getBirthdate() {
        return this.#birthdate
    }
    // 私有方法,只能在类的内部调用,实例不能直接调用(可以通过实例方法调用私有方法)
    #privateFun() {
        console.log(People.heartbeat)
        console.log(this.#birthdate)
    }
    // 静态方法
    // 静态方法可以访问静态字段。
    // 静态方法不能访问实例字段。
    static classFun() {
        console.log('静态方法:', People.#MAX_NUM)
        console.log('静态方法:', this.age) // 访问不到实例字段
    }
    
    // get/set 语法 将实例的属性和查询该属性时调用的函数进行绑定
    // 隐式的给实例添加了name 属性
    // 若是在类中公开声明过同名的实例变量,则 get/set 语法不生效
    get name() {
        return this.#nameValue
    }
    set name(name) {
        this.#nameValue = name
    }
}

class child extends People {
    job = '程序员';
    // 在使用this关键字之前，必须在子构造函数中执行super()。调用super()确保父构造函数初始化实例。
    constructor(obj) {
        super('男');
        this.name = obj.name
    }
    // 重写父类中的方法
    publicFun() {
        console.log('子类重写方法')
        return this.name
    }
    childFun () {
        console.log(this.publicFun())
        // 通过super访问父类中的方法
        return super.publicFun()
    }
}
```
