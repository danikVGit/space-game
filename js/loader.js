'use strict';

/*
**  ПРЕДЗАГРУЗКА ИГРОВЫХ РЕСУРСОВ
*/

// объект для хранения загруженных изображенийи
const IMG = {/* game images */};
// переменная пути к изображениям
const IMAGES_PATH = './src/images/';

// объект для хранения загруженных звуков
const SE = {/* sound effects */};
// переменная пути к звукам
const SOUNDS_PATH = './src/sounds/';

// список загружаемых изображений
const IMAGES_UPLOAD_ARR = [
    'scrolling_bg_2000x3400px.png',
    'player_cursor_48x48px_16frames.png',
    'player_74x100px_16frames.png',
    'player_bullet_10x40px.png',
    'asteroid_90x108px_29frames.png',
    'explosion_200x200px_16frames.png',
    'enemy_52x78px.png',
    'enemy_bullet_10x40px.png',
    'player_rocket_30x12px.png',
    'enemy_100x130px.png',
    'enemy_120x120px.png',

    'bonus_empty_48x48px.png',
    'bonus_bullets_48x48px.png',
    'bonus_rockets_48x48px.png',
    'bonus_repair_48x48px.png',
    'bonus_speed_48x48px.png',
];

// список загружаемых звуков
const SOUNDS_UPLOAD_ARR = [
    'se_laser_shut.mp3',
    'se_explosion.mp3',
    'se_rocket_launch.mp3',
    'se_bonus.mp3'
];

// счетчик количества загруженных игровых ресурсов
let uploadSize = SOUNDS_UPLOAD_ARR.length + IMAGES_UPLOAD_ARR.length;
let uploadStep = 0;

// отображения состояния загрузки игровых ресурсов
const LOADING_STATUS_DIV = document.createElement('div');
LOADING_STATUS_DIV.id = 'loadingStatusDiv';
LOADING_STATUS_DIV.innerHTML = 'Loaded files: ' + uploadStep + '/' + uploadSize;
document.body.append(LOADING_STATUS_DIV);

// загрузка игровых ресурсов
IMAGES_UPLOAD_ARR.forEach( data => uploadImage(data) );
SOUNDS_UPLOAD_ARR.forEach( data => uploadSound(data) );

// функция загрузки изображений
function uploadImage(image_name) {
    IMG[image_name] = new Image();
    IMG[image_name].src = IMAGES_PATH + image_name;
    IMG[image_name].onload = () => updateLoadingProgress();
}

// функция загрузки звуков
function uploadSound(sound_name) {
    SE[sound_name] = new Audio();
    SE[sound_name].src = SOUNDS_PATH + sound_name;
    SE[sound_name].oncanplaythrough = (event) => {
        event.target.oncanplaythrough = null; /* don't play */
        updateLoadingProgress();
    };
}

// функция обновления отображаемого состояния загрузки игровых ресурсов
function updateLoadingProgress() {
    uploadStep++;
    LOADING_STATUS_DIV.innerHTML = 'Загружено: ' + uploadStep + '/' + uploadSize;
    if (uploadStep === uploadSize) loadingDone();
}

// функция окончания загрузки всех игровых ресурсов
function loadingDone() {
    LOADING_STATUS_DIV.remove();
    const START_BUTTON = document.createElement('button');
    START_BUTTON.id = 'startButton';
    START_BUTTON.innerHTML = 'START';
    START_BUTTON.onclick = function() {
        START_BUTTON.remove();
        const INIT_SCRIPT = document.createElement('script');
        INIT_SCRIPT.src = './js/init.js';
        document.body.append(INIT_SCRIPT);
    };
    document.body.append(START_BUTTON);
}