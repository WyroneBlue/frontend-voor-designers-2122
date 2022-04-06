let storage = {
    filters: {
        isOpen: false,
        name: 'filters',
        items: {}
    },
    movies: {
        isOpen: false,
        name: 'saved_movies',
        items: []
    },
}

const getLocalStorage = (item, prop) => {
    let storageItem = localStorage.getItem(item.name) ?? [];
    if(storageItem.length){
        return JSON.parse(storageItem)[prop] ?? [];
    } else {
        return [];
    }
}

const updateLocalStorage = (item) => {
    const values = {
        isOpen: item.isOpen,
        items: item.items,
    }
    localStorage.setItem(item.name, JSON.stringify(values));
}

const emptyLocalStorage = (item) => {
    localStorage.removeItem(item.name);
}

export {
    storage,
    getLocalStorage,
    updateLocalStorage,
    emptyLocalStorage,
}