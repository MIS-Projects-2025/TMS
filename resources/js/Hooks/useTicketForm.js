import { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";

export const useTicketForm = () => {
    const {
        emp_data,
        request_types,
        hardware_options,
        printer_options,
        promis_options,
    } = usePage().props;

    const [selectedType, setSelectedType] = useState("");
    const [selectedOption, setSelectedOption] = useState("");
    const [selectedItem, setSelectedItem] = useState("");
    const [hasDataOptions, setHasDataOptions] = useState({});

    // Kunin ang value ng has_data mula sa request_types
    useEffect(() => {
        const hasDataMap = {};
        if (request_types) {
            Object.keys(request_types).forEach((category) => {
                request_types[category].forEach((option) => {
                    hasDataMap[option] = determineIfHasData(category, option);
                });
            });
        }
        setHasDataOptions(hasDataMap);
    }, [request_types]);

    // Function para malaman kung ang isang option ay may kaugnay na data
    const determineIfHasData = (category, option) => {
        if (category === "Hardware" && hardware_options[option]) return true;
        if (category === "Printer" && printer_options[option]) return true;
        if (category === "Promis" && promis_options[option]) return true;
        return false;
    };

    // Dynamic na handleChange function
    const handleChange = (field, value) => {
        switch (field) {
            case "type":
                setSelectedType(value);
                setSelectedOption("");
                setSelectedItem("");
                break;
            case "option":
                setSelectedOption(value);
                setSelectedItem("");
                break;
            case "item":
                setSelectedItem(value);
                break;
            default:
                break;
        }
    };

    // Kunin ang mga item options base sa selected type at option
    const getItemOptions = () => {
        if (selectedType === "Network") return null;

        if (selectedType === "Hardware" && hardware_options[selectedOption]) {
            return hardware_options[selectedOption];
        }
        if (selectedType === "Printer" && printer_options[selectedOption]) {
            return printer_options[selectedOption];
        }
        if (selectedType === "Promis" && promis_options[selectedOption]) {
            return promis_options[selectedOption];
        }

        return null;
    };

    const itemOptions = getItemOptions();
    const showItemSelect = itemOptions && itemOptions.length > 0;

    // Alamin ang label base sa type at option
    const getItemLabel = () => {
        if (selectedType === "Hardware") return `${selectedOption} Name`;
        if (selectedType === "Printer") return "Printer Name";
        if (selectedType === "Promis") return "Terminal Name";
        return "Item Name";
    };

    // Tiga check kung kailangan ipakita ang custom input field
    const showCustomInput =
        (showItemSelect && selectedItem === "Others") ||
        (!showItemSelect && selectedOption && selectedOption !== "");

    return {
        emp_data,
        request_types,
        selectedType,
        selectedOption,
        selectedItem,
        itemOptions,
        showItemSelect,
        showCustomInput,
        handleChange,
        getItemLabel,
    };
};
