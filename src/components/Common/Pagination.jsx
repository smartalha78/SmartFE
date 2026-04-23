import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

const Pagination = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    maxVisiblePages = 3,
    loading = false
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;

    // Calculate visible page numbers
    const getVisiblePages = () => {
        let start = Math.max(currentPage - 1, 1);
        let end = Math.min(start + maxVisiblePages - 1, totalPages);
        
        // Adjust start if we're near the end
        if (end - start + 1 < maxVisiblePages) {
            start = Math.max(end - maxVisiblePages + 1, 1);
        }
        
        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const visiblePages = getVisiblePages();
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Handle page change with loading state
    const handlePageChange = (page) => {
        if (!loading && page >= 1 && page <= totalPages && page !== currentPage) {
            onPageChange(page);
        }
    };

    return (
        <div className="pagination-container">
            {/* Showing entries info on left */}
            <div className="pagination-info">
                Showing {startItem} to {endItem} of {totalItems} entries
                {loading && <span className="pagination-loading"> (Loading...)</span>}
            </div>
            
            <div className="pagination-controls">
                <button
                    type="button"
                    className={`pagination-btn ${currentPage === 1 || loading ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    title="Previous page"
                >
                    <ChevronLeft size={16} />
                    Previous
                </button>

                <div className="pagination-pages">
                    {/* First page */}
                    {!visiblePages.includes(1) && (
                        <>
                            <button
                                type="button"
                                className={`pagination-page ${currentPage === 1 ? 'active' : ''} ${loading ? 'disabled' : ''}`}
                                onClick={() => handlePageChange(1)}
                                disabled={loading}
                            >
                                1
                            </button>
                            {visiblePages[0] > 2 && <span className="pagination-ellipsis">...</span>}
                        </>
                    )}

                    {/* Visible pages */}
                    {visiblePages.map(page => (
                        <button
                            key={page}
                            type="button"
                            className={`pagination-page ${currentPage === page ? 'active' : ''} ${loading ? 'disabled' : ''}`}
                            onClick={() => handlePageChange(page)}
                            disabled={loading}
                        >
                            {page}
                        </button>
                    ))}

                    {/* Last page */}
                    {!visiblePages.includes(totalPages) && (
                        <>
                            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                                <span className="pagination-ellipsis">...</span>
                            )}
                            <button
                                type="button"
                                className={`pagination-page ${currentPage === totalPages ? 'active' : ''} ${loading ? 'disabled' : ''}`}
                                onClick={() => handlePageChange(totalPages)}
                                disabled={loading}
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className={`pagination-btn ${currentPage === totalPages || loading ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    title="Next page"
                >
                    Next
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;