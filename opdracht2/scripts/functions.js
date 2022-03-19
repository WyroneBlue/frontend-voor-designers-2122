const isInView = (el) => {
    const box = el.getBoundingClientRect();
    return (
        box.top >= 0 &&
        box.left >= 0 &&
        box.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        box.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

const debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback.apply(null, args);
        }, wait);
    };
}

const goToTop = () => {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
}

const clAdd = (el, val) => {
    el.classList.add(val); 
}

const clRemove = (el, val) => {
    el.classList.remove(val); 

}

const clToggle = (el, val) => {
    el.classList.toogle(val); 
}

export {
    isInView, 
    debounce,
    goToTop,
    clAdd,
    clRemove,
    clToggle,
}