import m1 from './module1.js'

m1.age = 99
console.log('module2');
export default  {
    name: '小白',
    age: 20,
    fun(params) {
        console.log('我是小白')
    }
}
export const m3 = m1