"use client";

import React from 'react';

const Footer: React.FC = () => {
    const socialXUrl = process.env.NEXT_PUBLIC_SOCIAL_X_URL;
    const socialXHandle = process.env.NEXT_PUBLIC_SOCIAL_X_HANDLE;

    return (
        <footer className="w-full mx-auto py-2 px-4">
            <div className="text-sm mb-2 flex flex-col justify-center items-center gap-2 text-white">
                {socialXUrl && socialXHandle && (
                    <div className="flex flex-row gap-1">
                        <span>Created by</span>
                        <a href={socialXUrl} target="_blank" rel="noopener noreferrer">{socialXHandle}</a>
                    </div>
                )}
            </div>
        </footer>
    );
};

export default Footer;
