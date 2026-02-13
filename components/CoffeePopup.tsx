"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function CoffeePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const togglePopup = () => {
    if (isOpen) {
      setIsOpen(false);
      setShowCopySuccess(false);
      return;
    }

    setIsOpen(true);
  };

  const closePopup = () => {
    setIsOpen(false);
    setShowCopySuccess(false);
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopup();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const copyAddress = () => {
    const address = process.env.NEXT_PUBLIC_CRYPTO_ADDRESS;
    if (address) {
      navigator.clipboard.writeText(address).then(() => {
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 1500);
      });
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 cursor-pointer hover:scale-110 transition-transform duration-200"
        title="Support this project"
        aria-label="Support this project"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="coffee-popup-dialog"
        onClick={togglePopup}
      >
        <Image
          src="/bmc-button.png"
          alt="Support this project"
          className="h-8 sm:h-12 w-auto shadow-lg rounded-full"
          width={172}
          height={48}
        />
      </button>

      {/* Popup Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={closePopup}
        >
          <div
            id="coffee-popup-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coffee-popup-title"
            className="bg-neutrals-card_fill_primary border border-grass-stain-green/20 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl relative text-platinum-gray"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-platinum-gray hover:text-grass-stain-green transition-colors text-xl cursor-pointer"
              onClick={closePopup}
              title="Close"
              aria-label="Close support popup"
            >
              &times;
            </button>
            <h2 id="coffee-popup-title" className="text-2xl font-bold text-grass-stain-green mb-4">
              Hi there :)
            </h2>
            <p className="text-sm leading-relaxed mb-6 text-platinum-gray">
              I hope you enjoy what you see on this page!
              <br />
              <br />
              If you would like to support my work, consider buying me an espresso (or
              two), because caffeine keeps the code alive :D
              <br />
              <br />
              You can either send a digital espresso to this EVM address or use
              the link to BuyMeACoffee below.
            </p>

            {process.env.NEXT_PUBLIC_CRYPTO_ADDRESS && (
              <div className="bg-neutrals-card_fill_secondary rounded-lg p-3 flex items-center justify-center mb-2 border border-white/5 group">
                <button
                  type="button"
                  className="font-mono text-xs text-white group-hover:text-grass-stain-green truncate cursor-pointer"
                  onClick={copyAddress}
                >
                  {process.env.NEXT_PUBLIC_CRYPTO_ADDRESS}
                </button>
              </div>
            )}

            {showCopySuccess && (
              <div className="text-xs text-grass-stain-green text-center mb-2">
                Address copied to clipboard!
              </div>
            )}

            {process.env.NEXT_PUBLIC_COFFEE_URL && (
              <div className="bg-neutrals-card_fill_secondary rounded-lg flex items-center justify-center mb-2 border border-white/5">
                <a
                  href={process.env.NEXT_PUBLIC_COFFEE_URL}
                  target="_blank"
                  className="flex w-full hover:opacity-90 transition-opacity justify-center"
                  rel="noopener noreferrer"
                >
                  <Image
                    src="/bmc-button.png"
                    alt="Support on external page"
                    className="h-12 w-auto text-white"
                    width={172}
                    height={48}
                  />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
