const playerParam = new URLSearchParams(window.location.search).get('player') || '1';
const socket = io({ query: { player: playerParam } });
let interval;
let phoneData = [];

let gyroscopeData = {
    x: '',
    y: '',
    z: ''
}

let accelerometerData = {
    x: '',
    y: '',
    z: ''
}

window.onload = function() {
    socket.emit('connected')
    const heading = document.querySelector('h1');
    if (heading) heading.textContent = 'Player ' + playerParam + ' — Gesture Control';
    initSensors();

    document.body.addEventListener('touchstart', (e) => {
        document.body.classList.add('touched');
        let data = {
            xAcc: accelerometerData.x,
            yAcc: accelerometerData.y,
            zAcc: accelerometerData.z,
            xGyro: gyroscopeData.x,
            yGyro: gyroscopeData.y,
            zGyro: gyroscopeData.z,
        }
        interval = setInterval(function() {
            socket.emit('motion data', data)
        }, 10);
    })
}

document.body.addEventListener('touchend', (e) => {
    document.body.classList.remove('touched');
    socket.emit('end motion data')
    clearInterval(interval);
});

function initSensors() {
    let gyroscope = new Gyroscope({frequency: 60});

    gyroscope.addEventListener('reading', e => {
        gyroscopeData.x = gyroscope.x;
        gyroscopeData.y = gyroscope.y;
        gyroscopeData.z = gyroscope.z;
    });
    gyroscope.start();

    let accelerometer = new Accelerometer({frequency: 60});

    accelerometer.addEventListener('reading', e => {
        accelerometerData.x = accelerometer.x;
        accelerometerData.y = accelerometer.y;
        accelerometerData.z = accelerometer.z;
    });
    accelerometer.start();
}