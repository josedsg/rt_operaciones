"use client";

import { useEffect, useRef, useState } from "react";
import Select from "react-select";

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
    label?: React.ReactNode;
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

    // Find selected option object
    const selectedOption = options.find(o => o.value == value) || null;

    // React-Select expects { label, value } objects.
    // Our consumers pass `value` as primitive, but we map back and forth.
    const selectOptions = options.map(o => ({
        value: o.value,
        label: o.label, // React-select uses 'label' for display
        optionData: o // Keep original data if needed
    }));

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className={`mb-2 block uppercase tracking-widest ${labelClassName || "text-[10px] font-black text-gray-400"}`}>
                    {label}
                </label>
            )}
            <Select
                value={selectedOption ? { value: selectedOption.value, label: selectedOption.label } : null}
                onChange={(selected: any) => {
                    if (selected) {
                        onChange(selected.value);
                    } else {
                        // Handle clear if needed, for now assum no clear
                    }
                }}
                options={selectOptions}
                placeholder={placeholder}
                isDisabled={disabled}
                classNamePrefix="react-select"
                className="text-sm font-semibold"
                styles={{
                    control: (base, state) => ({
                        ...base,
                        borderColor: state.isFocused ? '#3C50E0' : '#E2E8F0',
                        boxShadow: state.isFocused ? '0 0 0 1px #3C50E0' : 'none',
                        '&:hover': {
                            borderColor: state.isFocused ? '#3C50E0' : '#E2E8F0'
                        },
                        paddingTop: '2px',
                        paddingBottom: '2px',
                        backgroundColor: disabled ? '#F1F5F9' : 'white',
                    }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? '#3C50E0' : state.isFocused ? '#F1F5F9' : 'white',
                        color: state.isSelected ? 'white' : 'black',
                        cursor: 'pointer'
                    }),
                    menu: (base) => ({
                        ...base,
                        zIndex: 9999
                    })
                }}
                formatOptionLabel={(option: any) => (
                    <div className="flex justify-between items-center">
                        <span>{option.label}</span>
                        {option.optionData?.secondaryLabel && (
                            <span className="text-[10px] opacity-50 ml-2 uppercase">
                                {option.optionData.secondaryLabel}
                            </span>
                        )}
                    </div>
                )}
            />
        </div>
    );
}
