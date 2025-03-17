import { SyntheticEvent } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, { AutocompleteProps, AutocompleteChangeReason, AutocompleteChangeDetails } from '@mui/material/Autocomplete';

interface ObjectAutoCompleteSelectProps<T> extends Omit<AutocompleteProps<T, false, false, false>, 'renderInput' | 'onChange'> {
  label: string;
  id: string;
  onChange: (value: T | null) => void;
  labelField?: keyof T | string;
  valueField?: keyof T | string;
  name?: string;
  error?: boolean;
  helperText?: string;
  groupOption?: boolean;
  filterOptions?: (options: T[], state: { inputValue: string }) => T[];
}

// Add a type for grouped options
type GroupedOption<T> = T & { firstLetter: string };

/**
 * A generic autocomplete component that can be used with any object type
 * and customized label and value fields
 */
const ObjectAutoCompleteSelect = <T extends Record<string, any>>({
  options,
  value,
  onChange,
  getOptionLabel,
  isOptionEqualToValue,
  renderOption,
  label,
  id,
  labelField = 'name',
  valueField = 'id',
  error = false,
  helperText,
  groupOption = false,
  filterOptions,
  ...props
}: ObjectAutoCompleteSelectProps<T>) => {
  // Default getOptionLabel implementation if not provided
  const defaultGetOptionLabel = (option: T): string => {
    if (typeof option === 'string') return option;
    return option[labelField as keyof T]?.toString() || '';
  };

  // Default isOptionEqualToValue implementation if not provided
  const defaultIsOptionEqualToValue = (option: T, value: T): boolean => {
    if (!option || !value) return false;
    return option[valueField as keyof T] === value[valueField as keyof T];
  };

  // Process options for grouping if groupOption is true
  const processedOptions = groupOption 
    ? options.map((option) => {
        const optionLabel = (getOptionLabel || defaultGetOptionLabel)(option);
        const firstLetter = optionLabel[0]?.toUpperCase() || '';
        return {
          firstLetter: /[0-9]/.test(firstLetter) ? '0-9' : firstLetter,
          ...option,
        } as GroupedOption<T>;
      }).sort((a, b) => -b.firstLetter.localeCompare(a.firstLetter)) 
    : options;
  
  // Default filter options function if not provided
  const defaultFilterOptions = (options: Array<T | GroupedOption<T>>, { inputValue }: { inputValue: string }): Array<T | GroupedOption<T>> => {
    const getLabel = getOptionLabel || defaultGetOptionLabel;
    const searchText = inputValue.toLowerCase().trim();
    
    return options.filter(option => {
      // For grouped options, we need to handle differently
      if ('firstLetter' in option && groupOption) {
        const optCopy = { ...option };
        delete (optCopy as any).firstLetter;
        return getLabel(optCopy as T).toLowerCase().includes(searchText);
      } 
      return getLabel(option as T).toLowerCase().includes(searchText);
    });
  };

  return (
    <Autocomplete
      options={processedOptions as any}
      {...(groupOption && { 
        groupBy: (option: any) => option.firstLetter 
      })}
      autoHighlight
      blurOnSelect
      disablePortal
      id={id}
      value={value}
      onChange={(
        event: SyntheticEvent, 
        v: T | null, 
        reason: AutocompleteChangeReason, 
        details?: AutocompleteChangeDetails<T>
      ) => {
        onChange(v);
      }}
      getOptionLabel={(option: any) => {
        if (groupOption && typeof option === 'object' && option !== null && 'firstLetter' in option) {
          const optCopy = { ...option };
          delete optCopy.firstLetter;
          return (getOptionLabel || defaultGetOptionLabel)(optCopy as T);
        }
        return (getOptionLabel || defaultGetOptionLabel)(option as T);
      }}
      isOptionEqualToValue={isOptionEqualToValue || defaultIsOptionEqualToValue}
      filterOptions={filterOptions || (defaultFilterOptions as any)}
      renderOption={renderOption}
      renderInput={(params) => (
        <TextField 
          {...params} 
          label={label} 
          error={error}
          helperText={helperText}
        />
      )}
      {...props}
    />
  );
};

export default ObjectAutoCompleteSelect;