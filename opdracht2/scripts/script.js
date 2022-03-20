// JavaScript Document
console.log("Wagwan");

import { 
    debounce, 
    isInView,
    goToTop,
    clAdd,
    clRemove,
    clToggle
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

// Search bar
const searchSection = document.querySelector('#search');
const search = searchSection.querySelector('#search-input');
const searchMsg = searchSection.querySelector('span');

// Movie List Variables
const movieResultsSection = document.querySelector('#movie-results ul');
const savedMovieSection = document.querySelector('#saved-movies');
const savedMoviesList = savedMovieSection.querySelector('ul');
const savedMoviesMsg = savedMovieSection.querySelector('p');
const emptySavedMovies = savedMovieSection.querySelector('h2 button');

// Loader Variables
const moreMovies = document.querySelector('#more-movies');
const moreMoviesLoader = moreMovies.querySelector('#more-movies span');

// Filters
const toggleFiltersBtn = document.querySelector('#toggle-filters');
const filtersSection = document.querySelector('#filters-menu');

// Back to Top
const backToTopBtn = document.querySelector('#back-to-top');


let searchCount = 0; 
let input = '';
let movieResults = [];
let page = 1;
let routeToUse = popular_route;


const checkMovieInSaved = (id) => {
    return getLocalStorage(storage.movies.name).some(movie => movie.id == id);
}

const getMovie = async(movie_id) => {
    
    let response = await fetch(`https://api.themoviedb.org/3/movie/${movie_id}?api_key=${public_key}&language=en-US`)
    return await response.json();
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
                    ? `<button data-movie_id='${movie.id}' value="remove">Remove from saved movies</button>`
                    : `<button data-movie_id="${movie.id}" value="add">Save movie</button>`
                }
                
            </li>
        `;
        movieResultsSection.insertAdjacentHTML('beforeend', html);
    })
}

const loadSavedMovies = () => {
    savedMoviesList.innerHTML = '';
    let movies = storage.movies.items = getLocalStorage(storage.movies.name);
    let msg = '';
    if(movies.length){
        movies.forEach(movie => {
            let html = `
            <li class="movie-item" data-movie_id='${movie.id}'>
                <span>${movie.title}</span>
            </li>
            `;
            savedMoviesList.insertAdjacentHTML('beforeend', html);
        });

        msg = `${movies.length} movie${(movies.length > 1 ? 's' : '')} added`;
    } else {
        msg = `No movies added yet!`;
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

const searchMovies = debounce((e) => {
    page = 1;
    input = e.target.value;
    if(input.length > 1) {
        searchMsg.innerHTML = `Movies found(${searchCount})`;
        routeToUse = search_route;
        fetchMovies({ route: routeToUse, query: input });
        
    } else {
        searchMsg.innerHTML = "";
        routeToUse = popular_route;
        loadPopularMovies({ search: false });
    }
}, 100);

const getNextPage = async() => {
    page++;
    await fetchMovies({ route: routeToUse, query: input, refresh: false });
    return;
}

const toggleItemButton = (btn) => {
    if(btn.value == 'add'){
        btn.textContent = 'Remove from saved movies';
        btn.value = 'remove';
    } else {
        btn.textContent = 'Save movie';
        btn.value = 'add';
    }
}

const addMovieToSaved = async(e) => {
    let movie_id = e.dataset.movie_id;
    const movieFound = checkMovieInSaved(movie_id);
    if (!movieFound) {
        let movie = await getMovie(movie_id);
        if(movie.success != false){
            storage.movies.items.push(movie);
            updateLocalStorage(storage.movies.name, storage.movies.items);
            loadSavedMovies();
            toggleItemButton(e);
        } else {
            alert("Er is iets mis gegaan! probeer het opnieuw");
        }
    } else {
        alert("Movie already exists");
    }
}

const removeSavedMovie = async(e) => {
    let movie_id = e.dataset.movie_id;
    const filteredSavedMovies = storage.movies.items.filter(movie => {
        return movie.id != movie_id;
    });
    storage.movies.items = filteredSavedMovies;
    updateLocalStorage(storage.movies.name, storage.movies.items);
    loadSavedMovies();
}

const handleListItem = (e) => {
    if (e.target.tagName.toLowerCase() === 'li'){
        let btn = e.target.querySelector('button');
        addMovieToSaved(btn);
    }
    
    if (e.target.tagName.toLowerCase() === 'button'){
    
        if(e.target.value == 'add') {
            addMovieToSaved(e.target);
        }
        
        if(e.target.value == 'remove') {
            removeSavedMovie(e.target);
            toggleItemButton(e.target);
        }
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

const checkScroll = debounce(() => {
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
}, 50);

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

window.addEventListener("DOMContentLoaded", onDOMContentLoaded);
window.addEventListener('load', initShake)

search.addEventListener('input', searchMovies);
savedBtn.addEventListener('click', toggleSavedMovies);
moreMovies.addEventListener('click', getNextPage);
movieResultsSection.addEventListener('click', handleListItem);
emptySavedMovies.addEventListener('click', emptySavedMoviesList);
backToTopBtn.addEventListener('click', goToTop);
toggleFiltersBtn.addEventListener('click', toggleFilters);
