// JavaScript Document
console.log("wagwan people");

const section = document.querySelector("section#marvel");
const h2 = section.querySelector("section#marvel h2");

const animations = [
    {
        name: 'ironman',
        element: document.querySelector("section#marvel h2 span:nth-of-type(1)"),
        sound: true,
        delay: 1000,
    },
    {
        name: 'captain',
        element: document.querySelector("section#marvel h2 span:nth-of-type(2)"),
        sound: true,
        delay: 4000,
    },
    {
        name: 'thor',
        element: document.querySelector("section#marvel h2 span:nth-of-type(3)"),
        sound: true,
        delay: 2500,
    },
    {
        name: 'hulk',
        element: document.querySelector("section#marvel h2 span:nth-of-type(4)"),
        delay: 4000,
    },
    {
        name: 'natasha',
        element: document.querySelector("section#marvel h2 span:nth-of-type(5)"),
        delay: 3000,
        sound: true,
    },
    {
        name: 'hawkeye',
        element: document.querySelector("section#marvel h2 span:nth-of-type(6)"),
        delay: 3000,
        sound: true,
    },
    {
        name: 'ending',
        element: h2,
        delay: 2600,
        sound: true,
    },
];

const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
}
  
const playSound = ({sfx, rate = 1, volume = 1}) => {
    let sound = new Audio(`sounds/${sfx}.mp3`);
    sound.playbackRate = rate;
    sound.volume = volume;
    sound.play()
}


const runAnimation = (animation) => {
    animation.element.classList.add('start');
    if(animation.sound){
        playSound({sfx: animation.name});
    }
}

const runAnimations = () => {
    playSound({ sfx: 'intro', rate: 1.15, vol: .5 });
    let timeout = 0;
    Object.values(animations).forEach((animation, index) => {
        timeout += animation.delay - 500;
        setTimeout(() => { 
            runAnimation(animation);
            console.log('run');
        }, timeout);

    });
}

window.addEventListener('DOMContentLoaded', runAnimations);