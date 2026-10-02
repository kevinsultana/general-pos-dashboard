"use client";

import Select from "react-select";

/**
 * Custom styling Tailwind-friendly untuk React Select
 * Menyesuaikan tema soft liquid glassmorphism Omni POS
 */
const customStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: state.isDisabled ? "#f1f5f9" : "#f8fafc",
    borderColor: state.isFocused ? "#f59e0b" : "#e2e8f0",
    borderRadius: "0.75rem", // rounded-xl
    padding: "2px 4px",
    fontSize: "0.75rem", // text-xs
    fontWeight: "700",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(245, 158, 11, 0.2)" : "none",
    transition: "all 0.15s ease",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    "&:hover": {
      borderColor: state.isFocused ? "#f59e0b" : "#cbd5e1",
      backgroundColor: state.isDisabled ? "#f1f5f9" : "#ffffff",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "2px 8px",
  }),
  input: (base) => ({
    ...base,
    color: "#0f172a", // text-slate-900
    margin: 0,
    padding: 0,
  }),
  placeholder: (base) => ({
    ...base,
    color: "#94a3b8", // text-slate-400
    fontWeight: "500",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#0f172a",
    fontWeight: "700",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(16px)",
    borderRadius: "1rem", // rounded-2xl
    border: "1px solid rgba(226, 232, 240, 0.8)",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
    padding: "4px",
    zIndex: 60,
    overflow: "hidden",
  }),
  menuList: (base) => ({
    ...base,
    padding: "2px",
    maxHeight: "220px",
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: "0.5rem",
    margin: "2px 0",
    padding: "8px 12px",
    fontSize: "0.75rem",
    fontWeight: state.isSelected ? "800" : "600",
    backgroundColor: state.isSelected
      ? "#0f172a" // bg-slate-900
      : state.isFocused
      ? "#fef3c7" // bg-amber-100/50
      : "transparent",
    color: state.isSelected
      ? "#ffffff"
      : state.isFocused
      ? "#92400e" // text-amber-800
      : "#334155", // text-slate-700
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    "&:active": {
      backgroundColor: state.isSelected ? "#0f172a" : "#fde68a",
    },
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#d97706" : "#94a3b8",
    padding: "4px",
    "&:hover": {
      color: "#0f172a",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "#94a3b8",
    padding: "4px",
    "&:hover": {
      color: "#ef4444",
    },
  }),
};

export default function AppSelect({
  options = [],
  value,
  onChange,
  placeholder = "Pilih...",
  isDisabled = false,
  isClearable = false,
  isSearchable = true,
  className = "",
  instanceId,
  styles: overrideStyles = {},
  ...props
}) {
  return (
    <Select
      instanceId={instanceId || "app-select"}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isClearable={isClearable}
      isSearchable={isSearchable}
      className={className}
      styles={{
        ...customStyles,
        ...overrideStyles,
      }}
      noOptionsMessage={() => "Tidak ada pilihan"}
      {...props}
    />
  );
}
export { customStyles };
