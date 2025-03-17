import { FC, useState, useEffect, ChangeEvent, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FormControl, 
  TextField,
  FormHelperText,
  RadioGroup,
  InputAdornment,
  FormControlLabel,
  Radio,
  Checkbox,
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import DomsSvgIcon from '../components/DomsSvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { openDB } from 'idb';
import { DataElement, CategoryOptionCombo, QuestionTypes } from '../types';

interface AggregateQuestionBlockProps {
  q: DataElement;
  dataSet: string;
  period: string;
  source: string;
  onSave?: (data: any) => Promise<{ success: boolean }>;
  existingValues?: any[];
  onValuesUpdate?: (values: any[]) => void;
}

// Helper types to manage aggregated data
type CategoryMatrix = {
  rows: string[]; // e.g., "0-1 year", "1-5 years"
  columns: string[]; // e.g., "Female", "Male"
};

interface DisaggregatedValue {
  dataElementId: string;
  categoryOptionComboId: string;
  value: string;
}

const AggregateQuestionBlock: FC<AggregateQuestionBlockProps> = ({
  q,
  dataSet,
  period,
  source,
  onSave,
  existingValues = [],
  onValuesUpdate
}) => {
  const [results, setResults] = useState<Record<string, Record<string, any>>>({});
  const [submittedElements, setSubmittedElements] = useState<Record<string, string[]>>({});
  const [submittedValues, setSubmittedValues] = useState<any[]>(existingValues || []);
  const [savingStates, setSavingStates] = useState<Record<string, Record<string, boolean>>>({});
  const [autoSaving, setAutoSaving] = useState<Record<string, Record<string, boolean>>>({});
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [submissionStatus, setSubmissionStatus] = useState<Record<string, Record<string, 'success' | 'error' | 'pending'>>>({});

  const dataElementId = q.uid;

  // Initialize IndexedDB
  useEffect(() => {
    const initIndexedDB = async () => {
      try {
        await openDB('ihrs-db', 1, {
          upgrade(db) {
            // Check if store already exists
            if (!db.objectStoreNames.contains('ihrsDataValues')) {
              db.createObjectStore('ihrsDataValues', { keyPath: 'uuid' });
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

  // Initialize results from existingValues for this specific data element
  useEffect(() => {
    if (existingValues && existingValues.length > 0) {
      const newResults: Record<string, Record<string, any>> = {};
      const elementCombos: Record<string, string[]> = {};
      const newSubmissionStatus: Record<string, Record<string, 'success' | 'error' | 'pending'>> = {};
      
      // Filter only values related to this specific data element
      const relevantValues = existingValues.filter(value => value.dataElementId === dataElementId);
      
      relevantValues.forEach(value => {
        if (value.dataElementId && value.categoryOptionComboId) {
          if (!newResults[value.dataElementId]) {
            newResults[value.dataElementId] = {};
            elementCombos[value.dataElementId] = [];
            newSubmissionStatus[value.dataElementId] = {};
          }
          
          newResults[value.dataElementId][value.categoryOptionComboId] = value.value;
          
          // Set submission status based on value.synced property if it exists
          newSubmissionStatus[value.dataElementId][value.categoryOptionComboId] = 
            value.synced === false ? 'pending' : 'success';
          
          if (!elementCombos[value.dataElementId].includes(value.categoryOptionComboId)) {
            elementCombos[value.dataElementId].push(value.categoryOptionComboId);
          }
        }
      });
      
      setResults(newResults);
      setSubmissionStatus(newSubmissionStatus);
      setSubmittedElements(elementCombos);
    }
  }, [existingValues, dataElementId]);

  // Parse category option combos to create a matrix for display - SWAPPED
  const getCategoryMatrix = (categoryOptionCombos: CategoryOptionCombo[]): CategoryMatrix => {
    if (!categoryOptionCombos || categoryOptionCombos.length === 0) {
      return { rows: [], columns: [] };
    }

    const sortedCocs = [...categoryOptionCombos].sort((a, b) => (a.cocOrder || 0) - (b.cocOrder || 0));
    
    // Extract unique category dimensions from names (assuming format like "Female, 0-1 year")
    // SWAPPED: now columns are gender, rows are age categories
    const rowValues = new Set<string>();
    const colValues = new Set<string>();

    sortedCocs.forEach(coc => {
      const parts = coc.name.split(',').map(part => part.trim());
      if (parts.length >= 2) {
        // Swapped: columns are gender (parts[0]), rows are age categories (parts[1])
        colValues.add(parts[0]); // e.g., "Female"
        rowValues.add(parts[1]); // e.g., "0-1 year"
      }
    });

    return {
      rows: Array.from(rowValues),
      columns: Array.from(colValues)
    };
  };

  // Find the specific categoryOptionCombo based on gender and age
  const findCategoryOptionCombo = (
    dataElement: DataElement, 
    rowValue: string, // Age category
    colValue: string  // Gender
  ): CategoryOptionCombo | undefined => {
    if (!dataElement.categoryOptionCombos) return undefined;
    
    // Searching for exact match with the exact format "gender, age"
    const exactMatch = dataElement.categoryOptionCombos.find(coc => 
      coc.name === `${colValue}, ${rowValue}`
    );
    
    if (exactMatch) return exactMatch;
    
    // If no exact match found, let's try a more flexible approach
    return dataElement.categoryOptionCombos.find(coc => {
      const parts = coc.name.split(',').map(part => part.trim());
      return parts.length >= 2 && 
             parts[0] === colValue && 
             parts[1] === rowValue;
    });
  };

  // Handle text input change for disaggregated data
  const handleDisaggregatedChange = (
    categoryOptionComboId: string
  ) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    
    setResults(prev => ({
      ...prev,
      [dataElementId]: {
        ...(prev[dataElementId] || {}),
        [categoryOptionComboId]: value
      }
    }));
  };

  // Handle radio option change for disaggregated data
  const handleDisaggregatedOptionChange = (
    categoryOptionComboId: string
  ) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    
    setResults(prev => ({
      ...prev,
      [dataElementId]: {
        ...(prev[dataElementId] || {}),
        [categoryOptionComboId]: value
      }
    }));
  };

  // Handle checkbox change for disaggregated data
  const handleDisaggregatedCheckboxChange = (
    categoryOptionComboId: string
  ) => (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    
    setResults(prev => ({
      ...prev,
      [dataElementId]: {
        ...(prev[dataElementId] || {}),
        [categoryOptionComboId]: {
          ...(prev[dataElementId]?.[categoryOptionComboId] || {}),
          [name]: checked
        }
      }
    }));
  };

  // Handle saving data to server/IndexedDB for a specific categoryOptionCombo
  const handleSaveDisaggregatedData = async (
    categoryOptionComboId: string
  ) => {
    if (!results[dataElementId] || !results[dataElementId][categoryOptionComboId]) {
      setErrors(prev => ({
        ...prev,
        [dataElementId]: {
          ...(prev[dataElementId] || {}),
          [categoryOptionComboId]: 'Please enter a value'
        }
      }));
      return;
    }

    try {
      setSavingStates(prev => ({
        ...prev,
        [dataElementId]: {
          ...(prev[dataElementId] || {}),
          [categoryOptionComboId]: true
        }
      }));
      
      setErrors(prev => ({
        ...prev,
        [dataElementId]: {
          ...(prev[dataElementId] || {}),
          [categoryOptionComboId]: ''
        }
      }));


    setSubmissionStatus(prev => ({
      ...prev,
      [dataElementId]: {
        ...(prev[dataElementId] || {}),
        [categoryOptionComboId]: 'pending'
      }
    }));
      
      // Fixed: Prioritize props values then fall back to localStorage
      const effectiveSourceId = source || localStorage.getItem('ihrs-selected-org') || '';
      const effectivePeriod = period || localStorage.getItem('ihrs-selected-period') || '';
      const effectiveDataSetId = dataSet || localStorage.getItem('ihrs-selected-dataset') || '';
      
      if (!effectiveSourceId || !effectivePeriod) {
        throw new Error('Missing required source ID or period');
      }

      // Convert value based on question type
      let formattedValue: string;
      const value = results[dataElementId][categoryOptionComboId];
      
      if (q.dataElementQuestionType === QuestionTypes.MULTIPLE_SELECT && typeof value === 'object') {
        // For checkbox values, convert to comma-separated string of selected options
        formattedValue = Object.entries(value)
          .filter(([_, selected]) => selected)
          .map(([option, _]) => option)
          .join(',');
      } else {
        // For text, number, and radio values
        formattedValue = String(value);
      }
      
      // Prepare the data for saving
      const valuePayload = {
        uuid: crypto.randomUUID(),
        source: effectiveSourceId,
        period: effectivePeriod,
        dataElement: dataElementId,
        categoryOptionCombo: categoryOptionComboId,
        attributeOptionCombo: '',
        value: formattedValue,
        comment: 'ok',
        followup: false,
        date: new Date().toISOString(),
        savedBy: localStorage.getItem('userId') || 'unknown',
        created: new Date().toISOString(),
        lastupdated: new Date().toISOString(),
        synced: false
      };
  
      // Update the in-memory values by removing any existing entry for this element + categoryOptionCombo
      const updatedValues = [
        ...submittedValues.filter(
          r => !(r.dataElementId === dataElementId && r.categoryOptionComboId === categoryOptionComboId)
        ),
        valuePayload
      ];
      
      // Update local state immediately to ensure persistence
      setSubmittedValues(updatedValues);
      
      // Update submitted elements tracking
      setSubmittedElements(prev => {
        const elementCombos = [...(prev[dataElementId] || [])];
        if (!elementCombos.includes(categoryOptionComboId)) {
          elementCombos.push(categoryOptionComboId);
        }
        return {
          ...prev,
          [dataElementId]: elementCombos
        };
      });
      
      // Notify parent component of values update
      if (onValuesUpdate) {
        onValuesUpdate(updatedValues);
      }
      
      // Store in localStorage as backup
      try {
        localStorage.setItem(
          `form-data-${dataElementId}-${categoryOptionComboId}`, 
          JSON.stringify(valuePayload)
        );
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      
      // Store in IndexedDB with proper error handling
      try {
        const db = await openDB('ihrs-db', 1);
        const tx = db.transaction('ihrsDataValues', 'readwrite');
        await tx.store.put(valuePayload);
        await tx.done;
      } catch (dbError) {
        console.error('IndexedDB save error:', dbError);
        // Continue execution even if IndexedDB fails
      }
      
      // Then try to save to server
      if (onSave) {
        try {
          const response = await onSave(valuePayload);
          if (response.success) {
            // Mark as successfully synced
            valuePayload.synced = true;
            
            // Update submission status to success
            setSubmissionStatus(prev => ({
              ...prev,
              [dataElementId]: {
                ...(prev[dataElementId] || {}),
                [categoryOptionComboId]: 'success'
              }
            }));
            
            // Update the in-memory values with synced status
            const syncedValues = updatedValues.map(v => 
              v.uuid === valuePayload.uuid ? {...v, synced: true} : v
            );
            setSubmittedValues(syncedValues);
            
            // Notify parent of update with synced flag
            if (onValuesUpdate) {
              onValuesUpdate(syncedValues);
            }
          }
        } catch (error) {
          console.error('Error saving to server, keeping in IndexedDB for later sync:', error);
          // Update submission status to error
          setSubmissionStatus(prev => ({
            ...prev,
            [dataElementId]: {
              ...(prev[dataElementId] || {}),
              [categoryOptionComboId]: 'error'
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setErrors(prev => ({
        ...prev,
        [dataElementId]: {
          ...(prev[dataElementId] || {}),
          [categoryOptionComboId]: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
      setSubmissionStatus(prev => ({
        ...prev,
        [dataElementId]: {
          ...(prev[dataElementId] || {}),
          [categoryOptionComboId]: 'error'
        }
      }));
    } finally {
      setSavingStates(prev => ({
        ...prev,
        [dataElementId]: {
          ...(prev[dataElementId] || {}),
          [categoryOptionComboId]: false
        }
      }));
    }
  };

  // Handle onBlur event for auto-saving disaggregated data
  const handleDisaggregatedBlur = (
    categoryOptionComboId: string
  ) => () => {
    const hasValue = results[dataElementId]?.[categoryOptionComboId];
    const isSaving = savingStates[dataElementId]?.[categoryOptionComboId];
    const isAutoSaving = autoSaving[dataElementId]?.[categoryOptionComboId];
    
    if (hasValue && !isSaving && !isAutoSaving) {
      setAutoSaving(prev => ({
        ...prev,
        [dataElementId]: {
          ...(prev[dataElementId] || {}),
          [categoryOptionComboId]: true
        }
      }));
      
      // Add a small delay before auto-saving to prevent immediate save during rapid interactions
      setTimeout(() => {
        handleSaveDisaggregatedData(categoryOptionComboId).finally(() => {
          setAutoSaving(prev => ({
            ...prev,
            [dataElementId]: {
              ...(prev[dataElementId] || {}),
              [categoryOptionComboId]: false
            }
          }));
        });
      }, 800);
    }
  };

  // Render input field for a single categoryOptionCombo cell
  const renderDisaggregatedInputField = (
    categoryOptionComboId: string
  ) => {
    const isSubmitted = submittedElements[dataElementId]?.includes(categoryOptionComboId);
    const isSaving = savingStates[dataElementId]?.[categoryOptionComboId] || false;
    const isAutoSaving = autoSaving[dataElementId]?.[categoryOptionComboId] || false;
    const error = errors[dataElementId]?.[categoryOptionComboId] || '';
    const value = results[dataElementId]?.[categoryOptionComboId] || '';
    const status = submissionStatus[dataElementId]?.[categoryOptionComboId];

    let bgColor = 'white';
    if (status === 'success') bgColor = '#f0f7f0'; // Light green for success
    else if (status === 'error') bgColor = '#fff3f3'; // Light red for error
    else if (status === 'pending') bgColor = '#fff9e6'; // Light yellow for pending
    
    // Text and number inputs
    if (
    q.dataElementQuestionType === QuestionTypes.INTEGER_INPUT || 
    q.dataElementQuestionType === QuestionTypes.TEXT_INPUT
  ) {
    return (
      <Box sx={{ position: 'relative', width: '100%' }}>
        <TextField
          id={`input-${dataElementId}-${categoryOptionComboId}`}
          size="small"
          variant="outlined"
          type={q.fieldType || 'number'}
          value={value}
          onChange={handleDisaggregatedChange(categoryOptionComboId)}
          onBlur={handleDisaggregatedBlur(categoryOptionComboId)}
          error={!!error || status === 'error'}
          disabled={q.disabled || isSaving || isAutoSaving}
          sx={{ 
            width: '100%',
            bgcolor: bgColor,
            '& .MuiInputBase-root': {
              minWidth: '80px', // Ensure minimum width for mobile
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <DomsSvgIcon>{q.iconText || 'material-outline:edit'}</DomsSvgIcon>
              </InputAdornment>
            )
          }}
        />
        
        {/* Status indicator */}
        {status && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: -8, 
              right: -8, 
              zIndex: 1 
            }}
          >
            {status === 'success' && (
              <Chip 
                icon={<CheckCircleIcon fontSize="small" />} 
                label="Saved" 
                color="success" 
                size="small" 
                sx={{ height: '20px', fontSize: '0.7rem' }}
              />
            )}
            {status === 'error' && (
              <Chip 
                icon={<DomsSvgIcon>material-outline:error</DomsSvgIcon>} 
                label="Retry" 
                color="error" 
                size="small" 
                sx={{ height: '20px', fontSize: '0.7rem' }}
                onClick={() => handleSaveDisaggregatedData(categoryOptionComboId)}
              />
            )}
            {status === 'pending' && (
              <Chip 
                icon={<CircularProgress size={10} />} 
                label="Pending" 
                color="warning" 
                size="small" 
                sx={{ height: '20px', fontSize: '0.7rem' }}
              />
            )}
          </Box>
        )}
      </Box>
    );
  }
    
    // For other question types (Radio, Checkbox), we'll show a simplified version in the table
    // and provide a more detailed view in a separate section or modal if needed
    return (
      <TextField
        id={`input-${dataElementId}-${categoryOptionComboId}`}
        size="small"
        variant="outlined"
        type={q.fieldType || 'text'}
        value={value}
        onChange={handleDisaggregatedChange(categoryOptionComboId)}
        onBlur={handleDisaggregatedBlur(categoryOptionComboId)}
        error={!!error}
        disabled={q.disabled || isSaving || isAutoSaving}
        sx={{ 
          width: '100%',
          bgcolor: isSubmitted ? '#f0f7f0' : 'white',
          '& .MuiInputBase-root': {
            minWidth: '80px', // Ensure minimum width for mobile
          }
        }}
        inputProps={{
          style: { textAlign: 'center' }
        }}
      />
    );
  };

  // Render a table for disaggregated data entry
  const renderDisaggregatedTable = () => {
    const matrix = getCategoryMatrix(q.categoryOptionCombos || []);
    
    // If no disaggregation is available, render a standard input
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
                  color: 'white'
                }}
              >
                {' '}
              </TableCell>
              {matrix.columns.map((column, index) => (
                <TableCell 
                  key={index} 
                  align="center" 
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    minWidth: '120px' // Ensure enough width for input on mobile
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {matrix.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
                <TableCell 
                  component="th" 
                  scope="row"
                  sx={{ fontWeight: 'bold', width: '20%' }}
                >
                  {row}
                </TableCell>
                {matrix.columns.map((column, colIndex) => {
                  // Now column is gender and row is age category
                  const coc = findCategoryOptionCombo(q, row, column);
                  if (!coc) {
                    console.warn(`Could not find category option combo for: ${column}, ${row}`);
                    return <TableCell key={colIndex}></TableCell>;
                  }
                  
                  return (
                    <TableCell key={colIndex} align="center" sx={{ p: 1, minWidth: '120px' }}>
                      {renderDisaggregatedInputField(coc.id)}
                      
                      {/* Show saving indicator */}
                      {(savingStates[dataElementId]?.[coc.id] || autoSaving[dataElementId]?.[coc.id]) && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                          <CircularProgress size={16} />
                        </Box>
                      )}
                      
                      {/* Show error message if any */}
                      {errors[dataElementId]?.[coc.id] && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                          {errors[dataElementId][coc.id]}
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const totalCombos = q.categoryOptionCombos?.length || 0;
  const submittedCombos = submittedElements[dataElementId]?.length || 0;
  const hasAllSubmitted = totalCombos > 0 && submittedCombos === totalCombos;

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{ 
          p: { xs: 2, sm: 4, md: 6 }, // Responsive padding
          borderRadius: 2, 
          boxShadow: 3,  
          mb: 4,
          border: hasAllSubmitted ? '1px solid #c8e6c9' : 'none',
          bgcolor: hasAllSubmitted ? '#f0f7f0' : 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {q.description || q.name}
            </Typography>
            
            {hasAllSubmitted && (
              <Chip 
                icon={<CheckCircleIcon />} 
                label="All Submitted" 
                color="success" 
                size="small" 
              />
            )}
            
            {!hasAllSubmitted && submittedCombos > 0 && (
              <Chip 
                label={`${submittedCombos}/${totalCombos} Submitted`} 
                color="warning" 
                size="small" 
              />
            )}
          </Box>
        </Box>
        
        {/* Render the disaggregated data table */}
        {renderDisaggregatedTable()}
      </Paper>
    </Box>
  );
};

// Add this function at the end of the file, export it for use in parent components
export const syncPendingValues = async (onSave: (data: any) => Promise<{success: boolean}>) => {
  try {
    const db = await openDB('ihrs-db', 1);
    const tx = db.transaction('ihrsDataValues', 'readonly');
    const store = tx.objectStore('ihrsDataValues');
    const allValues = await store.getAll();
    
    // Find values that haven't been synced yet
    const pendingValues = allValues.filter(value => value.synced === false);
    
    // Try to sync each pending value
    const results = await Promise.allSettled(
      pendingValues.map(async (value) => {
        try {
          const response = await onSave(value);
          if (response.success) {
            // Update the record in IndexedDB to mark as synced
            const updateTx = db.transaction('ihrsDataValues', 'readwrite');
            const updateStore = updateTx.objectStore('ihrsDataValues');
            await updateStore.put({ ...value, synced: true });
            await updateTx.done;
            return { success: true, value };
          }
          return { success: false, value };
        } catch (error) {
          return { success: false, value, error };
        }
      })
    );
    
    return {
      total: pendingValues.length,
      succeeded: results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length,
      failed: results.filter(r => r.status === 'rejected' || !(r.value as any).success).length
    };
  } catch (error) {
    console.error('Error syncing pending values:', error);
    return { total: 0, succeeded: 0, failed: 0, error };
  }
};

// Helper function to transform results to DataValuePayload format for external use
export const transformToDataValuePayload = (
  results: Record<string, Record<string, any>>,
  source: string,
  period: string,
  dataSetId: string
): any[] => {
  const payloads: any[] = [];
  
  Object.entries(results).forEach(([dataElementId, categories]) => {
    Object.entries(categories).forEach(([categoryOptionComboId, value]) => {
      if (value !== null && value !== undefined) {
        let formattedValue: string;
        
        // Handle different types of values
        if (typeof value === 'object') {
          // For checkbox values, convert to comma-separated string of selected options
          const selectedOptions = Object.entries(value)
            .filter(([_, selected]) => selected)
            .map(([option, _]) => option);
          formattedValue = selectedOptions.join(',');
        } else {
          // For text, number, and radio values
          formattedValue = String(value);
        }
        
        payloads.push({
          uuid: crypto.randomUUID(),
          sourceId: source,
          periodId: period,
          dataElementId: dataElementId,
          categoryOptionComboId: categoryOptionComboId,
          dataSetId: dataSetId,
          value: formattedValue,
          date: new Date().toISOString(),
          savedBy: localStorage.getItem('userId') || 'unknown',
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
      }
    });
  });
  
  return payloads;
};

export default AggregateQuestionBlock;