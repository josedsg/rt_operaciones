"use client";

import { useEffect, useRef, useState } from "react";

interface Option {
    value: string | number;
    label: string;
    secondaryLabel?: string;
}

interface ComboboxProps {
    options: Option[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    label?: React.ReactNode; // Optional label for accessibility/display
    labelClassName?: string;
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Select...",
    disabled = false,
    className = "",
    label,
    labelClassName
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update search term when value changes externally (to show selected label)
    useEffect(() => {
        const selected = options.find(o => o.value == value); // loose equality for string/number
        if (selected) {
            setSearchTerm(selected.label);
        } else if (!isOpen) { // Only clear if closed, to avoid clearing while typing
            // If value is 0 or empty, clear search
            if (!value) setSearchTerm("");
        }
    }, [value, options]); // Removed isOpen to prevent conflict behavior

    // Filter options
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.secondaryLabel && option.secondaryLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Reset highlighted index when filtered options change
    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchTerm]);

    const handleSelect = (option: Option) => {
        onChange(option.value);
        setSearchTerm(option.label);
        setIsOpen(false);
    };

    const handleFocus = () => {
        if (!disabled) {
            setIsOpen(true);
            // Optional: clear search on focus to show full list? 
            // Better behavior: Select text so user can overwrite easily
            inputRef.current?.select();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                // Scroll into view logic could go here
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case "Enter":
                e.preventDefault();
                if (filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex]);
                }
                break;
            case "Escape":
                e.preventDefault();
                setIsOpen(false);
                break;
            case "Tab":
                setIsOpen(false);
                break;
        }
    };

    // Scroll to highlighted item
    useEffect(() => {
        if (isOpen && listRef.current) {
            const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: "nearest" });
            }
        }
    }, [highlightedIndex, isOpen]);


    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className={`mb-2 block uppercase tracking-widest ${labelClassName || "text-[10px] font-black text-gray-400"}`}>
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-4 pr-10 dark:bg-meta-4 dark:border-strokedark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold text-sm disabled:cursor-not-allowed disabled:bg-gray-200 dark:disabled:bg-boxdark-2"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                        // If user clears input, emit 0/empty?
                        // For now, allow typing without emitting until selection? 
                        // Or emit null if empty? Let's keep it simple: selection required.
                    }}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && !disabled && (
                <div
                    ref={listRef}
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-stroke bg-white py-1 shadow-lg dark:border-strokedark dark:bg-boxdark"
                >
                    {filteredOptions.length === 0 ? (
                        <div className="py-2 px-4 text-sm text-gray-500">No hay resultados</div>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option)}
                                className={`cursor-pointer py-2 px-4 text-sm transition-colors ${index === highlightedIndex ? "bg-primary text-white" :
                                        option.value == value ? "bg-gray-100 dark:bg-meta-4 font-bold text-black dark:text-white" : "text-black dark:text-white hover:bg-gray-50 dark:hover:bg-meta-4"
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span>{option.label}</span>
                                    {option.secondaryLabel && (
                                        <span className={`text-[10px] uppercase opacity-70 ${index === highlightedIndex ? "text-white/80" :
                                                option.value == value ? "text-gray-500" : "text-gray-500"
                                            }`}>
                                            {option.secondaryLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
