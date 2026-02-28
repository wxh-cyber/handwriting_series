function red() {
    console.log('red');
}

function yellow() {
    console.log('yellow');
}

function green() {
    console.log('green');
}

const task = (timer, light, callback) => {
    setTimeout(() => {
        if (light == 'red') {
            red();
        } else if (light == 'yellow') {
            yellow();
        } else if (light == 'green') {
            green();
        }
        callback();
    }, timer);
}

const step = () => {
    task(3000, 'red', () => {
        task(2000, 'green', () => {
            task(1000, 'yellow', step);
        })
    });
}

step();