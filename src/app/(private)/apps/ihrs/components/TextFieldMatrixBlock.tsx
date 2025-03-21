import { FC, useState, useEffect, ChangeEvent, useMemo, Fragment } from 'react';
import { motion } from 'framer-motion';
import { 
  TextField,
  InputAdornment,
  Box,
  Paper,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  CircularProgress,
  TextFieldProps,
  IconButton,
  useMediaQuery,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Divider,
  Grid
} from '@mui/material';
import DomsSvgIcon from './DomsSvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { DataElement, ValueType, CategoryOptionCombo, FieldStatus } from '../types';

// Helper types to manage aggregated data
type CategoryMatrix = {
  rows: string[]; // e.g., "0-1 year", "1-5 years"
  columns: string[]; // e.g., "Female", "Male"
};

// Adapted from DomsTextBlock's DataValuePayload
interface DataValuePayload {
  source: string;
  period: string;
  dataElement: string;
  categoryOptionCombo: string;
  attributeOptionCombo: string;
  value: string;
  comment: string;
  followup: boolean;
  date: Date;
}

interface TextFieldMatrixBlockProps {
  q: DataElement;
  coc: CategoryOptionCombo[];
  dataSet: string;
  period: string;
  source: string;
  onSubmit?: (data: string, dataElement: string, categoryOptionCombo: string) => Promise<{ success: boolean }>;
  existingValues?: any[];
  onValuesUpdate?: (values: any[]) => void;
  readOnly?: boolean;
  customValidation?: (value: any) => string | null;
  onValidationStateChange?: (isValid: boolean) => void;
}

const TextFieldMatrixBlock: FC<TextFieldMatrixBlockProps> = ({
  q,
  coc,
  period,
  source,
  onSubmit,
  existingValues = [],
  onValuesUpdate,
  readOnly = false,
  customValidation,
  onValidationStateChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // States for managing form data and submission status
  const [matrix, setMatrix] = useState<CategoryMatrix>({ rows: [], columns: [] });
  const [values, setValues] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, FieldStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSaving, setAutoSaving] = useState<Record<string, boolean>>({});
  const [submittedCombos, setSubmittedCombos] = useState<string[]>([]);
  
  const dataElementId = q.uid;
  const valueType = q.valueType || ValueType.TEXT;
  const validationRules = q.validationRules || {};
  const autoSaveDelay = q.autoSaveDelay || 400;

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isComponentCollapsed, setIsComponentCollapsed] = useState(false);

  // Initialize values from existingValues and sessionStorage
  useEffect(() => {
    // Then merge with existingValues if available
    if (existingValues && existingValues.length > 0) {
      const newValues: Record<string, string> = { ...values };
      const newStatuses: Record<string, FieldStatus> = { ...statuses };
      const newSubmittedCombos: string[] = [...submittedCombos];

      existingValues.forEach(val => {
        if (val.dataElement === dataElementId) {
          // Only update if not already set from sessionStorage
          if (!newValues[val.categoryOptionCombo]) {
            newValues[val.categoryOptionCombo] = val.value;
            newStatuses[val.categoryOptionCombo] = FieldStatus.SAVED;
            
            if (!newSubmittedCombos.includes(val.categoryOptionCombo)) {
              newSubmittedCombos.push(val.categoryOptionCombo);
            }
          }
        }
      });

      setValues(newValues);
      setStatuses(newStatuses);
      setSubmittedCombos(newSubmittedCombos);
    }
  }, [existingValues, dataElementId]);

  // Parse category option combos to create a matrix for display
  useEffect(() => {
    const rowValues = new Set<string>();
    const colValues = new Set<string>();

    coc.forEach(c => {
      const parts = c.name.split(',').map(part => part.trim());
      if (parts.length >= 2) {
        // Columns are gender (parts[0]), rows are age categories (parts[1])
        colValues.add(parts[0]); // e.g., "Female"
        rowValues.add(parts[1]); // e.g., "0-1 year"
      }
    });

    setMatrix({
      rows: Array.from(rowValues),
      columns: Array.from(colValues)
    });
    
    // Initialize expanded state for each row (default to expanded on mobile)
    const initialExpandedState: Record<string, boolean> = {};
    Array.from(rowValues).forEach(row => {
      initialExpandedState[row] = isMobile;
    });
    setExpandedRows(initialExpandedState);
  }, [coc, isMobile]);

  // Get input type based on valueType (copied from DomsTextBlock)
  const getInputType = useMemo(() => {
    switch (valueType) {
      case ValueType.NUMBER:
      case ValueType.INTEGER:
      case ValueType.INTEGER_POSITIVE:
      case ValueType.INTEGER_NEGATIVE:
      case ValueType.INTEGER_ZERO_OR_POSITIVE:
      case ValueType.PERCENTAGE:
        return 'number';
      default:
        return 'text';
    }
  }, [valueType]);

  // Get input props based on valueType (copied from DomsTextBlock)
  const getInputProps = useMemo(() => {
    const props: any = {};
    
    switch (valueType) {
      case ValueType.INTEGER:
        props.step = 1;
        props.inputMode = 'numeric';
        break;
      case ValueType.INTEGER_POSITIVE:
        props.step = 1;
        props.min = 1;
        props.inputMode = 'numeric';
        break;
      case ValueType.INTEGER_NEGATIVE:
        props.step = 1;
        props.max = -1;
        props.inputMode = 'numeric';
        break;
      case ValueType.INTEGER_ZERO_OR_POSITIVE:
        props.step = 1;
        props.min = 0;
        props.inputMode = 'numeric';
        break;
      case ValueType.PERCENTAGE:
        props.step = 1;
        props.min = 0;
        props.max = 100;
        props.inputMode = 'numeric';
        break;
      default:
        break;
    }
    
    return props;
  }, [valueType]);

  // Validate input based on valueType and validationRules (adapted from DomsTextBlock)
  const validateInput = (input: any): string => {
    // If empty and required
    if ((input === '' || input === null || input === undefined) && validationRules.required) {
      return 'This field is required';
    }

    // Type-specific validation
    switch (valueType) {
      case ValueType.INTEGER:
      case ValueType.INTEGER_POSITIVE:
      case ValueType.INTEGER_NEGATIVE:
      case ValueType.INTEGER_ZERO_OR_POSITIVE:
      case ValueType.NUMBER:
        if (input !== '' && isNaN(Number(input))) {
          return 'Please enter a valid number';
        }
        
        const num = Number(input);
        
        if (validationRules.min !== undefined && validationRules.min !== null && num < validationRules.min) {
          return `Value must be at least ${validationRules.min}`;
        }
        
        if (validationRules.max !== undefined && validationRules.max !== null && num > validationRules.max) {
          return `Value must be at most ${validationRules.max}`;
        }
        
        if (valueType === ValueType.INTEGER_POSITIVE && num <= 0) {
          return 'Value must be a positive integer';
        }
        
        if (valueType === ValueType.INTEGER_NEGATIVE && num >= 0) {
          return 'Value must be a negative integer';
        }
        
        if (valueType === ValueType.INTEGER_ZERO_OR_POSITIVE && num < 0) {
          return 'Value must be zero or a positive integer';
        }
        break;
      default:
        break;
    }
    
    // Regex validation if provided
    if (validationRules.regex && input) {
      const regex = new RegExp(validationRules.regex);
      if (!regex.test(input)) {
        return validationRules.errorMessage || 'Invalid format';
      }
    }
    
    // Custom validation if provided
    if (customValidation) {
      const customError = customValidation(input);
      if (customError) {
        return customError;
      }
    }
    
    return '';
  };

  // Find the specific categoryOptionCombo based on gender and age
  const findCategoryOptionCombo = (
    rowValue: string, // Age category
    colValue: string  // Gender
  ): CategoryOptionCombo | undefined => {
    if (!coc) return undefined;
    
    // Searching for exact match with the exact format "gender, age"
    const exactMatch = coc.find(c => 
      c.name === `${colValue}, ${rowValue}`
    );
    
    if (exactMatch) return exactMatch;
    
    // If no exact match found, let's try a more flexible approach
    return coc.find(c => {
      const parts = c.name.split(',').map(part => part.trim());
      return parts.length >= 2 && 
             parts[0] === colValue && 
             parts[1] === rowValue;
    });
  };

  // Handle saving data for a specific cell
  const handleSaveData = async (cocId: string) => {
    const currentValue = values[cocId] || '';
    
    // Skip save if there's validation error
    if (errors[cocId]) {
      const newStatuses = { ...statuses, [cocId]: FieldStatus.ERROR };
      setStatuses(newStatuses);
      
      return;
    }
    
    // Skip save if value is empty and not required
    if ((currentValue === '' || currentValue === null || currentValue === undefined) && !validationRules.required) {
      const newStatuses = { ...statuses, [cocId]: FieldStatus.IDLE };
      setStatuses(newStatuses);
  
      return;
    }
    
    try {
      const newStatuses = { ...statuses, [cocId]: FieldStatus.SAVING };
      setStatuses(newStatuses);
      
      // Try to save to server
      if (onSubmit) {
        try {
          const response = await onSubmit(currentValue, dataElementId, cocId);
          
          if (response.success) {
            // Create new arrays/objects instead of modifying existing ones
            const newSubmittedCombos = [...submittedCombos.filter(id => id !== cocId), cocId];
            const newStatuses = { ...statuses, [cocId]: FieldStatus.SAVED };
            
            setSubmittedCombos(newSubmittedCombos);
            setStatuses(newStatuses);
          }
        } catch (serverError) {
          console.error('Error saving to server, keeping in IndexedDB for later sync:', serverError);
          const newStatuses = { ...statuses, [cocId]: FieldStatus.WARNING };
          const newErrors = { ...errors, [cocId]: 'Saved locally, will sync later' };
          
          setStatuses(newStatuses);
          setErrors(newErrors);
        }
      } else {
        // Mark as saved even without server save
        const newSubmittedCombos = [...submittedCombos.filter(id => id !== cocId), cocId];
        const newStatuses = { ...statuses, [cocId]: FieldStatus.SAVED };
        
        setSubmittedCombos(newSubmittedCombos);
        setStatuses(newStatuses);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      const newStatuses = { ...statuses, [cocId]: FieldStatus.ERROR };
      const newErrors = { 
        ...errors, 
        [cocId]: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setStatuses(newStatuses);
      setErrors(newErrors);
    }
  };
  // Handle input change for a specific cell
  const handleInputChange = (cocId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const newValues = { ...values, [cocId]: newValue };
    
    // Update value
    setValues(newValues);
    
    // Set status to IDLE
    const newStatuses = { ...statuses, [cocId]: FieldStatus.IDLE };
    setStatuses(newStatuses);
    
    // Run validation
    const validationError = validateInput(newValue);
    let newErrors = { ...errors };
    
    if (validationError) {
      newErrors = { ...newErrors, [cocId]: validationError };
      setErrors(newErrors);
      // Notify parent about validation state
      if (onValidationStateChange) {
        onValidationStateChange(false);
      }
    } else {
      delete newErrors[cocId];
      setErrors(newErrors);
      // Notify parent about validation state
      if (onValidationStateChange) {
        onValidationStateChange(true);
      }
    }
  };

  // Handle blur event for auto-saving
  const handleBlur = (cocId: string) => () => {
    const currentValue = values[cocId] || '';
    
    // Only autosave if there's a value and no errors
    if (currentValue && !errors[cocId] && !autoSaving[cocId]) {
      const newAutoSaving = { ...autoSaving, [cocId]: true };
      setAutoSaving(newAutoSaving);
      
      // Add delay before auto-saving
      setTimeout(() => {
        handleSaveData(cocId).finally(() => {
          setAutoSaving(prev => {
            const newState = { ...prev };
            delete newState[cocId];
            return newState;
          });
        });
      }, autoSaveDelay);
    }
  };

  const toggleRowExpand = (row: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [row]: !prev[row]
    }));
  };

  // Toggle overall component collapse
  const toggleComponentCollapse = () => {
    setIsComponentCollapsed(!isComponentCollapsed);
  };

  // Get status icon for a specific cell
  const getStatusIcon = (cocId: string) => {
    switch (statuses[cocId]) {
      case FieldStatus.SAVED:
        return <CheckCircleIcon color="success" fontSize="small" />;
      case FieldStatus.ERROR:
        return <ErrorIcon color="error" fontSize="small" />;
      case FieldStatus.WARNING:
        return <WarningIcon color="warning" fontSize="small" />;
      case FieldStatus.IDLE:
        if (q.iconText) {
          return <DomsSvgIcon>{q.iconText}</DomsSvgIcon>;
        } else {
          return <DomsSvgIcon>material-outline:edit</DomsSvgIcon>;
        }
      case FieldStatus.SAVING:
        return <CircularProgress size={16} />;
      default:
        return null;
    }
  };

  // Render a specific input field within the matrix
  const renderCellInputField = (cocId: string, rowLabel: string, columnLabel: string) => {
    const currentValue = values[cocId] || '';
    const isSaving = statuses[cocId] === FieldStatus.SAVING || autoSaving[cocId];
    const hasError = !!errors[cocId];

    const startAdornment = (
      <InputAdornment position="start">
        {getStatusIcon(cocId)}
      </InputAdornment>
    );
    
    // For percentage type, create end adornment
    const endAdornment = valueType === ValueType.PERCENTAGE ? (
      <InputAdornment position="end">%</InputAdornment>
    ) : undefined;

    // Get helper text for a specific cell
    const getHelperText = (cocId: string): string => {
      if (errors[cocId]) return errors[cocId];
      if (autoSaving[cocId]) return "Auto-saving...";
      if (statuses[cocId] === FieldStatus.SAVING) return "Saving...";
      if (statuses[cocId] === FieldStatus.SAVED) return "Saved";
      if (statuses[cocId] === FieldStatus.WARNING) return "Saved locally, will sync later";
      return "";
    };
  
    const textFieldProps: TextFieldProps = {
      id: `input-${cocId}`,
      name: dataElementId,
      fullWidth: true,
      variant: q.formStyles?.variant || 'outlined',
      size: q.formStyles?.fieldSize || 'small',
      label: isMobile ? `${columnLabel}` : q.shortName,
      placeholder: q.formStyles?.placeholder || `Enter ${q.shortName}`,
      type: getInputType,
      value: currentValue,
      onChange: handleInputChange(cocId),
      onBlur: handleBlur(cocId),
      error: hasError,
      helperText: getHelperText(cocId),
      disabled: readOnly || isSaving,
      required: validationRules.required,
      sx: { 
        bgcolor: 'white',
        ...(q.formStyles?.sx || {})
      },
      InputProps: {
        startAdornment,
        endAdornment,
        ...getInputProps
      }
    };
    
    return (
      <Box sx={{ position: 'relative' }}>
        <TextField {...textFieldProps} />
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mt: 0.5
        }}>
          {getHelperText(cocId) && (
            <Typography variant="caption" color={hasError ? "error" : "text.secondary"}>
              {getHelperText(cocId)}
            </Typography>
          )}
          
          {!isSaving && getStatusIcon(cocId) && (
            <Box sx={{ ml: 'auto' }}>
              {getStatusIcon(cocId)}
            </Box>
          )}
          
          {isSaving && (
            <Box sx={{ ml: 'auto' }}>
              <CircularProgress size={16} />
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // Render the matrix for mobile view (card-based approach)
  const renderMobileMatrix = () => {
    if (matrix.rows.length === 0 || matrix.columns.length === 0) {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography color="text.secondary">
            No category option combinations available for this data element.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ mb: 3 }}>
        {matrix.rows.map((row, rowIndex) => (
          <Accordion 
            key={rowIndex}
            expanded={expandedRows[row] || false}
            onChange={() => toggleRowExpand(row)}
            sx={{ 
              mb: 1,
              '&:before': { display: 'none' },
              boxShadow: 1,
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                '& .MuiAccordionSummary-expandIconWrapper': {
                  color: 'white'
                }
              }}
            >
              <Typography sx={{ fontWeight: 'bold' }}>{row}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {matrix.columns.map((column, colIndex) => {
                  const coc = findCategoryOptionCombo(row, column);
                  if (!coc) return null;
                  
                  return (
                    <Grid item xs={12} key={colIndex}>
                      <Card sx={{ p: 1 }}>
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            {column}
                          </Typography>
                          {renderCellInputField(coc.id, row, column)}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  // Render the matrix as a traditional table for desktop
  const renderDesktopMatrix = () => {
    if (matrix.rows.length === 0 || matrix.columns.length === 0) {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography color="text.secondary">
            No category option combinations available for this data element.
          </Typography>
        </Box>
      );
    }
    
    return (
      <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 2, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '& .MuiTableCell-root': {
                    color: 'white !important'
                  }
                }}
              >
              </TableCell>
              {matrix.columns.map((column, index) => (
                <TableCell 
                  key={index} 
                  align="center" 
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: 'primary.main', 
                    color: 'white !important',
                    minWidth: '120px',
                    '& .MuiTableCell-root': {
                      color: 'white !important'
                    }
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {matrix.rows.map((row, rowIndex) => (
              <Fragment key={rowIndex}>
                <TableRow sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
                  <TableCell 
                    component="th" 
                    scope="row"
                    sx={{ 
                      fontWeight: 'bold', 
                      width: '20%'
                    }}
                  >
                    {row}
                  </TableCell>
                  {!isComponentCollapsed && matrix.columns.map((column, colIndex) => {
                    const coc = findCategoryOptionCombo(row, column);
                    if (!coc) {
                      console.warn(`Could not find category option combo for: ${column}, ${row}`);
                      return <TableCell key={colIndex}></TableCell>;
                    }
                    
                    return (
                      <TableCell key={colIndex} align="center" sx={{ p: 1, minWidth: '120px' }}>
                        {renderCellInputField(coc.id, row, column)}
                      </TableCell>
                    );
                  })}
                  {isComponentCollapsed && (
                    <TableCell colSpan={matrix.columns.length} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Matrix collapsed. Click the expand icon to show fields.
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Calculate submission statistics
  const totalCombos = coc?.length || 0;
  const submittedCount = submittedCombos.length;
  const hasAllSubmitted = totalCombos > 0 && submittedCount === totalCombos;

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{ 
          p: { xs: 2, sm: 4 },
          borderRadius: 2, 
          boxShadow: 3,  
          mb: 4,
          border: hasAllSubmitted ? '1px solid #c8e6c9' : 'none',
          bgcolor: hasAllSubmitted ? '#f0f7f0' : 'white',
          ...(q.formStyles?.sx || {})
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {q.shortName || q.name}
            </Typography>
            
            {hasAllSubmitted && (
              <Chip 
                icon={<CheckCircleIcon />} 
                label="All Submitted" 
                color="success" 
                size="small" 
              />
            )}
            
            {!hasAllSubmitted && submittedCount > 0 && (
              <Chip 
                label={`${submittedCount}/${totalCombos} Submitted`} 
                color="warning" 
                size="small" 
              />
            )}
          </Box>
          
          {/* Add collapse/expand icon button */}
          <IconButton 
            onClick={toggleComponentCollapse}
            aria-label={isComponentCollapsed ? "Expand" : "Collapse"}
            size="small"
          >
            {isComponentCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
        
        {/* Description */}
        {q.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {q.description}
          </Typography>
        )}
        
        {/* Render the appropriate view based on screen size */}
        {!isComponentCollapsed && (
          <>
            {isMobile ? renderMobileMatrix() : renderDesktopMatrix()}
          </>
        )}
        
        {isComponentCollapsed && (
          <Box 
            sx={{ 
              p: 2, 
              textAlign: 'center', 
              bgcolor: 'action.hover',
              borderRadius: 1
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Matrix collapsed. Click the expand icon to show fields.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TextFieldMatrixBlock;