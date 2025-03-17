import { FC, useState, useEffect, useMemo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  Box,
  Paper,
  Chip,
  TextField,
  Autocomplete,
  Checkbox,
  FormControl,
  FormLabel,
  FormHelperText,
} from '@mui/material';
import DomsSvgIcon from '../components/DomsSvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { openDB } from 'idb';
import { DataElement, DataValuePayload } from '../types';

// Reuse the FieldStatus enum from DomsCheckbox
export enum FieldStatus {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  ERROR = 'error',
  WARNING = 'warning'
}

// Extended props interface for DomsCheckboxAutocomplete
interface DomsCheckboxAutocompleteProps {
  q: DataElement;
  dataSet: string;
  period: string;
  source: string;
  onSave?: (data: any) => Promise<{ success: boolean }>;
  existingValues?: any[];
  onValuesUpdate?: (values: any[]) => void;
  readOnly?: boolean;
  customValidation?: (value: any) => string | null;
  onValidationStateChange?: (isValid: boolean) => void;
  onChange?: (value: any) => void;
  onBlur?: () => void;
}

const DomsCheckboxAutocomplete: FC<DomsCheckboxAutocompleteProps> = ({
  q,
  dataSet,
  period,
  source,
  onSave,
  existingValues = [],
  onValuesUpdate,
  readOnly = false,
  customValidation,
  onValidationStateChange,
  onChange,
  onBlur
}) => {
  // States for managing form data and submission status
  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [status, setStatus] = useState<FieldStatus>(FieldStatus.IDLE);
  const [error, setError] = useState<string>('');
  const [autoSaving, setAutoSaving] = useState<boolean>(false);
  
  const dataElementId = q.uid;
  const validationRules = q.validationRules || {};
  const showSubmitIndicator = q.showSubmitIndicator ?? true;
  const disableAnimation = q.disableAnimation || false;
  const autoSaveDelay = q.autoSaveDelay || 400;
  const options = q.optionSet?.options || [];
  const minSelected = q.formStyles.minSelected;
  const maxSelected = q.formStyles.maxSelected;
  
  // Additional props for Autocomplete
  const limitTags = q.formStyles.limitTags || 2;
  const autoHighlight = q.formStyles.autoHighlight || false;
  const autoComplete = q.formStyles.autoComplete || false;
  const disableCloseOnSelect = q.formStyles.disableCloseOnSelect !== false;
  const placeholder = q.formStyles.placeholder || 'Select options...';

  // Checkbox icon components
  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;

  // Initialize IndexedDB
  useEffect(() => {
    const initIndexedDB = async () => {
      try {
        await openDB('dataorb-db', 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('dataValues')) {
              db.createObjectStore('dataValues', { keyPath: 'uuid' });
            }
          },
        });
        console.log('IndexedDB initialized successfully');
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
      }
    };
    
    initIndexedDB();
  }, []);

  // Initialize values from existingValues
  useEffect(() => {
    if (existingValues && existingValues.length > 0) {
      const existingValue = existingValues.find(v => v.dataElement === dataElementId);
      if (existingValue) {
        try {
          // Parse the JSON string value
          const parsedValues = typeof existingValue.value === 'string' ? 
            JSON.parse(existingValue.value) : existingValue.value;
          
          // Convert to array of selected options
          if (Array.isArray(parsedValues)) {
            setSelectedOptions(parsedValues);
          } else if (typeof parsedValues === 'object') {
            // Handle case where values are stored as {optionName: boolean}
            const selectedOpts = options.filter(opt => {
              const optionKey = opt.name || opt.shortName || '';
              return parsedValues[optionKey];
            });
            setSelectedOptions(selectedOpts);
          }
          setSubmitted(true);
        } catch (e) {
          console.error("Error parsing existing values:", e);
          setError("Error loading saved values");
        }
      }
    }
  }, [existingValues, dataElementId, options]);

  const validateInput = (selected: any[]): string => {
    // If required and no options are selected
    if (validationRules.required && (!selected || selected.length === 0)) {
      return 'At least one option must be selected';
    }

    // Check min selected constraint
    if (minSelected !== undefined && minSelected > 0) {
      if (selected.length < minSelected) {
        return `At least ${minSelected} option(s) must be selected`;
      }
    }

    // Check max selected constraint
    if (maxSelected !== undefined) {
      if (selected.length > maxSelected) {
        return `Maximum ${maxSelected} option(s) can be selected`;
      }
    }
    
    // Custom validation if provided
    if (customValidation) {
      const customError = customValidation(selected);
      if (customError) {
        return customError;
      }
    }
    
    return '';
  };

  // Handle checkbox selection change
  const handleChange = (_event: React.SyntheticEvent, newValues: any[]) => {
    setSelectedOptions(newValues);
    setStatus(FieldStatus.IDLE);
    
    // Run validation
    const validationError = validateInput(newValues);
    setError(validationError);
    
    if (onValidationStateChange) {
      onValidationStateChange(!validationError);
    }
    
    if (onChange) {
      onChange(newValues);
    }
  };

  const preparePayload = (): DataValuePayload => {
    // Store selected options - keeping the full object for display purposes
    const stringifiedValue = JSON.stringify(selectedOptions);
    
    return {
      source: source || localStorage.getItem('selected-org') || '',
      period: period || localStorage.getItem('selected-period') || '',
      dataElement: dataElementId,
      categoryOptionCombo: q.categoryCombo?.id || 'HllvX50cXC0',
      attributeOptionCombo: '',
      value: stringifiedValue,
      comment: 'ok',
      followup: false,
      date: new Date(),
    };
  };

  // Handle saving data
  const handleSaveData = async () => {
    if (error) {
      setStatus(FieldStatus.ERROR);
      return;
    }
    
    // If required and no values selected, don't save
    if (validationRules.required && selectedOptions.length === 0) {
      setStatus(FieldStatus.ERROR);
      setError('At least one option must be selected');
      return;
    }
    
    try {
      setStatus(FieldStatus.SAVING);
      
      const effectiveSource = source || localStorage.getItem('selected-org') || '';
      const effectivePeriod = period || localStorage.getItem('selected-period') || '';
      
      if (!effectiveSource || !effectivePeriod) {
        throw new Error('Missing required source ID or period');
      }
      
      // Prepare payload
      const valuePayload = preparePayload();
      
      // Update local values
      const updatedValues = [
        ...(existingValues || []).filter(v => v.dataElement !== dataElementId),
        valuePayload
      ];
      
      // Notify parent component of values update
      if (onValuesUpdate) {
        onValuesUpdate(updatedValues);
      }
      
      // Store in localStorage as backup
      try {
        localStorage.setItem(`form-data-${dataElementId}`, JSON.stringify(valuePayload));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      
      // Store in IndexedDB
      try {
        const db = await openDB('dataorb-db', 1);
        const tx = db.transaction('dataValues', 'readwrite');
        await tx.store.put(valuePayload);
        await tx.done;
      } catch (dbError) {
        console.error('IndexedDB save error:', dbError);
      }
      
      // Try to save to server
      if (onSave) {
        try {
          const response = await onSave(valuePayload);
          if (response.success) {
            setSubmitted(true);
            setStatus(FieldStatus.SAVED);
          }
        } catch (serverError) {
          console.error('Error saving to server, keeping in IndexedDB for later sync:', serverError);
          setStatus(FieldStatus.WARNING);
          setError('Saved locally, will sync later');
        }
      } else {
        // Mark as saved even without server save
        setSubmitted(true);
        setStatus(FieldStatus.SAVED);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setStatus(FieldStatus.ERROR);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Handle blur event for auto-saving
  const handleElementBlur = () => {
    // Only autosave if there's at least one value selected and no errors
    if (selectedOptions.length > 0 && !error && !autoSaving) {
      setAutoSaving(true);
      
      // Add delay before auto-saving
      setTimeout(() => {
        handleSaveData().finally(() => {
          setAutoSaving(false);
        });
      }, autoSaveDelay);
    }
    
    // Call parent onBlur if provided
    if (onBlur) {
      onBlur();
    }
  };

  // Get helper text
  const getHelperText = (): string => {
    if (q.formStyles.helpText) return q.formStyles.helpText;
    if (error) return error;
    if (autoSaving) return "Auto-saving...";
    if (status === FieldStatus.SAVING) return "Saving...";
    if (status === FieldStatus.SAVED) return "Saved";
    if (status === FieldStatus.WARNING) return "Saved locally, will sync later";
    return "";
  };

  // Get status icon
  const getStatusIcon = (): ReactNode => {
    switch (status) {
      case FieldStatus.SAVED:
        return <CheckCircleIcon color="success" />;
      case FieldStatus.ERROR:
        return <ErrorIcon color="error" />;
      case FieldStatus.WARNING:
        return <WarningIcon color="warning" />;
      case FieldStatus.IDLE:
        return q.iconText ? 
          <DomsSvgIcon>{q.iconText}</DomsSvgIcon> : 
          <DomsSvgIcon>material-outline:check_box</DomsSvgIcon>;
      default:
        return null;
    }
  };

  const titleDescription = (
    <Box sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
      {q.name}
    </Box>
  );

  const sortedOptions = useMemo(() => {
    if (!options || options.length === 0) {
      return [];
    }
    
    return [...options].sort((a, b) => {
      // Handle cases where sortOrder might be undefined
      const sortOrderA = typeof a.sortOrder === 'number' ? a.sortOrder : Infinity;
      const sortOrderB = typeof b.sortOrder === 'number' ? b.sortOrder : Infinity;
      
      return sortOrderA - sortOrderB;
    });
  }, [options]);

  // Render component content
  const content = (
    <Box 
      sx={{ 
        p: showSubmitIndicator ? 2 : 0, 
        bgcolor: submitted && showSubmitIndicator ? '#f0f7f0' : 'transparent',
        border: submitted && showSubmitIndicator ? '1px solid #c8e6c9' : 'none',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: showSubmitIndicator ? 2 : 0 }}>
        {showSubmitIndicator && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {submitted && (
              <Chip 
                icon={<CheckCircleIcon />} 
                label="Submitted" 
                color="success" 
                size="small" 
              />
            )}
          </Box>
        )}
      </Box>
      {titleDescription}
      
      <FormControl 
        component="fieldset" 
        error={status === FieldStatus.ERROR}
        disabled={readOnly || status === FieldStatus.SAVING || autoSaving}
        required={validationRules.required}
        fullWidth
      >
        <FormLabel id={`checkbox-autocomplete-label-${dataElementId}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon()}
          {q.shortName}
        </FormLabel>
        
        <Autocomplete
          multiple
          id={`checkbox-autocomplete-${dataElementId}`}
          options={sortedOptions}
          disableCloseOnSelect={disableCloseOnSelect}
          autoHighlight={autoHighlight}
          autoComplete={autoComplete}
          limitTags={limitTags}
          value={selectedOptions}
          onChange={handleChange}
          onBlur={handleElementBlur}
          getOptionLabel={(option) => option.name || option.shortName || ''}
          isOptionEqualToValue={(option, value) => 
            option.id === value.id || 
            option.name === value.name || 
            option.shortName === value.shortName
          }
          renderOption={(props, option, { selected }) => {
            // Extract key from props and spread the rest
            const { key, ...restProps } = props as any;
            return (
              <li key={option.id || option.name} {...restProps}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                  size={q.formStyles.fieldSize}
                  color={q.formStyles.muiColor}
                />
                {option.name}
              </li>
            );
          }}
          size={q.formStyles.fieldSize || "medium"}
          renderInput={(params) => (
            <TextField
              {...params}
              label={q.shortName}
              placeholder={placeholder}
              error={status === FieldStatus.ERROR}
              variant={q.formStyles.variant || "outlined"}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {status === FieldStatus.SAVING && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <DomsSvgIcon>material-outline:loop</DomsSvgIcon>
                      </Box>
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: status === FieldStatus.ERROR 
                      ? 'error.main' 
                      : status === FieldStatus.SAVED 
                        ? 'success.main' 
                        : undefined,
                    borderWidth: status !== FieldStatus.IDLE ? 2 : 1,
                  },
                },
                ...(q.formStyles.sx?.textField || {})
              }}
            />
          )}
        />
        
        <FormHelperText
          error={status === FieldStatus.ERROR}
          sx={{
            color: status === FieldStatus.SAVED ? 'success.main' : 
                  status === FieldStatus.WARNING ? 'warning.main' : undefined
          }}
        >
          {getHelperText()}
        </FormHelperText>
      </FormControl>
    </Box>
  );

  // Return without animations if disabled
  if (disableAnimation) {
    return (
      <Paper
        sx={{ 
          p: 4, 
          borderRadius: 2, 
          boxShadow: 2, 
          bgcolor: 'white', 
          mb: 4,
          ...(q.formStyles.sx?.paper || {})
        }}
      >
        {content}
      </Paper>
    );
  }

  // Return with animations
  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{ 
        p: 4, 
        borderRadius: 2, 
        boxShadow: 2, 
        bgcolor: 'white', 
        mb: 4,
        ...(q.formStyles.sx?.paper || {})
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    </Paper>
  );
};

export default DomsCheckboxAutocomplete;