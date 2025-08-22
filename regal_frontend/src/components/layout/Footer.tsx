import React from 'react';
import './Footer.css';

// Define the props for the component
interface FooterProps {
  theme?: 'light' | 'default'; // 'default' will be the grey, 'light' will be white
}

const Footer: React.FC<FooterProps> = ({ theme = 'default' }) => {
    // Conditionally apply a class based on the theme prop
    const themeClass = theme === 'light' ? 'light-theme' : '';

    return (
        <div className={`footer-container ${themeClass}`}>
            <p>© 2025 Regal Wealth Advisors. All Rights Reserved. | <a href="#">Privacy Policy</a> | <a href="#">Contact Us</a></p>      
        </div>
    );
};

export default Footer;
