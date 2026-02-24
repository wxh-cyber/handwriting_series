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

console.log(NewIndex.say);   
// ƒ () {
//   console.log('My name is Alien');
// }
