'use strict';

/*
**  НАЧЛЬНЫЕ ИГРОВЫЕ УСТАНОВКИ
*/

// Скрываем курсор мыши
document.body.style.cursor = 'none';

// Константы для работы с радианами
const _2PI = Math.PI * 2;
const _RAD = Math.PI / 180;

/*
**  ИГРОВЫЕ ФУНКЦИИ
*/

// Очистка массива от неиспользуемых игровых объектов
// (у объектов массива arr[i] должно быть поле: arr[i].isExist)
// (Удаляем arr[i], если: arr[i].isExist === false)
function getExistsObjectsFromArr(arr) {
    const filteredArr = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].isExist) filteredArr.push(arr[i]);
    }
    return filteredArr;
}

// функция поворота объекта object к объекту target, со скоростью turnSpeed
// (у объекта object должны быть поля: object.x; object.y; object.direction)
// (у объекта target должны быть поля: target.x; target.y; object.direction)
function turnTo( object, target, turnSpeed ) {
    let pointDirection = Math.atan2(target.y - object.y, target.x - object.x);
    let angle = (pointDirection - object.direction) % _2PI;

    if (angle < -Math.PI) angle += _2PI;
    if (angle >  Math.PI) angle -= _2PI;

    if (angle >= 0 &&  angle > turnSpeed) object.direction += turnSpeed;
    if (angle <  0 && -angle > turnSpeed) object.direction -= turnSpeed;
}

// функция определения расстояния в пикселях между объектами object и target
// (у объекта object должны быть поля: object.x; object.y)
// (у объекта target должны быть поля: target.x; target.y)
function getDistance(object, target) {
    let dx = target.x - object.x;
    let dy = target.y - object.y;
    return Math.sqrt( dx**2 + dy**2 );
}

// функция перемещения объека object к объекту target со скоростью speed
// (у объекта object должны быть поля: object.x; object.y)
// (у объекта target должны быть поля: target.x; target.y)
function moveTo( object, target, speed ) {
    if (object.x !== target.x || object.y !== target.y) {
        let distance = getDistance(object, target)
        
        if (distance <= speed) {
            object.x = target.x;
            object.y = target.y;
        } else {
            let moveRate = speed / distance;
            object.x += moveRate * (target.x - object.x);
            object.y += moveRate * (target.y - object.y);
        }
    }
}

// ЭЛЕКТРИЧЕСКИЙ РАЗРЯД
// (у объекта object должны быть поля: object.x; object.y)
// (у объекта target должны быть поля: target.x; target.y)
// (color - цвет линии и света от электрического разряда)
function drawLightning(object, target, color=null) {
    const colorsArr = ["#ffe0ff", "#e0ffff", "#ffffe0"];
    const lineColor = color ? color : colorsArr[Math.floor(Math.random() * colorsArr.length)];

    let distance = getDistance(object, target);
    let stepsCount = Math.ceil((distance / 4) + Math.random() * (distance / 8));
    let offsetRate = 6;

    const detDistance4Points = (x1, y1, x2, y2) => {
        let dy = x1 - x2, dx = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    let xx = object.x
    let yy = object.y

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = lineColor;
    ctx.shadowBlur  = 6;
    ctx.shadowColor = lineColor;
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.moveTo(xx, yy);
    for (let i = stepsCount; i > 1; i--) {
        let pathLength = detDistance4Points(xx, yy, target.x, target.y);
        let offset = Math.sin(pathLength / distance * Math.PI) * offsetRate;
        xx += (target.x - xx) / i + Math.random() * offset * 2 - offset;
        yy += (target.y - yy) / i + Math.random() * offset * 2 - offset;
        ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ctx.restore();
}

/*
**  ИГРОВЫЕ КЛАССЫ
*/

// класс создания текстовых объектов
// (x и y - координаты верхнего левого угла отображаемого текста)
class Text {
    constructor(text = '', x = 0, y = 0, size = 12, color = '#00ff00') {
        this.y = y;
        this.x = x;
        this.size = size;
        this.color = color;

        this.img = document.createElement('canvas');
        this.ctx = this.img.getContext('2d');
        this.img.width = this.getTextWidth(text);
        this.img.height = size;

        this.render(text);
    }

    // определение ширины текста
    getTextWidth(text) {
        this.ctx.font = `${this.size}px PTSans, Arial, sans-serif`;
        return this.ctx.measureText(text).width;
    }

    // преобразования текста в изображение, для оптимизации производительности
    render(text) {
        this.ctx.clearRect(0, 0, this.img.width, this.img.height);
        this.img.width =  this.getTextWidth(text);
        this.ctx.font = `${this.size}px PTSans, Arial, sans-serif`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = this.color
        this.ctx.fillText(text, 0, 0);
    }

    // отрисовка изображения с текстом
    draw() {
        ctx.drawImage( this.img, this.x,  this.y);
    }
}

// класс создания объектов со статичными изображениями
// (x и y - координаты центра отображаемого изображения)
class Sprite {
    constructor(imageName, x, y) {
        this.img = IMG[imageName];
        this.x = x;
        this.y = y;
        this.w = this.img.width;
        this.h = this.img.height;
        this.hw = Math.floor(this.w / 2);
        this.hh = Math.floor(this.h / 2);

        this.direction = 0;
    }

    // отрисовка изображения
    draw() {
        if (this.direction === 0) ctx.drawImage( this.img, this.x - this.hw,  this.y - this.hh);
        else {
            ctx.setTransform(1, 0, 0, 1, this.x, this.y);
            ctx.rotate(this.direction);
            ctx.drawImage(this.img, -this.hw, -this.hh);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
}

// класс создания объектов с изображениями покадровой анимации
// (x и y - координаты центра отображаемого изображения)
// (fw и fh - ширина и высота одного кадра)
// (frames - число кадров анимации, содержащихся в изображении)
// (fps - скорость обновления кадров за одну секунду)
class SpriteSheet {
    constructor(imageName, x, y, fw, fh, frames, fps = 60) {
        this.img = IMG[imageName];
        this.x = x;
        this.y = y;
        this.w = fw;
        this.h = fh;
        this.hw = Math.floor(this.w / 2);
        this.hh = Math.floor(this.h / 2);
        
        this.framesArr = this.getFramesArr(fw, fh, frames);
        this.frame = 0
        this.frames = frames;
        this.nextFrame = Math.floor(1000 / fps);
        this.nextFrameTimeout = this.nextFrame;

        this.direction = 0;
    }

    // получение массива координат кадров изображения
    getFramesArr(fw, fh, frames) {
        const framesArr = [];
        for( let yy = 0; yy < this.img.height; yy += fh) {
            for( let xx = 0; xx < this.img.width; xx += fw) {
                framesArr.push( {x: xx, y: yy} );
            }
        }
        framesArr.length = frames;
        return framesArr;
    }

    // отрисовка кадра с учетом скорости анимации
    drawWithAnimation(dt) {
        this.nextFrameTimeout -= dt
        if (this.nextFrameTimeout < 0) {
            this.nextFrameTimeout += this.nextFrame;
            this.frame++;
            if (this.frame === this.frames) this.frame = 0;
        }

        if (this.direction === 0) this.draw();
        else {
            ctx.setTransform(1, 0, 0, 1, this.x, this.y);
            ctx.rotate(this.direction);
            this.draw(-this.hw, -this.hh);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    // отрисовка текущего кадра
    draw(pointX = this.x - this.hw, pointY = this.y - this.hh) {
        ctx.drawImage(
            this.img,
            this.framesArr[this.frame].x, this.framesArr[this.frame].y, 
            this.w, this.h,
            pointX, pointY,
            this.w, this.h
        );
    }
}

/*
**  СОЗДАЁМ <CANVAS>
*/
let vw, vh, vcx, vcy;
const canvas = document.createElement('canvas');
canvas.width = vw = innerWidth;
canvas.height = vh = innerHeight;
vcx = Math.floor(vw / 2);
vcy = Math.floor(vh / 2);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, vw, vh);
document.body.prepend(canvas);

/*
**  ФОНОВАЯ МУЗЫКА
**  звуковые эффекты
*/
// создаем объект плеера
const BG_MUSIC = new Audio();

// список фоновых музык
const bgMusicsArr = [
    'bgm_space_1.mp3',
    'bgm_space_2.mp3',
    'bgm_space_3.mp3',
];

// индекс фоновой музыки для воспроизведения
let bgMusicIndex = 0;

// плеер фоновой музыки
function playBgMusic() {
    BG_MUSIC.src = SOUNDS_PATH + bgMusicsArr[bgMusicIndex];
    BG_MUSIC.play();
    bgMusicIndex++;
    if (bgMusicIndex === bgMusicsArr.length) bgMusicIndex = 0;
    BG_MUSIC.addEventListener('ended', playBgMusic);
}

// запускаем плеер
playBgMusic();

// плеер звуковых эффектов
function playSound( soundName ) {
    SE[soundName].currentTime = 0;
    SE[soundName].play();
}

/*
**  УПРАВЛЕНИЕ
**  клавиатура и мышь
*/

// Объект состояния курсора
const CURSOR = {
    isOnClick : false,
    x : vcx,
    y : vcy
};

// отслеживание перемещения курсора
document.onmousemove = (event) => {
    CURSOR.x = event.pageX;
    CURSOR.y = event.pageY;
};

// отслеживание клика курсора
document.onclick = () => CURSOR.isOnClick = true;

// объект состояний клавишь клавиатуры
// (true - клавиша нажата; false - отпущена)
const KEY = {
    space : false,
};

// отслеживания нажатия клавиш
document.addEventListener('keydown', (event) => {
    switch(event.code) {
        case 'Space' : KEY.space = true; break;
    }
});

// отслеживания отпускания клавиш
document.addEventListener('keyup', (event) => {
    switch(event.code) {
        case 'Space' : KEY.space = false; break;
    }
    // можно просмотреть event.code для кнопок
    // и при необходимости выше дописать их обработку
    console.log('key code :', event.code);
});

/*
**  АНИМАЦИЯ
*/

// Активно ли игровое окно (вкладка браузера)
let isOnFocus = true; 

// Временная метка запуска игрового цикла
let previousTimeStamp;

// Если окно не активно - остановить анимацию
window.onblur = stopAnimation;
// Если окно активно - запустить анимацию
window.onfocus = startAnimation;

// функция запуска анимации
function startAnimation() {
    console.log('start animation');
    isOnFocus = true;
    BG_MUSIC.play();
    previousTimeStamp = performance.now();
    timeStempFPS = previousTimeStamp;
    requestAnimationFrame ( animation );
}

// функция остановки анимации
function stopAnimation() {
    console.log('stop animation');
    isOnFocus = false;
    BG_MUSIC.pause();
}

// расчет FPS (количество обнавлений экрана в секунду)
//             class Text(text = '', x = 0, y = 0, size = 12, color = '#00ff00')
const FPS_TEXT = new Text('FPS: 0', vw - 60, vh - 16, 12, '#00ff00');
let tickFPS = 0; // счетчик кадров, хранит номер текущего кадра
let timeStempFPS = performance.now(); // время начала отсчета кадров

// функция обновления счетчика FPS
function updateFPS(timeStamp) {
    tickFPS++;
    let deltaTime = timeStamp - timeStempFPS;
    if(deltaTime >= 1000) {
        FPS_TEXT.render(`FPS: ${( (tickFPS / deltaTime) * 1000 ).toFixed(2)}`);
        tickFPS = 0;
        timeStempFPS = timeStamp;
    }
    FPS_TEXT.draw();
}

// функция анимации
// (принимает количество миллисекунд с момента запуска программы)
function animation(timeStamp) {
    // расчет интервала между обновлениями экрана
    const dt = timeStamp - previousTimeStamp;
    previousTimeStamp = timeStamp;

    // очистка <canvas>
    ctx.clearRect(0, 0, vw, vh);

    // вызов функции игрового цикла из файла game.js
    // (dt - время интервала между обновлениями экрана)
    gameLoop(dt);

    // отмена клика курсора, для избежания эффекта залипания клика
    CURSOR.isOnClick = false;

    // обновление FPS
    updateFPS(timeStamp)

    // повторный запуск анимации, если акно активно
    if (isOnFocus) requestAnimationFrame( animation );
}

// загрузка файла game.js
const GAME_SCRIPT = document.createElement('script');
GAME_SCRIPT.src = './js/game.js';
document.body.append(GAME_SCRIPT);
GAME_SCRIPT.onload = startAnimation;