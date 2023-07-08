import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';


// Состояние сцены
const state = {
    mouse_x: 0,             // текущая позиция мыши по X
    mouse_shift_x: 0,       // сдвиг по X при зажатой кнопке
    mouse_pressed: false,   // флаг: нажата ли кнопка мыши

    speed_max: 10,          // максимальная скорость вращения
    speed_default: -0.4,     // стандартная скорость вращения (+ вправо; - влево)
    speed_current: 0.4,     // текущая скорость вращения
    speed_correction: 0.05, // значение изменения скорости к стандартной в кадр

    multiple: 8,            // множитель сдвига камеры от центра
};


// Параметры сцены
const settings = {
    render: {
        alpha: true,        // включаем обработку прозрачности
        antialias: true,    // включаем сглаживание
    },

    camera: {
        fov: 32,            // угол поля зрения
        distance_min: 1,    // мин дистанция рендера
        distance_max: 12,   // макс дистанция рендера
        position_x: 0,      // позиция от центра мира вбок
        position_y: 1.5,    // позиция от центра мира вверх
        position_z: 1,      // позиция от центра мира назад
        aspect: 1,          // соотношение сторон кадра
    },

    light: {
        ambient: {
            color: 0xcccccc,
            intensity: 0.4,
        },

        directional: {
            color: 0xdddddd,
            intensity: 0.8,
        },

        point: {
            color: 0xffffff,
            intensity: 0.4,   // интенсивность
            distance: 6,
            position_x: 0,    // позиция от центра мира вбок
            position_y: 0,    // позиция от центра мира вверх
            position_z: 2,    // позиция от центра мира назад
        },
    },
};


let colorCurrentRGB = [ 0, 200, 0 ];
let colorTargetRGB  = [ 0, 200, 0 ];

/**
 * Изменение цвета
 */
function generateColor() {

    // Величина сдвига значения за итерацию (скорость смены цвета)
    const shiftSize = 1;

    // Отступы от границ диапазона снизу,
    // чтобы избавиться от слишком темных цветов
    const offsetBottom = 50;

    // Отступы от границ диапазона сверху,
    // чтобы избавиться от слишком светлых цветов
    const offsetTop = 25;

    // Изменение одной составляющей цвета
    const update = (i) => {
        if (colorCurrentRGB[i] === colorTargetRGB[i]) {
            // генерируем новый цвет
            colorTargetRGB[i] = Math.floor(Math.random() * (255 - offsetBottom - offsetTop)) + offsetBottom;
        } else if (colorCurrentRGB[i] > colorTargetRGB[i]) {
            // двигаем к новому цвету
            // num2[i] -= count;
            colorCurrentRGB[i] = colorCurrentRGB[i] - shiftSize >= colorTargetRGB[i] ? colorCurrentRGB[i] - shiftSize : colorTargetRGB[i];
        } else {
            // двигаем к новому цвету
            // num2[i] += count;
            colorCurrentRGB[i] = colorCurrentRGB[i] + shiftSize <= colorTargetRGB[i] ? colorCurrentRGB[i] + shiftSize : colorTargetRGB[i];
        }
    };

    // Меняем все 3 составляющие цвета
    for (let i = 0; i < 3; i++) {
        update(i);
    }

    const colorHexR = Number(colorCurrentRGB[0]).toString(16).padStart(2, 0);
    const colorHexG = Number(colorCurrentRGB[1]).toString(16).padStart(2, 0);
    const colorHexB = Number(colorCurrentRGB[2]).toString(16).padStart(2, 0);

    return parseInt(colorHexR + colorHexG + colorHexB, 16); // to int

}


/**
 * Перевод градусов в радианы
 */
function rad(degree) {
    return ((degree) / 360) * 2 * Math.PI;
}


/**
 * Инициализация DIV контейнера со сценой
 */
function initContainer() {

    // Находим нужный DIV контейнер на странице
    const sceneContainer = document.querySelector( '#model3dcube' );

    // Добавляем контейнер со сценой в DIV контейнер
    const renderer = new THREE.WebGLRenderer( settings.render );
    sceneContainer.appendChild( renderer.domElement );

    // Устанавливаем начальные параметры контейнера со сценой
    renderer.setSize( sceneContainer.clientWidth, sceneContainer.clientHeight );
    renderer.setPixelRatio( window.devicePixelRatio );

    // СОБЫТИЯ ДЛЯ ПК

    // Добавляем слушатель на движение мыши
    document.addEventListener( 'mousemove', (event) => {
        if (state.mouse_pressed) {
            state.mouse_shift_x = event.clientX - state.mouse_x;
            state.mouse_x = event.clientX;
        }
    });

    // Добавляем слушатель на нажатие мыши
    sceneContainer.addEventListener( 'mousedown', (event) => {
        state.mouse_x = event.clientX;
        state.mouse_pressed = true;
    });

    // Добавляем слушатель на отпускание мыши
    document.addEventListener( 'mouseup', () => {
        state.mouse_shift_x = 0;
        state.mouse_pressed = false;
    });

    // СОБЫТИЯ ДЛЯ ТАЧ-УСТРОЙСТВ

    // Добавляем слушатель на движение
    document.addEventListener( 'touchmove', (event) => {
        if (state.mouse_pressed) {
            const clientX = event.changedTouches[0]?.clientX || 0;
            state.mouse_shift_x = clientX - state.mouse_x;
            state.mouse_x = event.changedTouches[0].clientX;
        }
    });

    // Добавляем слушатель на нажатие
    sceneContainer.addEventListener( 'touchstart', (event) => {
        const clientX = event.changedTouches[0]?.clientX || 0;
        state.mouse_x = clientX;
        state.mouse_pressed = true;
    });

    // Добавляем слушатель на отпускание
    document.addEventListener( 'touchend', () => {
        state.mouse_shift_x = 0;
        state.mouse_pressed = false;
    });

    // Добавляем слушатель на изменение размеров окна
    window.addEventListener( 'resize', () => {
        settings.camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
        renderer.setSize( sceneContainer.clientWidth, sceneContainer.clientHeight );
    });

    settings.camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;

    return renderer;

}


/**
 * Инициализация сцены
 */
function initScene() {

    const scene = new THREE.Scene();

    const lightAmbient = new THREE.AmbientLight( settings.light.ambient.color, settings.light.ambient.intensity );
    scene.add( lightAmbient );

    const lightDirectional = new THREE.DirectionalLight( settings.light.directional.color, settings.light.directional.intensity );
    scene.add( lightDirectional );

    const lightPoint = new THREE.PointLight( settings.light.point.color, settings.light.point.intensity, settings.light.point.distance );
    lightPoint.position.set( settings.light.point.position_x, settings.light.point.position_y, settings.light.point.position_z );
    scene.add( lightPoint );

    return scene;

}


/**
 * Инициализация центрального цветного куба
 */
function initCubeObject() {

    const cubeSize = 1.95;
    const cubeGeometry = new THREE.BoxGeometry( cubeSize, cubeSize, cubeSize );
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });

    const cube = new THREE.Mesh( cubeGeometry, cubeMaterial );

    return {
        object: cube,
        geometry: cubeGeometry,
        material: cubeMaterial,
    };

}


/**
 * Инициализация камеры
 */
function initCamera() {

    const camera = new THREE.PerspectiveCamera(
        settings.camera.fov,
        settings.camera.aspect,
        settings.camera.distance_min,
        settings.camera.distance_max
    );

    camera.position.x = settings.camera.position_x;
    camera.position.y = settings.camera.position_y;
    camera.position.z = settings.camera.position_z * state.multiple;

    // Добавляем слушатель на изменение размеров окна
    window.addEventListener( 'resize', () => {
        camera.aspect = settings.camera.aspect;
        camera.updateProjectionMatrix();
    });

    return camera;

}


/**
 * Инициализация 3D модели IT-CUBE
 */
async function initCube3DModel() {

    let cubeModel = {
        object: null,
    };

    return new Promise((resolve) => {

        // Загружаем файлы 3D модели

        const manager = new THREE.LoadingManager(() => resolve( cubeModel ));

        function onProgress( xhr ) {
            if ( xhr.lengthComputable ) {
                const percentComplete = xhr.loaded / xhr.total * 100;
                console.log( 'model ' + Math.round( percentComplete, 2 ) + '% downloaded' );
            }
        }

        function onError() {}

        const loaderMtl = new MTLLoader( manager ); // Материал
        const loaderObj = new OBJLoader( manager ); // Геометрия

        loaderMtl.load('./data/cube-mesh.mtl', function ( material ) {
                loaderObj.setMaterials( material );
        }, onProgress);

        loaderObj.load('./data/cube-mesh.obj', function ( object ) {
            cubeModel.object = object;
        }, onProgress);

    });

}


/**
 * Инициализация 3D модели компьютера
 */
async function initComp3DModel() {

    let compModel = {
        object: null,
    };

    return new Promise((resolve) => {

        // Загружаем файлы 3D модели

        const manager = new THREE.LoadingManager(() => resolve( compModel ));

        function onProgress( xhr ) {
            if ( xhr.lengthComputable ) {
                const percentComplete = xhr.loaded / xhr.total * 100;
                console.log( 'model ' + Math.round( percentComplete, 2 ) + '% downloaded' );
            }
        }

        function onError() {}

        const loaderMtl = new MTLLoader( manager ); // Материал
        const loaderObj = new OBJLoader( manager ); // Геометрия

        loaderMtl.load('./data/comp-mesh.mtl', function ( material ) {
                loaderObj.setMaterials( material );
        }, onProgress);

        loaderObj.load('./data/comp-mesh.obj', function ( object ) {
            compModel.object = object;
        }, onProgress);

    });

}


/**
 * Получить массив объектов компьютеров
 */
function generateCompModelArray(model) {

    // компьютер 1 сверху
    const comp3DObject1 = model.object.clone();
    comp3DObject1.rotation.set( 0, rad(90), 0 );
    comp3DObject1.scale.set( 0.15, 0.15, 0.15 );
    comp3DObject1.position.set( 0, 1.6, 0 );

    // компьютер 2 снизу
    const comp3DObject2 = model.object.clone();
    comp3DObject2.rotation.set( 0, rad(90), 0 );
    comp3DObject2.scale.set( 0.15, 0.15, 0.15 );
    comp3DObject2.position.set( 0, -2, 0 );

    // компьютер 3 спереди
    const comp3DObject3 = model.object.clone();
    comp3DObject3.rotation.set( 0, rad(90), 0 );
    comp3DObject3.scale.set( 0.15, 0.15, 0.15 );
    comp3DObject3.position.set( 0, 0.45, 1.72 );

    // компьютер 4 сзади
    const comp3DObject4 = model.object.clone();
    comp3DObject4.rotation.set( 0, rad(90), 0 );
    comp3DObject4.scale.set( 0.15, 0.15, 0.15 );
    comp3DObject4.position.set( 0, -0.7, -1.72 );

    // компьютер 5 сзади справа
    const comp3DObject5 = model.object.clone();
    comp3DObject5.rotation.set( 0, rad(90), 0 );
    comp3DObject5.scale.set( 0.15, 0.15, 0.15 );
    comp3DObject5.position.set( 1.45, 0.4, -0.9 );

    // компьютер 6 сзади слева
    const comp3DObject6 = model.object.clone();
    comp3DObject6.rotation.set( 0, rad(90), 0 );
    comp3DObject6.scale.set( 0.15, 0.15, 0.15 );
    comp3DObject6.position.set( -1.45, 0.4, -0.9 );

    // компьютер 7 спереди справа
    const comp3DObject7 = model.object.clone();
    comp3DObject7.rotation.set( 0, rad(90), 0 );
    comp3DObject7.scale.set( 0.15, 0.15, 0.15 );
    comp3DObject7.position.set( 1.45, -0.7, 0.9 );

    // компьютер 8 спереди слева
    const comp3DObject8 = model.object.clone();
    comp3DObject8.rotation.set( 0, rad(90), 0 );
    comp3DObject8.scale.set( 0.15, 0.15, 0.15 );
    comp3DObject8.position.set( -1.45, -0.7, 0.9 );

    return [
        comp3DObject1, comp3DObject2,
        comp3DObject3, comp3DObject4,
        comp3DObject5, comp3DObject6,
        comp3DObject7, comp3DObject8,
    ];

}


/**
 * Перемещение объекта вокруг мировых осей
 */
function rotateAroundWorldAxis(object, axis, radians) {
    var rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis( axis.normalize(), radians );

    var currentPos = new THREE.Vector4( object.position.x, object.position.y, object.position.z, 1 );
    var newPos = currentPos.applyMatrix4( rotWorldMatrix );

    // rotWorldMatrix.multiply( object.matrix );
    // object.matrix = rotWorldMatrix;
    // object.rotation.setFromRotationMatrix( object.matrix );

    object.position.x = newPos.x;
    object.position.y = newPos.y;
    object.position.z = newPos.z;
};


/**
 * Обработка состояния сцены
 */
function processedState( cubeColored, cube3DModel, compModelArray) {

    /** Рассчитать текущую скорость вращения */
    const calcSpeed = () => {
        const direction = Math.sign( state.speed_current );
        let speed = Math.abs( state.speed_current );

        // Ограничиваем максимальную скорость
        if (speed > state.speed_max) speed = state.speed_max;

        // Ограничиваем точность 2мя знаками после запятой
        speed = Number((speed * direction).toFixed(2));

        // Корректируем скорость к обычной при необходимости
        if (speed > state.speed_default)      speed -= state.speed_correction;
        else if (speed < state.speed_default) speed += state.speed_correction;

        return speed;
    }

    if (!state.mouse_pressed) {
        state.speed_current = calcSpeed();
    } else {
        state.speed_current = state.mouse_shift_x;
        state.mouse_shift_x = 0;
    }

    // Получаем угол на который необходимо повернуть объект в радианах
    const rotationAngle = rad(state.speed_current);

    // Поворачиваем кубы
    cubeColored.object.rotateOnWorldAxis( new THREE.Vector3(0, 1, 0), rotationAngle )
    cube3DModel.object.rotateOnWorldAxis( new THREE.Vector3(0, 1, 0), rotationAngle )

    // Перемещаем компьютеры вокруг оси
    for (const compModel of compModelArray) {
        rotateAroundWorldAxis( compModel, new THREE.Vector3(0, 1, 0), rotationAngle )
    }

}


/**
 * Изменения цвета центрального куба
 */
function changeCubeColor(cubeColored) {

    const colorNew = generateColor();
    cubeColored.material.setValues({ color:  colorNew });

}


/**
 * Функция анимации - вызывается каждый кадр
 */
function animate(scene, camera, renderer, cubeColored, cube3DModel, compModelArray) {

    // Регистрация вызова функции на следующий кадр
    requestAnimationFrame( () => animate(...arguments) );

    // Обработка состояния сцены
    processedState( cubeColored, cube3DModel, compModelArray );

    // Немного случайно изменяем цвет центрального куба
    changeCubeColor( cubeColored )

    // Рендер сцены
    renderer.render( scene, camera );

}


/**
 * Точка старта
 */
async function run() {

    // Инициализируем DIV контейнер для отрисовки
    const renderer = initContainer();

    // Инициализируем сцену
    const scene = initScene();

    // Инициализируем камеру
    const camera = initCamera();

    // Инициализируем центральный цветной куб
    const cubeColored = initCubeObject();

    // Инициализируем 3D модель IT-CUBE
    const cube3DModel = await initCube3DModel();

    // Инициализируем 3D модель компьютера
    const comp3DModel = await initComp3DModel();

    // Добавляем на сцену объекты
    scene.add( camera );
    camera.lookAt( scene.position );

    const rad_x = rad(-54.60);
    const rad_y = rad(45);

    scene.add( cubeColored.object );
    cubeColored.object.rotation.set( rad_x, rad_y, 0 ); // Поворот на ось

    scene.add( cube3DModel.object );
    cube3DModel.object.rotation.set( rad_x, rad_y, 0 ); // Поворот на ось
    cube3DModel.object.scale.set( 0.93, 0.93, 0.93 );

    const compModelArray = generateCompModelArray( comp3DModel )
    for (const compModel of compModelArray) scene.add( compModel );

    // Запускаем рендер
    animate( scene, camera, renderer, cubeColored, cube3DModel, compModelArray );

}

run();
