import React from 'react';

export default function LogoToko({ src, alt = 'Logo toko', className = '', style }) {
    return (
        <img
            src={src || '/images/logo-tokokita.jpg'}
            alt={alt}
            className={className}
            style={style}
        />
    );
}
