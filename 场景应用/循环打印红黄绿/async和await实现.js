function red() {
    console.log('red');
}

function yellow() {
    console.log('yellow');
}

function green() {
    console.log('green');
}

//定义一个辅助函数，接收时间（Timer）和要执行的函数（light）
const task=(timer,light)=>{
    return new Promise((resolve)=>{
        light();      //先行打印逻辑
        setTimeout(resolve,timer);    //定时器，等待时间到达后执行resolve
    })
};

const taskRunner = async () => {
    while(true){
        await task(3000, red);     //等待红灯亮起
        await task(2000, green);   //等待绿灯亮起
        await task(1000, yellow);  //等待黄灯亮起
    }
};

taskRunner();