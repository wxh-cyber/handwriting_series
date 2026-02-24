import React from 'react'
import Index from './components/Index.jsx';
import HOC from './hoc/Hoc.jsx';

const NewIndex=HOC(Index);
export default function App() {
  return (
    <div>
        <NewIndex />
    </div>
  )
}

console.log(NewIndex.say);   //undefined
/**
 * 查找过程：
 *     1.JS引擎查找newIndex这个变量。
 *     2.newIndex是wrapComponent类，它本身并没有一个名为say的属性（say不是wrapComponent的静态方法）。
 *     3.JS引擎接着查找newIndex原型（wrapComponent.prototype）。
 *     4.wrapComponent.prototype上也没有一个名为say的方法。
 *     5.JS引擎继续往上查找Object.prototype，也找不到。
 * 
 * 结果：因为 say 方法是挂载在 Index 类本身的（静态的），而 newIndex 指的是 wrapComponent 类，两者完全没有关联。JS 找不到 newIndex.say 这个属性，所以返回 undefined。
 */
