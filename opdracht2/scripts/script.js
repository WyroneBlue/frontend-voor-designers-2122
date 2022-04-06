// JavaScript Document
console.log("Wagwan");

import { 
    filters,
    checkFilter,
    updateFilter,
    resetFilters,
    checkFiltersCount 
} from './filter.js';
import { 
    debounce, 
    isInView,
    goToTop,
    clAdd,
    clRemove,
    clToggle,
    clHas,
    checkTag
} from './functions.js';
import { 
    storage, 
    getLocalStorage, 
    updateLocalStorage, 
    emptyLocalStorage 
} from './localStorage.js';
import { vibrate } from './vibration.js';

import { key } from './env.js';

// API Variables
const public_key = key;
const search_route = `https://api.themoviedb.org/3/search/movie?api_key=${public_key}&language=en-US&include_adult=false`;
const popular_route = `https://api.themoviedb.org/3/trending/movie/week?api_key=${public_key}`;
const movie_img_prefix = 'https://image.tmdb.org/t/p/w500';

// Header Variables
const header = document.querySelector('header');
const savedBtn = header.querySelector('button');
const savedMoviesCount = header.querySelector('button span');

// Search bar
const searchSection = document.querySelector('#search');
const search = searchSection.querySelector('#search-input');
const searchMsg = searchSection.querySelector('span');

// Movie List Variables
const movieResultsSection = document.querySelector('#movie-results ul');
const savedMovieSection = document.querySelector('#saved-movies');
const savedMoviesList = savedMovieSection.querySelector('ul');
const savedMoviesMsg = savedMovieSection.querySelector('div p');
const emptySavedMovies = savedMovieSection.querySelector('div button');

// Loader Variables
const moreMovies = document.querySelector('#more-movies');
const moreMoviesLoader = moreMovies.querySelector('#more-movies span');

// Filters
const toggleFiltersBtn = document.querySelector('#toggle-filters');
const filtersSection = document.querySelector('#filters-menu');
const filterForm = document.querySelector('#filters-menu form');
const allFilterInputs = filterForm.querySelectorAll('#filters-menu form > section > div');

const filtersCount = document.querySelector('#filters-menu h2 > span');
const filtersList = document.querySelector('#filters-menu ul');
const resetFiltersBtn = document.querySelector('#filters-menu > section button');

// Back to Top
const backToTopBtn = document.querySelector('#back-to-top');

// Undo remove
const undoRemoveSection = document.querySelector('#undo-remove');
const undoRemoveTimer = undoRemoveSection.querySelector('p span');
const undoRemoveBtn = undoRemoveSection.querySelector('button');
let undoRemoveTimerInterval;
let undoTimerSecs;

let searchCount = 0; 
let input = '';
let movieResults = [];
let moviesToRender = [];
let tempUndoRemoveId;
let page = 1;
let routeToUse = popular_route;

// Double Click Check
let lastClick = 0;
let dblClick = false;

const checkMovieInSaved = (id) => {
    return getLocalStorage(storage.movies, 'items').some(movie => movie.id == id);
}

const getMovie = async(movie_id) => {
    
    let response = await fetch(`https://api.themoviedb.org/3/movie/${movie_id}?api_key=${public_key}&language=en-US`)
    return await response.json();
}

const addMovieToSaved = async(e, undoRemove = false) => {
    let movie_id = (!undoRemove) ? e.dataset.movie_id : e;
    const movieFound = checkMovieInSaved(movie_id);
    if (!movieFound) {
        let movie = await getMovie(movie_id);
        if(movie.success != false){
            storage.movies.items.push(movie);
            updateLocalStorage(storage.movies);
            loadSavedMovies();
            if(!undoRemove){
                toggleItemButton(e);
            }

            clAdd(savedMoviesCount, 'movie-added');
            savedMoviesCount.addEventListener('animationend', (e) => {
                clRemove(savedMoviesCount, 'movie-added')
            });
        } else {
            alert("Er is iets mis gegaan! probeer het opnieuw");
        }
    } else {
        alert("Movie already exists");
    }
}

const resetUndoRemoveInterval = () => {
    clRemove(undoRemoveSection, 'open');
    clearInterval(undoRemoveTimerInterval);
    undoRemoveTimer.textContent = "(5)";
    tempUndoRemoveId = '';
    undoTimerSecs = 5;
}

const undoRemove = async() => {
    clearInterval(undoRemoveTimerInterval);
    await addMovieToSaved(tempUndoRemoveId, true);
    resetUndoRemoveInterval()
}

const handleUndoRemove = async (movie_id) => {
    undoTimerSecs = 5;
    tempUndoRemoveId = movie_id;
    
    undoRemoveTimerInterval = setInterval(() => {
        undoTimerSecs--;
        undoRemoveTimer.textContent = `(${undoTimerSecs})`;
        if(undoTimerSecs == 0) {
            resetUndoRemoveInterval()
        }
    }, 1000);
}

const removeSavedMovie = async(e, undoRemove) => {
    let movie_id = e.dataset.movie_id;
    if(undoRemove){
        clAdd(undoRemoveSection, 'open');
        handleUndoRemove(movie_id);
    }
    const filteredSavedMovies = storage.movies.items.filter(movie => {
        return movie.id != movie_id;
    });
    storage.movies.items = filteredSavedMovies;
    updateLocalStorage(storage.movies);
    loadSavedMovies();
}

const checkDblClick = (e) => {
    var d = new Date();
    var t = d.getTime();
    if(t - lastClick < 250) {
        dblClick = true;
    } else {
        dblClick = false;
    }
    lastClick = t;
}

const handleMovieCard = (item, undoRemove) => {

    if(clHas(item,'add') && !undoRemove){
        addMovieToSaved(item);
    }
    
    if(clHas(item,'remove') && !undoRemove) {
        removeSavedMovie(item);
        toggleItemButton(item);
    } else {
        removeSavedMovie(item, undoRemove);
    }
}

const handleCardClick = (listItem, btn, fromSavedList = false) => {
    btn.addEventListener('click', function(e){
        if(checkTag(e, 'button')){
            handleMovieCard(this, fromSavedList);
        }
    })
    
    listItem.addEventListener('click', function(e){
        checkDblClick();
        if(dblClick && !checkTag(e, 'button')){
            handleMovieCard(btn, fromSavedList);
        }
    })
}

const loadHTML = (refresh = false) => {
    if(refresh){
        movieResultsSection.innerHTML = '';
    }

    Object.values(movieResults).forEach(async movie => {
        let inSaved = checkMovieInSaved(movie.id);
        let fullMovieInfo = await getMovie(movie.id);

        let genres = '';
        fullMovieInfo.genres.forEach(genre => {
            genres += `
                <li>${genre.name}</li>
            `
        });

        let html = `
            <li class="movie-item" >
                <img src="${movie_img_prefix + movie.poster_path}" alt="${movie.title} poster">
                <section>
                    <div>
                        <h3>${movie.title}</h3>
                        <span>${movie.release_date}</span>
                    </div>
                    <p>${movie.overview}</p>
                    <ul>
                        ${genres}
                    </ul>
                </section>
                ${
                    inSaved 
                    ? `<button data-movie_id='${movie.id}' class="remove"></button>`
                    : `<button data-movie_id="${movie.id}" class="add"></button>`
                }
                
            </li>
        `;

        movieResultsSection.insertAdjacentHTML('beforeend', html);
        let listItem = movieResultsSection.querySelector('li.movie-item:last-child');
        let listItemBtn = listItem.querySelector('button');
        handleCardClick(listItem, listItemBtn);
    })
}

const loadSavedMovies = () => {
    savedMoviesList.innerHTML = '';
    let movies = storage.movies.items = getLocalStorage(storage.movies, 'items');
    let msg = '';

    savedMoviesCount.textContent = movies.length
    if(movies.length){
        movies.forEach(movie => {
            let html = `
                <li class="movie-item" data-movie_id='${movie.id}'>
                    <img src="${movie_img_prefix + movie.poster_path}" alt="${movie.title} poster">
                    <span>${movie.title}</span>
                    <button data-movie_id='${movie.id}' class="remove"></button>
                </li>
            `;
            savedMoviesList.insertAdjacentHTML('beforeend', html);
            let savedMovie = savedMoviesList.querySelector('li.movie-item:last-child');
            let savedMovieBtn = savedMovie.querySelector('button');
            handleCardClick(savedMovie, savedMovieBtn, true);
        });

        msg = `${movies.length} movie${(movies.length > 1 ? 's' : '')} added`;
        clAdd(savedMoviesCount, 'filled')
        clRemove(savedMovieSection, 'empty');
    } else {
        msg = `No movies added yet!`;
        clRemove(savedMoviesCount, 'filled');
        clAdd(savedMovieSection, 'empty');
    }
    savedMoviesMsg.textContent = msg;
}

const fetchMovies = async ({route, query, search = true, refresh = true}) => {
    const params =  search != true ? '' : (query != '' ? `&query=${query}&page=${page}` : `&page=${page}`);
    const response = await fetch(route + params);
    let json = await response.json();
    moviesToRender = movieResults = json.items ?? json.results;
    searchCount = json.total_results;
    loadHTML(refresh);
    return;
}

const loadPopularMovies = async () => {
    return await fetchMovies({ route: routeToUse, search: false});
}

const searchMovies = debounce(async(e) => {
    page = 1;
    input = e.target.value;
    if(input.length > 1) {
        routeToUse = search_route;
        await fetchMovies({ route: routeToUse, query: input });
        searchMsg.innerHTML = `Movies found(${searchCount})`;
        
    } else {
        routeToUse = popular_route;
        await loadPopularMovies({ search: false });
        searchMsg.innerHTML = "";
    }
}, 300);

const getNextPage = async() => {
    page++;
    await fetchMovies({ route: routeToUse, query: input, refresh: false });
    return;
}

const toggleItemButton = (btn) => {
    if(clHas(btn, 'add')){
        clRemove(btn, 'add');
        clAdd(btn, 'remove');
    } else {
        clRemove(btn, 'remove');
        clAdd(btn, 'add');
    }
}

const emptySavedMoviesList = () => {
    storage.movies.items = [];
    emptyLocalStorage(storage.movies.name)
    loadSavedMovies();
    loadPopularMovies();
}

const toggleSavedMovies = () => {
    let val = clToggle(savedMovieSection, 'open');
    let isOpen;
    if(val){
        isOpen = true
    } else {
        isOpen = false;
    }
    storage.movies.isOpen = isOpen;
    updateLocalStorage(storage.movies);
    loadSavedMovies();
}

const toggleFilters = () => {
    let val = clToggle(filtersSection, 'open');
    let isOpen;
    if(val){
        isOpen = true
    } else {
        isOpen = false;
    }
    storage.filters.isOpen = isOpen;
    updateLocalStorage(storage.filters);
}

const updateAllFilters = () => {
    filtersCount.textContent = checkFiltersCount();
}

const compareOrder = (movieA, movieB) => {
    let returnVal1;
    let returnVal2;
    if(filters.items.order.items == 'A-Z'){
        returnVal1 = -1
        returnVal2 = 1
    } else {
        returnVal1 = 1
        returnVal2 = -1
    }

    if (movieA.title.toLowerCase() < movieB.title.toLowerCase()){
        return returnVal1;
    }
    if (movieA.title.toLowerCase() > movieB.title.toLowerCase()){
        return returnVal2;
    }
    loadHTML(true);
    return 0;
}

const filterMovieGenres = async(filterItems, resetGenres) => {
    let filteredMovies = [];
    let fullInfoMovies = [];
    let counter = 0;
    if(filterItems.length && !resetGenres){

        movieResults.forEach(async(movie) => {
            let movieInfo = await getMovie(movie.id);
            fullInfoMovies.push(movieInfo);
            counter++;
            if(counter == movieResults.length){
                movieResults = fullInfoMovies;
            }
        });
        
        setTimeout(() => {
            movieResults.map(movie => {
                movie.genres = movie.genres.map((genre) => {
                    return genre.name.toLowerCase();
                });
            });
        }, 500);
        
        setTimeout(() => {
            
            filteredMovies = movieResults.filter(movie => {
                const found = filterItems.some(filter => {
                    return movie.genres.includes(filter)
                });
                return found;
            });
        }, 500);
        
        setTimeout(() => {
            movieResults = filteredMovies;
            loadHTML(true);
        }, 500)
    } else {
        movieResults = moviesToRender;
        loadHTML(true);
    }
}

const filterMovieResults = (resetGenres = false) => {
    let filters = getLocalStorage(storage.filters, 'items');
    Object.values(filters).forEach((filter) => {
        if(filter.name == 'order'){
            movieResults.sort(compareOrder)
        }

        if(filter.name == 'genre' || resetGenres){
            filterMovieGenres(filter.items, resetGenres)
        }
    });
}

const handeFilterInput = (e) => {
    if(checkTag(e, 'input')){
        let filter = e.target.parentNode.parentNode;
        let filterCounter = filter.querySelector('section > h3 span');
        let filterType = e.target.parentNode.id;
        if(filterType == 'order'){
  
            let label = e.target.parentNode.querySelector(`label[for=${e.target.id}]`).textContent;
            updateFilter(filterType, label);
            storage.filters.items = filters.items;
            updateLocalStorage(storage.filters)
            filterCounter.textContent = checkFilter(filterType).items;
        } else {

            let checkedNodes = filter.querySelectorAll('section > div input:checked');
            let checkedItems = Array.from(checkedNodes).map((filter) => {
                return filter.id.replace(`${filterType}-`, '');
            });
            updateFilter(filterType, checkedItems);
            storage.filters.items = filters.items;
            updateLocalStorage(storage.filters)
            filterCounter.textContent = checkFilter(filterType).count;
        }
        updateAllFilters();
        filterMovieResults();
    }
}

const resetFilterForm = () => {
    resetFilters(filterForm); 
    allFilterInputs.forEach(filter => {
        let input = filter.parentNode;
        let filterCounter = input.querySelector('section > h3 span');
        let filterType = filter.id;
        if(filterType != 'order'){
            updateFilter(filterType, []);
            filterCounter.textContent = checkFilter(filterType).count;
        } else {
            updateFilter(filterType, "Popularity");
            filterCounter.textContent = checkFilter(filterType).items;
        }
    });
    filterMovieResults(true);
}

const checkScroll = () => {
    if(isInView(moreMovies)){
        clAdd(moreMoviesLoader, 'loading');
        getNextPage();
        clRemove(moreMoviesLoader, 'loading');
    }

    if(window.scrollY > 0){
        clAdd(searchSection, 'sticky');
        clAdd(backToTopBtn, 'show');
    } else {
        clRemove(searchSection, 'sticky');
        clRemove(backToTopBtn, 'show');
    }
};

const checkShake = (e) => {
    vibrate(150);
    setTimeout(() => {

        let check = confirm('Are you sure you want to empty your list?');
        if(check){
            vibrate([50, 0, 50]);
            emptySavedMoviesList();
        }
    }, 150)
}

const initShake = () => {
    var myShakeEvent = new Shake({
        threshold: 8
    });
    // start listening to device motion
    myShakeEvent.start();
    window.addEventListener('shake', checkShake, false);
}

const checkOpenMenus = () => {
    const savedMoviesOpen = getLocalStorage(storage.movies, 'isOpen');
    if(savedMoviesOpen){
        clToggle(savedMovieSection, 'open');
    }
    
    const filtersOpen = getLocalStorage(storage.filters, 'isOpen');
    if(filtersOpen){
        clToggle(filtersSection, 'open');
    }
}

const onDOMContentLoaded = async() => {
    checkOpenMenus();
    await loadPopularMovies();
    loadSavedMovies();
    window.addEventListener("scroll", checkScroll);
}

// On load
window.addEventListener("DOMContentLoaded", onDOMContentLoaded);
window.addEventListener('load', initShake)

// Header
search.addEventListener('input', searchMovies);
savedBtn.addEventListener('click', toggleSavedMovies);

// Movie results
moreMovies.addEventListener('click', getNextPage);

// Saved Movies
emptySavedMovies.addEventListener('click', emptySavedMoviesList);

// Filters
resetFiltersBtn.addEventListener('click', resetFilterForm);
allFilterInputs.forEach(filter => {
    let filterType = filter.id;
    let checkedItems = filter.querySelectorAll('section > div input:checked');
    updateFilter(filterType, checkedItems)
    filter.addEventListener('click', handeFilterInput);
});

// Floating Buttons
backToTopBtn.addEventListener('click', goToTop);
toggleFiltersBtn.addEventListener('click', toggleFilters);

// Undo remove
undoRemoveBtn.addEventListener('click', undoRemove);