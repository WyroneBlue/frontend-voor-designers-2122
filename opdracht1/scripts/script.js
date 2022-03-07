// JavaScript Document
console.log("wagwan people");

const body = document.querySelector("body");
const section = document.querySelector("section#marvel");
const h2 = section.querySelector("h2");
const modal = document.querySelector("section#modal");
const confirm_yes = modal.querySelector("section button:nth-of-type(1)");
const confirm_no = modal.querySelector("section button:nth-of-type(2)");

const animations = [
    {
        name: 'ironman',
        element: h2.querySelector("span:nth-of-type(1)"),
        sound: true,
        delay: 1000,
    },
    {
        name: 'captain',
        element: h2.querySelector("span:nth-of-type(2)"),
        sound: true,
        delay: 4000,
    },
    {
        name: 'thor',
        element: h2.querySelector("span:nth-of-type(3)"),
        sound: true,
        delay: 2500,
    },
    {
        name: 'hulk',
        element: h2.querySelector("span:nth-of-type(4)"),
        sound: true,
        delay: 4000,
    },
    {
        name: 'natasha',
        element: h2.querySelector("span:nth-of-type(5)"),
        delay: 3000,
        sound: true,
    },
    {
        name: 'hawkeye',
        element: h2.querySelector("span:nth-of-type(6)"),
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
        }, timeout);

    });
}

const closeModal = () => {
    body.classList.add('no-animations');
}

confirm_yes.addEventListener('click', runAnimations);
confirm_no.addEventListener('click', closeModal);