import React from 'react';

const Pro: React.FC = () => {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            <div
                style={{
                    background: 'rgba(255,255,255,0.85)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(60, 60, 90, 0.08)',
                    padding: '48px 32px',
                    maxWidth: '400px',
                    textAlign: 'center',
                }}
            >
                <h1
                    style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        marginBottom: '16px',
                        color: '#22223b',
                    }}
                >
                    GlycoShape Pro
                </h1>
                <p
                    style={{
                        fontSize: '1.25rem',
                        color: '#4a4e69',
                        marginBottom: '32px',
                        fontWeight: 500,
                    }}
                >
                    Coming soon.
                </p>
                <div
                    style={{
                        height: '4px',
                        width: '80px',
                        margin: '0 auto',
                        background: 'linear-gradient(90deg, #9a8c98 0%, #c9ada7 100%)',
                        borderRadius: '2px',
                    }}
                />
            </div>
        </div>
    );
};

export default Pro;