// JavaScript Document
console.log("howdy");const public_key = '8dbadc19e0e51f9a5fdb56d3ab59b089';
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

