// JavaScript Document
console.log("Wagwan");

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
const genreInput = filterForm.querySelector('section > div#genre');

const filtersCount = document.querySelector('#filters-menu h2 > span');
const filtersList = document.querySelector('#filters-menu ul');

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
let tempUndoRemoveId;
let page = 1;
let routeToUse = popular_route;

// Double Click Check
let lastClick = 0;
let dblClick = false;

const checkMovieInSaved = (id) => {
    return getLocalStorage(storage.movies.name).some(movie => movie.id == id);
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
            updateLocalStorage(storage.movies.name, storage.movies.items);
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
    updateLocalStorage(storage.movies.name, storage.movies.items);
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
    let movies = storage.movies.items = getLocalStorage(storage.movies.name);
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
    movieResults = json.items ?? json.results;
    loadHTML(refresh);
    searchCount = json.total_results;
    return;
}

const loadPopularMovies = async () => {
    return await fetchMovies({ route: routeToUse, search: false});
}

const searchMovies = async(e) => {
    page = 1;
    input = e.target.value;
    if(input.length > 1) {
        searchMsg.innerHTML = `Movies found(${searchCount})`;
        routeToUse = search_route;
        await fetchMovies({ route: routeToUse, query: input });
        
    } else {
        searchMsg.innerHTML = "";
        routeToUse = popular_route;
        await loadPopularMovies({ search: false });
    }
};

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
    clToggle(savedMovieSection, 'open')
    loadSavedMovies();
}

const toggleFilters = () => {
    clToggle(filtersSection, 'open')
}

const handeFilterInput = (e) => {
    if(checkTag(e, 'input')){
        let filterType = e.target.parentNode.id
        checkFilterCount(filterType)
    }
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

const onDOMContentLoaded = async() => {
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

// Floating Buttons
backToTopBtn.addEventListener('click', goToTop);
toggleFiltersBtn.addEventListener('click', toggleFilters);

// Undo remove
undoRemoveBtn.addEventListener('click', undoRemove);