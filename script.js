import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';


// Состояние сцены
const state = {
    angle: 0,               // угол поворота камеры вокруг центра
    mouse_x: 0,             // текущая позиция мыши по X
    mouse_shift_x: 0,       // сдвиг по X при зажатой кнопке
    mouse_pressed: false,   // флаг: нажата ли кнопка мыши
    multiple: 6,            // ???
};


// Параметры сцены
const settings = {
    render: {
        alpha: true,        // включаем обработку прозрачности
        antialias: true,    // включаем сглаживание
    },

    camera: {
        fov: 75,            // угол поля зрения
        distance_min: 1,    // мин дистанция рендера
        distance_max: 10,   // макс дистанция рендера
        position_x: 0,      // позиция от центра мира вбок
        position_y: 1.5,    // позиция от центра мира вверх
        position_z: 1,      // позиция от центра мира назад
        angle: 0,           // угол поворота камеры
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
 * Инициализация DIV контейнера со сценой
 */
function initContainer() {

    // Находим нужный DIV контейнер на странице
    const sceneContainer = document.querySelector('#model3dcube');

    // Добавляем контейнер со сценой в DIV контейнер
    const renderer = new THREE.WebGLRenderer( settings.render );
    sceneContainer.appendChild( renderer.domElement );

    // Устанавливаем начальные параметры контейнера со сценой
    renderer.setSize( sceneContainer.clientWidth, sceneContainer.clientHeight );
    renderer.setPixelRatio( window.devicePixelRatio );

    // Добавляем слушатель на движение мыши
    document.addEventListener( 'mousemove', (event) => {
        if (state.mouse_pressed) {
            state.mouse_shift_x = state.mouse_x - event.clientX;
            state.angle += state.mouse_shift_x * 0.1 * -1;
    
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

    const cubeSize = 2;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
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
 * Обработка состояния сцены
 */
function processedState(scene, camera) {

    if (!state.mouse_pressed) {
        state.angle += 0.4;
    }

    const rad = ((state.angle) / 360) * 2 * Math.PI;

    camera.position.x = Math.cos( rad ) * state.multiple;
    camera.position.z = Math.sin( rad ) * state.multiple;
    camera.lookAt( scene.position );

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
function animate(scene, camera, renderer, cubeColored) {

    // Регистрация вызова функции на следующий кадр
    requestAnimationFrame( () => animate(...arguments) );

    // Обработка состояния сцены
    processedState(scene, camera);

    // Немного случайно изменяем цвет центрального куба
    changeCubeColor(cubeColored)

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
    scene.add( camera );

    // Инициализируем центральный цветной куб
    const cubeColored = initCubeObject();

    // Инициализируем 3D модель IT-CUBE
    const cube3DModel = await initCube3DModel();

    // Добавляем на сцену объекты
    scene.add( cubeColored.object );
    cubeColored.object.rotation.set(45, 35.2644, 0); // Поворот на ось

    scene.add( cube3DModel.object );
    cube3DModel.object.rotation.set(45, 35.2644, 0); // Поворот на ось

    // Запускаем рендер
    animate(scene, camera, renderer, cubeColored);

}

run();
