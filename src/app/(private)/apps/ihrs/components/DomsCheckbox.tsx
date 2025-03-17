import { FC, useState, useEffect, ChangeEvent, useMemo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  Box,
  Paper,
  Chip,
  Checkbox,
  FormGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  FormHelperText,
} from '@mui/material';
import DomsSvgIcon from '../components/DomsSvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { openDB } from 'idb';
import { DataElement, DataValuePayload } from '../types';

// Reuse the FieldStatus enum from DomsRadio
export enum FieldStatus {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  ERROR = 'error',
  WARNING = 'warning'
}

// Extended props interface for DomsCheckbox
interface DomsCheckboxProps {
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

const DomsCheckbox: FC<DomsCheckboxProps> = ({
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
  const [values, setValues] = useState<Record<string, boolean>>({});
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
  const isSingleCheckbox = !options || options.length === 0;
  const isTrueOnly = q.valueType === 'TRUE_ONLY';
  const minSelected = q.formStyles.minSelected;
  const maxSelected = q.formStyles.maxSelected;

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
          if (isSingleCheckbox) {
            // For single checkbox, use direct boolean value
            setValues({ single: existingValue.value === 'true' || existingValue.value === true });
          } else {
            // For multiple checkboxes, parse the JSON string value
            const parsedValues = typeof existingValue.value === 'string' ? 
              JSON.parse(existingValue.value) : existingValue.value;
            setValues(parsedValues);
          }
          setSubmitted(true);
        } catch (e) {
          console.error("Error parsing existing values:", e);
          setError("Error loading saved values");
        }
      }
    }
  }, [existingValues, dataElementId, isSingleCheckbox]);

  const validateInput = (checkboxValues: Record<string, boolean>): string => {
    // If required and no checkboxes are selected
    if (validationRules.required && Object.values(checkboxValues).every(v => !v)) {
      return 'At least one option must be selected';
    }

    // Check min selected constraint
    if (minSelected !== undefined && minSelected > 0) {
      const selectedCount = Object.values(checkboxValues).filter(Boolean).length;
      if (selectedCount < minSelected) {
        return `At least ${minSelected} option(s) must be selected`;
      }
    }

    // Check max selected constraint
    if (maxSelected !== undefined) {
      const selectedCount = Object.values(checkboxValues).filter(Boolean).length;
      if (selectedCount > maxSelected) {
        return `Maximum ${maxSelected} option(s) can be selected`;
      }
    }
    
    // Custom validation if provided
    if (customValidation) {
      const customError = customValidation(checkboxValues);
      if (customError) {
        return customError;
      }
    }
    
    return '';
  };

  // Handle checkbox change
  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    
    const newValues = { 
      ...values,
      [name]: checked 
    };
    
    setValues(newValues);
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
    // For single checkbox, just use the boolean value
    // For multiple checkboxes, use the JSON representation
    const stringifiedValue = isSingleCheckbox 
      ? String(values.single || false)
      : JSON.stringify(values);
    
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
    if (validationRules.required && Object.values(values).every(v => !v)) {
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
    if (Object.values(values).some(v => v) && !error && !autoSaving) {
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
        <FormLabel id={`checkbox-group-label-${dataElementId}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon()}
          {q.shortName}
        </FormLabel>
        
        {isSingleCheckbox ? (
          // Render single checkbox for TRUE_ONLY or when no options provided
          <FormControlLabel
            control={
              <Checkbox
                checked={values.single || false}
                onChange={(e) => handleCheckboxChange({ ...e, target: { ...e.target, name: 'single' } })}
                name="single"
                size={q.formStyles.fieldSize} 
                color={q.formStyles.muiColor}
                sx={{ 
                  '&.Mui-checked': { 
                    color: status === FieldStatus.ERROR ? 'error.main' : undefined 
                  } 
                }}
              />
            }
            label={q.name}
            onBlur={handleElementBlur}
          />
        ) : (
          // Render checkbox group for multiple options
          <FormGroup row={q.formStyles.row} onBlur={handleElementBlur}>
            {sortedOptions.map((option) => {
              const optionKey = option.name || option.shortName || '';
              return (
                <FormControlLabel
                  key={optionKey}
                  control={
                    <Checkbox
                      checked={values[optionKey] || false}
                      onChange={handleCheckboxChange}
                      name={optionKey}
                      size={q.formStyles.fieldSize} 
                      color={q.formStyles.muiColor}
                      sx={{ 
                        '&.Mui-checked': { 
                          color: status === FieldStatus.ERROR ? 'error.main' : undefined 
                        } 
                      }}
                    />
                  }
                  label={option.name}
                  sx={{ mb: 1 }}
                />
              );
            })}
          </FormGroup>
        )}
        
        <FormHelperText>{getHelperText()}</FormHelperText>
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

export default DomsCheckbox;