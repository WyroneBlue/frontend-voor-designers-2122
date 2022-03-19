let storage = {
    filters: {
        name: 'filters',
        items: []
    },
    movies: {
        name: 'saved_movies',
        items: []
    },
}

const getLocalStorage = (item) => {
    return JSON.parse(localStorage.getItem(item)) ?? [];
}

const updateLocalStorage = (item, value) => {
    localStorage.setItem(item, JSON.stringify(value));
}

const emptyLocalStorage = (item) => {
    localStorage.removeItem(item);
}

export {
    storage,
    getLocalStorage,
    updateLocalStorage,
    emptyLocalStorage,
}