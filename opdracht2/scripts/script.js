// JavaScript Document
console.log("Wagwan");

import { key } from './env.js';
// API Variables
const public_key = key;
const search_route = `https://api.themoviedb.org/3/search/movie?api_key=${public_key}&language=en-US&include_adult=false`;
const popular_route = `https://api.themoviedb.org/3/trending/movie/week?api_key=${public_key}`;

// Header Variables
const search = document.querySelector('#search-input');
const savedBtn = document.querySelector('header button');

// Movie List Variables
const movieResultsSection = document.querySelector('#movie-results ul');
const savedMovieSection = document.querySelector('#saved-movies');
const savedMoviesList = savedMovieSection.querySelector('ul');
const savedMoviesMsg = savedMovieSection.querySelector('p');
const emptySavedMovies = savedMovieSection.querySelector('h2 button');

// Loader Variables
const moreMovies = document.querySelector('#more-movies');
const moreMoviesLoader = moreMovies.querySelector('#more-movies span');

const backToTopBtn = document.querySelector('#back-to-top');

let input = '';
let movieResults = [];
let page = 1;
let routeToUse = popular_route;

import { 
    debounce, 
    isInView,
    goToTop
} from './functions.js';
import { 
    storage, 
    getLocalStorage, 
    updateLocalStorage, 
    emptyLocalStorage 
} from './localStorage.js';


const checkMovieInSaved = (id) => {
    return getLocalStorage(storage.movies.name).some(movie => movie.id == id);
}

const loadHTML = (refresh = false) => {
    if(refresh){
        movieResultsSection.innerHTML = '';
    }
    Object.values(movieResults).forEach(movie => {
        let inSaved = checkMovieInSaved(movie.id);

        let html = `
            <li class="movie-item" data-movie_id='${movie.id}'>
                <span>${movie.title}</span>
                ${
                    inSaved 
                    ? '<button value="remove">Remove from saved movies</button>'
                    : '<button value="add">Save movie</button>'
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
    return;
}


const getNextPage = async() => {
    page++;
    await fetchMovies({ route: routeToUse, query: input, refresh: false });
    return;
}

const getMovie = async(movie_id) => {
    
    let response = await fetch(`https://api.themoviedb.org/3/movie/${movie_id}?api_key=${public_key}&language=en-US`)
    return await response.json();
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
    let btn = e.querySelector('button');
    let movie_id = e.dataset.movie_id;
    const movieFound = checkMovieInSaved(movie_id);
    if (!movieFound) {
        let movie = await getMovie(movie_id);
        if(movie.success != false){
            storage.movies.items.push(movie);
            updateLocalStorage(storage.movies.name, storage.movies.items);
            loadSavedMovies();
            toggleItemButton(btn);
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
        addMovieToSaved(e.target);
    }
    
    if (e.target.tagName.toLowerCase() === 'button'){
    
        if(e.target.value == 'add') {
            addMovieToSaved(e.target.parentNode);
        }
        
        if(e.target.value == 'remove') {
            removeSavedMovie(e.target.parentNode);
            toggleItemButton(e.target);
        }
    }
}

const emptySavedMoviesList = () => {
    storage.movies.items = [];
    emptyLocalStorage(storage.movies.name)
    loadSavedMovies();
    loadHTML();
}


const loadPopularMovies = async () => {
    return await fetchMovies({ route: routeToUse, search: false});
}

const searchMovies = debounce((e) => {
    page = 1;
    input = e.target.value;
    if(input.length > 1) {
        routeToUse = search_route;
        fetchMovies({ route: routeToUse, query: input });
        
    } else {
        routeToUse = popular_route;
        loadPopularMovies({ search: false });
    }
}, 250);

const toggleSavedMovies = () => {
    savedMovieSection.classList.toggle('open');
    loadSavedMovies();
}

const checkScroll = debounce(() => {
    if(isInView(moreMovies)){
        moreMoviesLoader.classList.add('loading');
        getNextPage();
        moreMoviesLoader.classList.remove('loading');
    }

    if(!isInView(search)){
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
}, 100);

const onDOMContentLoaded = async() => {
    await loadPopularMovies();
    loadSavedMovies();
    window.addEventListener("scroll", checkScroll);
}

window.addEventListener("DOMContentLoaded", onDOMContentLoaded);

search.addEventListener('input', searchMovies);
savedBtn.addEventListener('click', toggleSavedMovies);
moreMovies.addEventListener('click', getNextPage);
movieResultsSection.addEventListener('click', handleListItem);
emptySavedMovies.addEventListener('click', emptySavedMoviesList);
backToTopBtn.addEventListener('click', goToTop);
