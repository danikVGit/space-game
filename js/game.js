'use strict';

/*
**  ОПИСАНИЕ СУЩЕСТВУЮЩИХ ЭЛЕМЕНТОВ
**  константы, функции и классы
*/

// CANVAS
// vw - ширина окна, vcx - центр по ширине окна;
// vh - высота окна, vcy - центр по высоте окна;
// ctx - контекст для отрисовки.

// ИЗОБРАЖЕНИЯ и ЗВУКОВЫЕ ЭФФЕКТЫ
// IMG['file_name.png'];
// SE['file_name.mp3'];

// УПРАВЛЕНИЕ
// KEY.space (true / false);
// CURSOR.isOnClick (true / false);
// CURSOR.x, CURSOR.y;

// КОНСТАНТЫ
// const _2PI = Math.PI * 2;
// const _RAD = Math.PI / 180;

// ФУНКЦИИ
// getExistsObjectsFromArr(objectsArray) (удаляем object, если: object.isExist = false)
// turnTo( object, target, turnSpeed )
// getDistance(object, target) -> возвращает расстояние в пикселях между object и target
// moveTo( object, target, speed )
// drawLightning(object, target, color=null)
// playSound( soundName )


// КЛАССЫ

// class Text(text = '', x = 0, y = 0, size = 12, color = '#00ff00')
// this.render(text);
// this.draw();

// class Sprite(imageName, x, y)
// this.draw()

// class SpriteSheet(imageName, x, y, fw, fh, frames, fps = 60)
// this.drawWithAnimation(dt) | this.draw()

// ИГРОВОЙ ЦИКЛ
// gameLoop( deltaTime )

/****************************/

// Движущееся фоновое изображение
class ScrollBackground {
    constructor (imageName, w, h, scrollSpeed) {
        this.img = IMG[imageName];
        this.x = Math.floor((vw -  w) / 2) ;
        this.y1 = -h;
        this.y2 = 0;
        this.h = h;
        this.scrollSpeed = scrollSpeed;
    }

    update(dt) {
        let speed = this.scrollSpeed * dt;
        this.y1 += speed;
        this.y2 += speed;
        if (this.y2 >= this.h) {
            this.y1 = -this.h;
            this.y2 = 0;
        }
        ctx.drawImage(this.img, this.x, this.y1);
        ctx.drawImage(this.img, this.x, this.y2);
    }
}

// Игровой курсор
class GameCursor extends SpriteSheet {
    constructor() {
        // class SpriteSheet(imageName, x, y, fw, fh, frames, fps = 60)
        super('player_cursor_48x48px_16frames.png', vcx, vcy, 48, 48, 16, 15);
    }

    update(dt) {
        this.x = CURSOR.x;
        this.y = CURSOR.y;
        this.drawWithAnimation(dt);
    }
}

// PLAYER
class Player extends SpriteSheet {
    constructor() {
        // class SpriteSheet (imageName, x, y, fw, fh, frames, fps = 60)
        super('player_74x100px_16frames.png', vcx, vcy * 1.5, 74, 100, 16, 30);

        this.speed = 0.1;
        this.size = 35;
        this.hp = 100;
        this.scores = 0;

        this.shutSpeed = 1200;
        this.nextShutTimeout = this.shutSpeed;
        this.bulletSpeed = 0.5;
        this.bulletsArr = [];

        this.rockets = 1;
        this.rocketSpeed = 0.2;
        this.rocketTurnSpeed = 0.005;
        this.rocketsArr = [];
    }

    update(dt) {
        // Движение к курсору со скоростью
        moveTo( this, CURSOR, this.speed * dt );

        // перезарядка
        this.nextShutTimeout -= dt;
        if (this.nextShutTimeout <= 0) {
            this.nextShutTimeout += this.shutSpeed;
            //                  class PlayerBullet(x, y, speed)
            let bullet = new PlayerBullet(this.x, this.y, this.bulletSpeed);
            this.bulletsArr.push( bullet );
        }

        // проверка запуска рокет
        if (this.rockets > 0) {
            if (CURSOR.isOnClick || KEY.space) {
                this.rockets--;
                this.rocketsArr.push( new PlayerRocket(this.x, this.y, this.rocketSpeed, this.rocketTurnSpeed) );
            }
        }

        // обновление пуль
        for (let i = 0; i < this.bulletsArr.length; i++) {
            this.bulletsArr[i].update(dt);
        }
        this.bulletsArr = getExistsObjectsFromArr(this.bulletsArr);

        // обновление рокет
        for (let i = 0; i < this.rocketsArr.length; i++) {
            this.rocketsArr[i].update(dt);
        }
        this.rocketsArr = getExistsObjectsFromArr(this.rocketsArr);
    
        this.drawWithAnimation(dt);
    }
    
    setDamage( damageSize ) {
        this.hp -= damageSize;
        if (this.hp < 1) {
            this.hp = 0;

            // переносим выше высоты экрана,
            // чтобы не  реагировать на столкновения
            // с астероидами и врагами
            this.y = -vh; 

            this.bulletsArr = []; 
            //                class Explosion(x, y)
            explosionsArr.push( new Explosion(this.x, this.y));
        }
        // обновляем текст о состоянии HP корабля игрока
        PLAYER_HP_TEXT.render(`HP: ${this.hp}%`);
    }

    setScores(scores) {
        player.scores += scores;
        PLAYER_SCORES_TEXT.render(`SCORES: ${player.scores}`);
    }
}

// PLAYER BULLETS
class PlayerBullet extends Sprite {
    constructor(x, y, speed) {
        // class Sprite (imageName, x, y)
        super('player_bullet_10x40px.png', x, y);
        this.speed = speed;
        this.isExist = true;

        playSound('se_laser_shut.mp3');
    }

    update(dt) {
        this.y -= this.speed * dt;
        if (this.y < -this.h) this.isExist = false;
        else this.draw();
    }
}

// PLAYER ROCKETS
class PlayerRocket extends Sprite {
    constructor(x, y, speed, turnSpeed) {
        // class Sprite (imageName, x, y)
        super('player_rocket_30x12px.png', x, y);
        this.speed = speed;
        this.turnSpeed = turnSpeed;
        this.isExist = true;

        playSound('se_rocket_launch.mp3');
    }

    update(dt) {
        if (enemiesArr.length === 0) {
            explosionsArr.push( new Explosion(this.x, this.y));
            this.isExist = false;
            player.rockets++;
            return;
        }

        let target = null;
        let targetDistance = Infinity;

        for (let i = 0; i < enemiesArr.length; i++) {
            let dist = getDistance(this, enemiesArr[i]);
            if (dist < targetDistance) {
                target = enemiesArr[i];
                targetDistance = dist;
            }
        }

        turnTo( this, target, this.turnSpeed * dt );
        moveTo( this, target, this.speed * dt );
        
        this.draw();
    }
}

// EXPLOSION
class Explosion extends SpriteSheet {
    constructor(x, y) {
        // class SpriteSheet (imageName, x, y, fw, fh, frames, fps = 60)
        super('explosion_200x200px_16frames.png', x, y, 200, 200, 16, 30);
        this.isExist = true;

        playSound( 'se_explosion.mp3' );
    }

    update(dt) {
        this.drawWithAnimation(dt);
        if (this.frame === this.frames - 1) this.isExist = false;
    }
}

// ASTEROID
class Asteroid extends SpriteSheet {
    constructor(x, y, speed) {
        // class SpriteSheet (imageName, x, y, fw, fh, frames, fps = 60)
        super('asteroid_90x108px_29frames.png', x, y, 90, 108, 29, 30);
        this.rotationSpeed = speed / 50;
        this.speed = speed;
        this.hp = 3;
        this.size = 45;
        this.damage = 25;
        this.isExist = true;
    }

    // ОБНОВЛЕНИЕ
    update(dt) {
        this.direction += this.rotationSpeed * dt;
        this.y += this.speed * dt;
        // проверка вылета за экран
        if (this.y - this.hh > vh) {
            this.isExist = false;
            return;
        }

        // проверка столкновений с пулями игрока
        for (let i = 0; i < player.bulletsArr.length; i++) {
            if (getDistance(this, player.bulletsArr[i]) < this.size) {
                player.bulletsArr[i].isExist = false;
                this.hp--;
                player.setScores(1);
                if (this.hp < 1) {
                    player.setScores(10);
                    this.destroyed();
                    return;
                }
            }
        }

        // проверка столкновения с игроком 
        if (getDistance(this, player) < this.size + player.size) {
            player.setDamage(this.damage);
            this.destroyed(false);
            return;
        }

        this.drawWithAnimation(dt)
    }

    // УНИЧТОЖЕНИЕ
    destroyed() {
        maxAsteroids += 0.2;
        //                class Explosion(x, y)
        explosionsArr.push( new Explosion(this.x, this.y));
        this.isExist = false;
    }
}

// ENEMY
class EasyEnemy extends Sprite {
    constructor(x, y) {
        super('enemy_52x78px.png', x, y);
        this.speed = 0.02 + Math.random() * 0.02; // 0.02 ... 0.04
        this.hp = 2;
        this.size = 24;
        this.damage = 12;
        this.isExist = true;

        this.shutSpeed = 1600 + Math.floor(Math.random() * 800);
        this.nextShutTimeout = this.shutSpeed;
        this.bulletSpeed = 0.2;
        this.bulletPower = 5;
    }

    // ОБНОВЛЕНИЕ
    update(dt) {
        this.y += this.speed * dt;
        // проверка вылета за экран
        if (this.y - this.hh > vh) {
            this.isExist = false;
            return;
        }

        // перезарядка
        this.nextShutTimeout -= dt;
        if (this.nextShutTimeout <= 0) {
            this.nextShutTimeout += this.shutSpeed;
            //                  class PlayerBullet(x, y, speed)
            let bullet = new EnemyBullet(this.x, this.y, this.bulletSpeed, this.bulletPower);
            enemyBulletsArr.push( bullet );
        }

        // проверка столкновений с пулями игрока
        for (let i = 0; i < player.bulletsArr.length; i++) {
            if (getDistance(this, player.bulletsArr[i]) < this.size) {
                player.bulletsArr[i].isExist = false;
                this.hp--;
                player.setScores(1);
                if (this.hp < 1) {
                    player.setScores(10);
                    this.destroyed();
                    // add BONUS
                    bonusesArr.push( new Bonus(this.x, this.y) );
                    return;
                }
            }
        }

         // проверка столкновений с рокетой игрока
         for (let i = 0; i < player.rocketsArr.length; i++) {
            if (getDistance(this, player.rocketsArr[i]) < this.size) {
                player.rocketsArr[i].isExist = false;
                player.rockets++;
                this.hp = 0;
                player.setScores(5);
                this.destroyed();
                return;
            }
        }

        // проверка столкновения с игроком 
        if (getDistance(this, player) < this.size + player.size) {
            player.setDamage(this.damage);
            this.destroyed(false);
            return;
        }

        this.draw();
    }

    // УНИЧТОЖЕНИЕ
    destroyed() {
        maxEnemies += 0.3;
        //                class Explosion(x, y)
        explosionsArr.push( new Explosion(this.x, this.y));
        this.isExist = false;
    }
}

class MediumEnemy extends Sprite {
    constructor(x, y) {
        super('enemy_100x130px.png', x, y);
        this.speed = 0.03 + Math.random() * 0.03; // 0.03 ... 0.06
        this.sideSpeed = this.speed / 2; // 0.015 ... 0.03
        this.hp = 4;
        this.size = 24;
        this.damage = 24;
        this.isExist = true;

        this.shutSpeed = 1200 + Math.floor(Math.random() * 400);
        this.nextShutTimeout = this.shutSpeed;
        this.bulletSpeed = 0.3;
        this.bulletPower = 5;
    }

    // ОБНОВЛЕНИЕ
    update(dt) {
        this.y += this.speed * dt;
        // проверка вылета за экран
        if (this.y - this.hh > vh) {
            this.isExist = false;
            return;
        }

        if (this.x > player.x) this.x -= this.sideSpeed * dt;
        if (this.x < player.x) this.x += this.sideSpeed * dt;

        // перезарядка
        this.nextShutTimeout -= dt;
        if (this.nextShutTimeout <= 0) {
            this.nextShutTimeout += this.shutSpeed;
            //                  class PlayerBullet(x, y, speed)
            let bullet1 = new EnemyBullet(this.x - 20, this.y, this.bulletSpeed, this.bulletPower);
            let bullet2 = new EnemyBullet(this.x + 20, this.y, this.bulletSpeed, this.bulletPower);
            enemyBulletsArr.push( bullet1 );
            enemyBulletsArr.push( bullet2 );
        }

        // проверка столкновений с пулями игрока
        for (let i = 0; i < player.bulletsArr.length; i++) {
            if (getDistance(this, player.bulletsArr[i]) < this.size) {
                player.bulletsArr[i].isExist = false;
                this.hp--;
                player.setScores(1);
                if (this.hp < 1) {
                    player.setScores(10);
                    this.destroyed();
                    // add BONUS
                    bonusesArr.push( new Bonus(this.x, this.y) );
                    return;
                }
            }
        }

         // проверка столкновений с рокетой игрока
         for (let i = 0; i < player.rocketsArr.length; i++) {
            if (getDistance(this, player.rocketsArr[i]) < this.size) {
                player.rocketsArr[i].isExist = false;
                player.rockets++;
                this.hp = 0;
                player.setScores(5);
                this.destroyed();
                return;
            }
        }

        // проверка столкновения с игроком 
        if (getDistance(this, player) < this.size + player.size) {
            player.setDamage(this.damage);
            this.destroyed(false);
            return;
        }

        this.draw();
    }

    // УНИЧТОЖЕНИЕ
    destroyed() {
        maxEnemies += 0.3;
        //                class Explosion(x, y)
        explosionsArr.push( new Explosion(this.x, this.y));
        this.isExist = false;
    }
}

class HardEnemy extends Sprite {
    constructor(x, y) {
        super('enemy_120x120px.png', x, y);
        this.speed = 0.01 + Math.random() * 0.01; // 0.01 ... 0.02
        this.turnSpeed = 0.001;
        this.hp = 5;
        this.size = 56;
        this.damage = 50;
        this.isExist = true;

        this.shutSpeed = 1500 + Math.floor(Math.random() * 500);
        this.nextShutTimeout = this.shutSpeed;
        this.shutDurationTume = 500;
        this.shutDurationTumeout = this.shutDurationTume;
        this.shutPower = 15;
    }

    // ОБНОВЛЕНИЕ
    update(dt) {
        this.direction += this.turnSpeed * dt;
        moveTo(this, player, this.speed * dt);
        // проверка столкновения с игроком 
        if (getDistance(this, player) < this.size + player.size) {
            player.setDamage(this.damage);
            this.destroyed(false);
            return;
        }

        // перезарядка
        this.nextShutTimeout -= dt;
        if (this.nextShutTimeout <= 0 && getDistance(this, player) < vcy) {
            if (this.shutDurationTume > 0) {
                this.shutDurationTume -= dt;
                drawLightning(this, player);
            } else {
                player.setDamage(this.shutPower);
                this.nextShutTimeout += this.shutSpeed;
                this.shutDurationTume += this.shutDurationTumeout;
            }
        }

        // проверка столкновений с пулями игрока
        for (let i = 0; i < player.bulletsArr.length; i++) {
            if (getDistance(this, player.bulletsArr[i]) < this.size) {
                player.bulletsArr[i].isExist = false;
                this.hp--;
                player.setScores(1);
                if (this.hp < 1) {
                    player.setScores(10);
                    this.destroyed();
                    // add BONUS
                    bonusesArr.push( new Bonus(this.x, this.y) );
                    return;
                }
            }
        }

         // проверка столкновений с рокетой игрока
         for (let i = 0; i < player.rocketsArr.length; i++) {
            if (getDistance(this, player.rocketsArr[i]) < this.size) {
                player.rocketsArr[i].isExist = false;
                player.rockets++;
                this.hp = 0;
                player.setScores(5);
                this.destroyed();
                return;
            }
        }

        this.draw();
    }

    // УНИЧТОЖЕНИЕ
    destroyed() {
        maxEnemies += 0.3;
        //                class Explosion(x, y)
        explosionsArr.push( new Explosion(this.x, this.y));
        this.isExist = false;
    }
}

// ENEMY BULLETS
class EnemyBullet extends Sprite {
    constructor(x, y, speed, damage) {
        // class Sprite (imageName, x, y)
        super('enemy_bullet_10x40px.png', x, y);
        this.speed = speed;
        this.isExist = true;
        this.damage = damage;
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y - this.hh > vh) this.isExist = false;
        else this.draw();

        // проверка столкновения с игроком 
        if (getDistance(this, player) < player.size) {
            player.setDamage(this.damage);
            this.isExist = false;
            
            playSound('se_explosion.mp3');
        }
    }
}

// BONUS
class Bonus extends Sprite {
    constructor(x, y) {
        // class Sprite (imageName, x, y)
        super('bonus_empty_48x48px.png', x, y);
        this.speed = 0.03;
        this.type = this.getType();
        this.isExist = true;
    }

    getType() {
        let type = '';
        let nType = Math.ceil(Math.random() * 4);
        switch(nType) {
            case 1 : type = 'bullets'; break;
            case 2 : type = 'rockets'; break;
            case 3 : type = 'speed'; break;
            case 4 : type = 'repair'; break;

            default : type = 'repair';
        }
        this.img = IMG['bonus_'+ type +'_48x48px.png'];
        return type;
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y - this.hh > vh) this.isExist = false;
        else this.draw();

        // проверка столкновения с игроком 
        if (getDistance(this, player) < player.size) {
            switch(this.type) {
                case 'bullets' : player.nextShutTimeout *= 0.8; break;
                case 'rockets' : player.rockets++; break;
                case 'speed' : player.speed *= 1.2 ; break;
                case 'repair' : player.setDamage(-20); break;

                default : /* 'repair' */ player.setDamage(-20);
            }

            player.setScores(25);
            this.isExist = false;
            
            playSound('se_bonus.mp3');
        }
    }
}

let bonusesArr = [];

let maxEnemies = 5;
let enemiesArr = [];
// функция добавления нового воага
function addEnemy() {

    let enemyType = Math.floor(maxEnemies * Math.random());
    let xx, yy;
    switch( enemyType ) {
        case 0 : 
        case 1 : 
            xx = 25 + Math.floor(Math.random() * (vw - 50));
            yy = -100 - Math.floor(Math.random() * vcy);
            enemiesArr.push( new EasyEnemy(xx, yy) );
            break;
        case 2 : 
            xx = 25 + Math.floor(Math.random() * (vw - 50));
            yy = -150 - Math.floor(Math.random() * vcy);
            enemiesArr.push( new MediumEnemy(xx, yy) );
            break;
        case 3 : 
            xx = 60 + Math.floor(Math.random() * (vw - 120));
            yy = -120 - Math.floor(Math.random() * vcy);
            enemiesArr.push( new HardEnemy(xx, yy) );
            break;
        default : 
            xx = 60 + Math.floor(Math.random() * (vw - 120));
            yy = -120 - Math.floor(Math.random() * vcy);
            enemiesArr.push( new HardEnemy(xx, yy) );
    }
}
let enemyBulletsArr = [];


////

let maxAsteroids = 3;
let asteroidsArr = [];

// функция добавления нового астероида
function addAsteroids() {
    let xx = 50 + Math.floor(Math.random() * (vw - 100));
    let yy = -50 - Math.floor(Math.random() * vcy);
    let speed = +((Math.ceil(Math.random() * 3)) / 20).toFixed(2);
    //               class Asteroid(x, y, speed)
    asteroidsArr.push( new Asteroid(xx, yy, speed) );
}


let explosionsArr = [];

const player = new Player();

// ФОНЫ
//               class ScrollBackground(imageName, w, h, scrollSpeed)
const background = new ScrollBackground('scrolling_bg_2000x3400px.png', 2000, 3400, 0.01);

// ИГРОВОЙ КУРСОР
//               class GameCursor()
const gameCursor = new GameCursor();

const PLAYER_HP_TEXT = new Text('HP: 100%', 5, 5, 16, '#ffffff');
const PLAYER_SCORES_TEXT = new Text('SCORES: 0', vw - 120, 5, 16, '#ffffff');
const GAME_OVER_TEXT = new Text('GAME OVER', vcx, vcy - 250, 70, '#ff0000');


// ИГРОВОЙ ЦИКЛ
function gameLoop(dt) {
    // обновляем основной фон и дополнительные фоны
    background.update(dt);

    // обновляем курсор
    gameCursor.update(dt);

    // обновляем астеройды
    for (let i = 0; i < asteroidsArr.length; i++) asteroidsArr[i].update(dt);
    asteroidsArr = getExistsObjectsFromArr(asteroidsArr);
    if (asteroidsArr.length < maxAsteroids) addAsteroids();

    // обновляем пули врагов
    for (let i = 0; i < enemyBulletsArr.length; i++) enemyBulletsArr[i].update(dt);
    enemyBulletsArr = getExistsObjectsFromArr(enemyBulletsArr);

    // обновляем врагов
    for (let i = 0; i < enemiesArr.length; i++) enemiesArr[i].update(dt);
    enemiesArr = getExistsObjectsFromArr(enemiesArr);
    if (enemiesArr.length < maxEnemies) addEnemy();

    // обновляем игрока (если HP <= 0 - пишем GAME OVER)
    if (player.hp > 0) player.update(dt);
    else GAME_OVER_TEXT.draw();

    // обновление бонусов
    for (let i = 0; i < bonusesArr.length; i++) bonusesArr[i].update(dt);
    bonusesArr = getExistsObjectsFromArr(bonusesArr);

    // обновляем взрывы
    for (let i = 0; i < explosionsArr.length; i++) explosionsArr[i].update(dt);
    explosionsArr = getExistsObjectsFromArr(explosionsArr);

    // обновляем игровые надписи
    PLAYER_HP_TEXT.draw();
    PLAYER_SCORES_TEXT.draw();
}