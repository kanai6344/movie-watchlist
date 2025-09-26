// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const tabs = document.querySelectorAll('.tab');
const watchlistContent = document.getElementById('watchlist-content');
const watchedContent = document.getElementById('watched-content');

// API Key for OMDb API (Free tier - 1000 requests per day)
const API_KEY = 'b9a48916'; // This is a demo key - replace with your own from http://www.omdbapi.com/apikey.aspx

// Movie lists from localStorage
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let watched = JSON.parse(localStorage.getItem('watched')) || [];

// Initialize the app
function initApp() {
    // Load saved lists
    renderWatchlist();
    renderWatched();
    
    // Event listeners
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            if (tab.dataset.tab === 'watchlist') {
                watchlistContent.style.display = 'block';
                watchedContent.style.display = 'none';
            } else {
                watchlistContent.style.display = 'none';
                watchedContent.style.display = 'block';
            }
        });
    });
}

// Search for movies
async function performSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        alert('Please enter a movie title to search');
        return;
    }
    
    // Show loading state
    searchResults.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Searching for movies...</p></div>';
    
    try {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.Response === 'True') {
            displaySearchResults(data.Search);
        } else {
            searchResults.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>No movies found for "${query}"</p></div>`;
        }
    } catch (error) {
        console.error('Error searching movies:', error);
        searchResults.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error searching for movies. Please try again.</p></div>`;
    }
}

// Display search results
function displaySearchResults(movies) {
    searchResults.innerHTML = '';
    
    if (movies.length === 0) {
        searchResults.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>No movies found</p></div>';
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'results-grid';
    
    // Limit to first 10 results for performance
    movies.slice(0, 10).forEach(movie => {
        const movieCard = createMovieCard(movie, true);
        grid.appendChild(movieCard);
    });
    
    searchResults.appendChild(grid);
}

// Create a movie card
function createMovieCard(movie, isSearchResult = false) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    // Check if movie is already in watchlist or watched
    const inWatchlist = watchlist.some(m => m.imdbID === movie.imdbID);
    const inWatched = watched.some(m => m.imdbID === movie.imdbID);
    
    card.innerHTML = `
        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450/333/fff?text=No+Image'}" 
             alt="${movie.Title}" class="movie-poster">
        <div class="movie-info">
            <h3 class="movie-title">${movie.Title}</h3>
            <div class="movie-details">
                <span class="movie-year">${movie.Year}</span>
                <span class="movie-type">${movie.Type}</span>
            </div>
            ${isSearchResult ? `
            <div class="movie-actions">
                <button class="action-btn add-watchlist" ${inWatchlist || inWatched ? 'disabled' : ''}>
                    ${inWatchlist ? 'In Watchlist' : inWatched ? 'Already Watched' : 'Add to Watchlist'}
                </button>
                <button class="action-btn add-watched" ${inWatched ? 'disabled' : ''}>
                    ${inWatched ? 'Already Watched' : 'Mark as Watched'}
                </button>
            </div>
            ` : ''}
        </div>
    `;
    
    if (isSearchResult) {
        const watchlistBtn = card.querySelector('.add-watchlist');
        const watchedBtn = card.querySelector('.add-watched');
        
        if (!inWatchlist && !inWatched) {
            watchlistBtn.addEventListener('click', () => addToWatchlist(movie));
            watchedBtn.addEventListener('click', () => addToWatched(movie));
        }
    }
    
    return card;
}

// Create a movie card for watchlist/watched lists
function createListMovieCard(movie, listType) {
    const card = document.createElement('div');
    card.className = 'list-movie-card';
    
    // Get rating if movie is in watched list
    const rating = listType === 'watched' ? movie.rating || 0 : 0;
    
    card.innerHTML = `
        <button class="remove-btn" data-id="${movie.imdbID}" data-list="${listType}">
            <i class="fas fa-times"></i>
        </button>
        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450/333/fff?text=No+Image'}" 
             alt="${movie.Title}" class="movie-poster">
        <div class="movie-info">
            <h3 class="movie-title">${movie.Title}</h3>
            <div class="movie-details">
                <span class="movie-year">${movie.Year}</span>
                <span class="movie-type">${movie.Type}</span>
            </div>
        </div>
        ${listType === 'watched' ? `
        <div class="rating-section">
            <span>Rating:</span>
            <div class="stars" data-id="${movie.imdbID}">
                <span class="star ${rating >= 1 ? 'active' : ''}" data-rating="1"><i class="fas fa-star"></i></span>
                <span class="star ${rating >= 2 ? 'active' : ''}" data-rating="2"><i class="fas fa-star"></i></span>
                <span class="star ${rating >= 3 ? 'active' : ''}" data-rating="3"><i class="fas fa-star"></i></span>
                <span class="star ${rating >= 4 ? 'active' : ''}" data-rating="4"><i class="fas fa-star"></i></span>
                <span class="star ${rating >= 5 ? 'active' : ''}" data-rating="5"><i class="fas fa-star"></i></span>
            </div>
        </div>
        ` : ''}
    `;
    
    // Add event listener to remove button
    const removeBtn = card.querySelector('.remove-btn');
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromList(movie.imdbID, listType);
    });
    
    // Add event listeners to rating stars
    if (listType === 'watched') {
        const stars = card.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                rateMovie(movie.imdbID, rating);
                
                // Update stars visually
                stars.forEach(s => {
                    if (parseInt(s.dataset.rating) <= rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });
        });
    }
    
    return card;
}

// Add movie to watchlist
function addToWatchlist(movie) {
    if (watchlist.some(m => m.imdbID === movie.imdbID)) {
        alert('This movie is already in your watchlist!');
        return;
    }
    
    if (watched.some(m => m.imdbID === movie.imdbID)) {
        alert('This movie is already in your watched list!');
        return;
    }
    
    watchlist.push(movie);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderWatchlist();
    
    // Update search results to reflect the change
    performSearch();
    
    alert(`"${movie.Title}" added to your watchlist!`);
}

// Add movie to watched list
function addToWatched(movie) {
    if (watched.some(m => m.imdbID === movie.imdbID)) {
        alert('This movie is already in your watched list!');
        return;
    }
    
    // Remove from watchlist if it's there
    watchlist = watchlist.filter(m => m.imdbID !== movie.imdbID);
    
    // Add to watched with default rating of 0
    movie.rating = 0;
    watched.push(movie);
    
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    localStorage.setItem('watched', JSON.stringify(watched));
    
    renderWatchlist();
    renderWatched();
    
    // Update search results to reflect the change
    performSearch();
    
    alert(`"${movie.Title}" added to your watched list!`);
}

// Remove movie from a list
function removeFromList(movieId, listType) {
    if (listType === 'watchlist') {
        watchlist = watchlist.filter(movie => movie.imdbID !== movieId);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        renderWatchlist();
    } else {
        watched = watched.filter(movie => movie.imdbID !== movieId);
        localStorage.setItem('watched', JSON.stringify(watched));
        renderWatched();
    }
    
    // Update search results to reflect the change
    if (searchInput.value.trim()) {
        performSearch();
    }
}

// Rate a movie
function rateMovie(movieId, rating) {
    const movieIndex = watched.findIndex(movie => movie.imdbID === movieId);
    
    if (movieIndex !== -1) {
        watched[movieIndex].rating = rating;
        localStorage.setItem('watched', JSON.stringify(watched));
    }
}

// Render watchlist
function renderWatchlist() {
    watchlistContent.innerHTML = '';
    
    if (watchlist.length === 0) {
        watchlistContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <p>Your watchlist is empty</p>
                <p>Search for movies and add them to your watchlist</p>
            </div>
        `;
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'movies-list';
    
    watchlist.forEach(movie => {
        const movieCard = createListMovieCard(movie, 'watchlist');
        grid.appendChild(movieCard);
    });
    
    watchlistContent.appendChild(grid);
}

// Render watched list
function renderWatched() {
    watchedContent.innerHTML = '';
    
    if (watched.length === 0) {
        watchedContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>You haven't watched any movies yet</p>
                <p>Search for movies and mark them as watched</p>
            </div>
        `;
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'movies-list';
    
    watched.forEach(movie => {
        const movieCard = createListMovieCard(movie, 'watched');
        grid.appendChild(movieCard);
    });
    
    watchedContent.appendChild(grid);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
