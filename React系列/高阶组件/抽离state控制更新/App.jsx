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

/**
 *    本例在HOC中封装了对象的初始值，以及操作原组件属性的方法，通过父子组件通信的方式将其传递给子组件。
 *    子组件内部通过props获取父组件传递过来的方法，并在组件内部进行使用。
 */