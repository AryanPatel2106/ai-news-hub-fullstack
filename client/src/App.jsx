import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// --- SVG Icons ---
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );
const NewspaperIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4"/><path d="M4 22a2 2 0 0 0-2-2V4a2 2 0 0 0 2-2h4"/><path d="M18 22V4"/><path d="M12 22V4"/><path d="M8 12h4"/><path d="M8 17h4"/><path d="M8 7h4"/></svg>);

// --- UI COMPONENTS ---

const Header = ({ searchTerm, setSearchTerm, activeCategory }) => (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm p-4 sticky top-0 z-30">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                 <div className="bg-gradient-to-tr from-blue-600 to-green-400 p-2 rounded-lg">
                    <NewspaperIcon />
                 </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    News Hub
                </h1>
            </div>
            <div className="relative w-full sm:w-auto sm:max-w-xs">
                <SearchIcon />
                <input 
                    type="text" 
                    placeholder={`Search in ${activeCategory}...`} 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
        </div>
    </header>
);

const NavBar = ({ activeCategory, setActiveCategory }) => {
    const categories = [
        { displayName: 'Home', apiName: 'home' }, { displayName: 'Technology', apiName: 'technology' },
        { displayName: 'Business', apiName: 'business' }, { displayName: 'Sports', apiName: 'sports' },
        { displayName: 'Science', apiName: 'science' }, { displayName: 'Health', apiName: 'health' },
    ];
    return (
        <nav className="bg-gray-100 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700/50">
            <div className="container mx-auto px-4">
                <ul className="flex items-center justify-start sm:justify-center space-x-1 md:space-x-4 overflow-x-auto py-3">
                    {categories.map((cat) => (
                        <li key={cat.apiName}>
                            <button
                                onClick={() => setActiveCategory(cat.apiName)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                                    activeCategory === cat.apiName
                                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {cat.displayName}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
};

const ArticleCard = ({ article, onArticleClick }) => {
    const placeholderImage = `https://placehold.co/600x400/374151/FFFFFF?text=News`;
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col group" onClick={() => onArticleClick(article)}>
            <div className="overflow-hidden">
                <img src={article.image_url || placeholderImage} alt={article.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }} />
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <p className="text-sm text-blue-500 dark:text-blue-400 mb-2 font-semibold">{article.source}</p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex-grow line-clamp-3">{article.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    {new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
        </div>
    );
};

const ArticleDetailModal = ({ article, onClose }) => {
    if (!article) return null;
    const placeholderImage = `https://placehold.co/800x400/374151/FFFFFF?text=News`;
    const displayContent = article.content || article.description || "Full content not available. Please read the full story on the publisher's website.";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="sticky top-4 right-4 ml-auto mr-4 float-right text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-10 bg-white/50 dark:bg-gray-800/50 rounded-full p-1"><CloseIcon /></button>
                <img src={article.image_url || placeholderImage} alt={article.title} className="w-full h-72 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }} />
                <div className="p-8">
                    <p className="text-sm text-blue-500 dark:text-blue-400 mb-2 font-semibold">{article.source}</p>
                    <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{article.title}</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Published on {new Date(article.published_at).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed whitespace-pre-wrap">{displayContent}</p>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105">
                        Read Full Story
                    </a>
                </div>
            </div>
        </div>
    );
};

const LoadingState = () => (
    <div className="w-full text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-300">Loading Fresh News...</p>
    </div>
);

const EmptyState = () => (
    <div className="w-full text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">No Articles Found</h3>
        <p className="mt-1 text-base text-gray-500 dark:text-gray-400">Try selecting a different category or refining your search.</p>
    </div>
);

const Footer = () => (
    <footer className="bg-gray-100 dark:bg-gray-800/50 mt-12 border-t border-gray-200 dark:border-gray-700/50">
        <div className="container mx-auto py-6 px-4 text-center text-gray-500 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} News Hub. All Rights Reserved.</p>
            <p className="text-sm mt-1">Powered by NewsAPI</p>
        </div>
    </footer>
);


// --- MAIN APP COMPONENT ---
export default function App() {
    // THIS IS THE NEW, SIMPLIFIED STATE. IT HOLDS THE ARTICLES FOR THE CURRENTLY VIEWED CATEGORY.
    const [articles, setArticles] = useState([]);
    
    const [activeCategory, setActiveCategory] = useState('home');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // THIS IS THE NEW, BUG-FREE useEffect.
    // It ONLY runs when the 'activeCategory' changes (i.e., when you click a new category button).
    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/articles?category=${activeCategory}`);
                // It fetches the data and directly saves it into our simple 'articles' state.
                setArticles(response.data); 
            } catch (err) {
                console.error("Frontend Fetch Error:", err);
                setError("Failed to connect to the server. Is the backend running?");
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [activeCategory]); // The dependency array is now simple and correct.

    // This is the new, simplified filtering logic.
    const articlesToDisplay = useMemo(() => {
        if (!searchTerm) return articles; // If no search, show all articles
        return articles.filter(article =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [articles, searchTerm]); // It re-runs only when articles or the search term change.

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} activeCategory={activeCategory} />
            <NavBar activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

            <main className="container mx-auto p-4 md:p-6">
                {loading && <LoadingState />}
                {error && <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg font-bold">{error}</div>}
                
                {!loading && !error && (
                    articlesToDisplay.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {articlesToDisplay.map((article) => ( <ArticleCard key={article.id} article={article} onArticleClick={setSelectedArticle} /> ))}
                        </div>
                    ) : <EmptyState />
                )}
            </main>
            
            <Footer />
            <ArticleDetailModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
        </div>
    );
}