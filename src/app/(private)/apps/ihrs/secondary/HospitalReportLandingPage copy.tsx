// import statement ommited
import HospitalReportPDF from '../components/HospitalReportPDF';
import metadata from '../metadata.json';
import { storeDataRecord, storeDataValue, getDataValues, getDataRecords } from '../../../../../services/indexedDB';
import { CompleteDatasetPayload, CategoryOptionCombo, DataRecordPayload, DataValuePayload, DataValueMapping, DataElement } from '../types';

const FormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 12,
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  overflowX: 'hidden',
  '& .MuiTable-root': {
    tableLayout: 'fixed',
    width: '100%',
    maxWidth: '100%'
  },
  '& .MuiTableContainer-root': {
    overflowX: 'auto',
    width: '100%'
  }
}));

const HospitalReportLandingPage = () => {
  const steps = ['Dataset Information', 'Submit Report', 'Review & Submit'];
  
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [loading, setLoading] = useState(false);
  const [submittedRecords, setSubmittedRecords] = useState<DataRecordPayload[]>([]);
  const [submittedValues, setSubmittedValues] = useState<DataValuePayload[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [dataElements, setDataElements] = useState([]);
  const [mainSections, setMainSections] = useState([]);
  const [dynamicSections, setDynamicSections] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [filteredDataElements, setFilteredDataElements] = useState([]);
  const [periodFormatted, setPeriodFormatted] = useState('');
  const [lines, setLines] = useState<Point[][]>([]);
  const [organization, setOrganization] = useState('');
  const [bedCapacity, setBedCapacity] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showStepper, setShowStepper] = useState(true);
  
  // State for expanded sections and enabled dynamic sections
  const [expandedSections, setExpandedSections] = useState({});
  const [enabledDynamicSections, setEnabledDynamicSections] = useState({});
  const SESSION_TIMEOUT_MINUTES = 30; // Adjust as needed
  const SESSION_TIMER_CHECK_SECONDS = 60;
    
    // CompleteDatasetPayload state
  const [completeDatasetInfo, setCompleteDatasetInfo] = useState<CompleteDatasetPayload>({
    dataSet: '',
    source: '',
    period: '',
    date: new Date(),
    signatures: [],
    completed: false
  });
 
  const [dataValue, setDataValue] = useState<DataValuePayload>({
    source: '',
    period: '',
    dataElement: '',
    categoryOptionCombo: '',
    attributeOptionCombo: '',
    value: '',
    date: new Date(),
    comment: null,
    followup: false
  });
 
  const [dataRecord, setDataRecord] = useState<DataRecordPayload>({
    source: '',
    period: '',
    dataElement: '',
    attributeOptionCombo: '',
    data: {},
    date: new Date(),
    comment: null,
    followup: false
  });

  const orgs = metadata?.organisations || [];
  const organizations = orgs.filter(org => org.level === 5);
  const coc = metadata?.categoryOptionCombos || [];

  // Datasets from metadata
  const datasets = metadata?.dataSets || [];
    
    useEffect(() => {
      const setupDb = async () => {
        try {
          await initDB();
          setDbInitialized(true);
          console.log('IndexedDB initialized successfully');
        } catch (error) {
          console.error('Failed to initialize IndexedDB:', error);
          setAlertInfo({
            open: true,
            message: 'Failed to initialize database. Please refresh the page.',
            severity: 'error'
          });
        }
      };
      
      setupDb();
    }, []);
    
      useEffect(() => {
        // Event listener for tab close/refresh
        const handleTabClose = (event) => {
          // You have two options:
          // 1. Clear the data when tab is closed
          localStorage.removeItem('ihrs-submitted-records');
          
          // 2. Or show a confirmation dialog (browser dependent, may not work in all browsers)
          event.preventDefault();
          event.returnValue = 'Are you sure you want to leave? Your unsaved data will be lost.';
          return event.returnValue;
        };
    
        window.addEventListener('beforeunload', handleTabClose);
        
        return () => {
          window.removeEventListener('beforeunload', handleTabClose);
        };
      }, []);
  
    
  const handleDrawing = (newLines: Point[][]) => {
    setLines(newLines);
    setCompleteDatasetInfo(prev => ({
      ...prev,
      signatures: newLines
    }));
  };

  /**
   * Handles form block submission and routes to appropriate storage
   */
  const handleFormBlockSubmit = (data, formBlockType, dataElement, categoryOptionCombo = '', sectionId = null) => {
    console.log('Form block submit:', { 
      formBlockType, 
      dataElement, 
      sectionId, 
      data 
    });
    
    // Get the data element details to access its componentName
    const dataElementDetails = metadata.dataElements?.find(el => el.uid === dataElement);
    const componentName = dataElementDetails?.componentName || '';
    
    // Determine storage type
    const storageType = determineStorageType({
      dataSets: dataSets,
      datasetId: completeDatasetInfo.dataSet,
      sectionId,
      dataElement,
      formBlockType,
      componentName,
      data
    });
    
    console.log(`Storage decision for element ${dataElement}: ${storageType}`);
    
    if (storageType === 'dataRecord') {
      // Create data record payload
      const recordPayload = {
        source: completeDatasetInfo.source,
        period: completeDatasetInfo.period,
        dataElement: dataElement,
        attributeOptionCombo: 'default', // Or appropriate value
        data: data.metrics || data, // Use metrics if available, otherwise whole data
        date: new Date(),
        comment: null,
        followup: false
      };
      
      console.log('Saving as record:', recordPayload);
      handleSaveRecord(recordPayload)
        .then(result => {
          if (result.success) {
            console.log('Record saved successfully');
          } else {
            console.error('Failed to save record');
          }
        });
    } else {
      // Create data value payload
      let valueToStore = '';
      
      if (typeof data === 'object') {
        // For objects that go into value store, stringify them
        try {
          valueToStore = JSON.stringify(data);
        } catch (e) {
          console.error('Error stringifying object:', e);
          valueToStore = String(data); // Fallback
        }
      } else {
        valueToStore = String(data);
      }
      
      const valuePayload = {
        source: completeDatasetInfo.source,
        period: completeDatasetInfo.period,
        dataElement: dataElement,
        categoryOptionCombo: categoryOptionCombo || 'default',
        attributeOptionCombo: 'default', // Or appropriate value
        value: valueToStore,
        date: new Date(),
        comment: null,
        followup: false
      };
      
      console.log('Saving as value:', valuePayload);
      handleSaveValue(valuePayload)
        .then(result => {
          if (result.success) {
            console.log('Value saved successfully');
          } else {
            console.error('Failed to save value');
          }
        });
    }
  };
    
      
      // Handler for saving data records
      const handleSaveRecord = async (record: DataRecordPayload): Promise<{ success: boolean }> => {
        if (!dbInitialized) {
          setAlertInfo({
            open: true,
            message: 'Database not initialized yet. Please try again.',
            severity: 'error'
          });
          return { success: false };
        }
        try {
          setLoading(true);
        
          // Ensure required fields are present
          if (!record.source) record.source = completeDatasetInfo.source;
          if (!record.period) record.period = completeDatasetInfo.period;
          
          console.log('Saving record to IndexedDB:', record);
      
          // Store in IndexedDB - will generate a uniqueKey internally
          const savedRecord: StoredDataRecord = await storeDataRecord(record);
      
          // Update state with the new record
          setSubmittedRecords((prevRecords: StoredDataRecord[]) => {
            const existingIndex = prevRecords.findIndex(r => 
              r.uniqueKey === savedRecord.uniqueKey || 
              (r.dataElement === savedRecord.dataElement && 
              r.source === savedRecord.source && 
              r.attributeOptionCombo === savedRecord.attributeOptionCombo)
            );
      
            if (existingIndex >= 0) {
              const updatedRecords = [...prevRecords];
              updatedRecords[existingIndex] = savedRecord;
              return updatedRecords;
            } else {
              return [...prevRecords, savedRecord];
            }
          });
      
          setAlertInfo({
            open: true,
            message: 'Record saved successfully',
            severity: 'success'
          });
      
          // Return expected success response
          return { success: true };
      
        } catch (error) {
          console.error('Failed to save record:', error);
          setAlertInfo({
            open: true,
            message: 'Failed to save record: ' + error.message,
            severity: 'error'
          });
      
          return { success: false }; // Ensure the expected return type
        } finally {
          setLoading(false);
        }
      };  
    
      // Update the handleSaveValue function
      const handleSaveValue = async (value: DataValuePayload): Promise<{ success: boolean }> => {
        if (!dbInitialized) {
          setAlertInfo({
            open: true,
            message: 'Database not initialized yet. Please try again.',
            severity: 'error'
          });
          return { success: false };
        }
        try {
          setLoading(true);
          
          // Ensure required fields are present
          if (!value.source) value.source = completeDatasetInfo.source;
          if (!value.period) value.period = completeDatasetInfo.period;
          
          console.log('Saving value to IndexedDB:', value);
          
          // Store in IndexedDB - will generate a uniqueKey internally
          const savedValue: StoredDataValue = await storeDataValue(value);
          
          // Update state with the new value
          setSubmittedValues((prevValues: StoredDataValue[]) => {
            const existingIndex = prevValues.findIndex(v => 
              v.uniqueKey === savedValue.uniqueKey || 
              (v.dataElement === savedValue.dataElement && 
              v.source === savedValue.source && 
              v.categoryOptionCombo === savedValue.categoryOptionCombo &&
              v.attributeOptionCombo === savedValue.attributeOptionCombo)
            );
            
            if (existingIndex >= 0) {
              const updatedValues = [...prevValues];
              updatedValues[existingIndex] = savedValue;
              return updatedValues;
            } else {
              return [...prevValues, savedValue];
            }
          });
    
          setAlertInfo({
            open: true,
            message: 'Value saved successfully',
            severity: 'success'
          });
    
          return { success: true };
    
        } catch (error) {
          console.error('Failed to save value:', error);
          setAlertInfo({
            open: true,
            message: 'Failed to save value: ' + error.message,
            severity: 'error'
          });
    
          return { success: false };
        } finally {
          setLoading(false);
        }
      };  
  
    const handleRecordsUpdate = (records: DataRecordPayload[]) => {
      setSubmittedRecords(records);
      
    };
  
    // Handle values update from child components
    const handleValuesUpdate = (updatedValues) => {
      setSubmittedValues(updatedValues);
    };
  
  // Update the loadDataFromIndexedDB function
  const loadDataFromIndexedDB = async () => {
    try {
      setLoading(true);
      const { source, period } = completeDatasetInfo;
      
      if (!source || !period) {
        return;
      }
      
      const values = await getDataValues(period, source);
      const records = await getDataRecords(period, source);
      
      setSubmittedValues(values);
      setSubmittedRecords(records);
    } catch (error) {
      console.error('Failed to load data from IndexedDB:', error);
      setAlertInfo({
        open: true,
        message: 'Failed to load data: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear signature
  const clearSignature = () => {
    setLines([]);
    setCompleteDatasetInfo(prev => ({
      ...prev,
      signatures: []
    }));
  };



  // Dynamic component renderer based on section component type
  const renderSectionComponent = (section) => {
    const selectedSource = localStorage.getItem('ihrs-selected-org') || '';
    const selectedDataSet = localStorage.getItem('ihrs-selected-dataset') || '';
    const selectedPeriod = localStorage.getItem('ihrs-selected-period') || '';
    const filteredDataElements = getDataElementsBySection(selectedDataSet, section.name);
    console.log("filteredDataElements", filteredDataElements)
    console.log("selectedDataSet", selectedDataSet)
    console.log("section.name", section.name)
    
    switch(section.formBlock) {
      case 'TemplateMenuObjectForm':
        return (
          <TemplateMenuObjectForm 
            q={filteredDataElements}
            dataSet={selectedDataSet}
            period={selectedPeriod}
            source={selectedSource}
            onSave={handleSaveRecord}
            templates={templates}
            existingRecords={submittedRecords}
            onRecordsUpdate={handleRecordsUpdate}
          />
        );
        
      case 'TemplateMenuValueForm':
        return (
          <TemplateMenuValueForm 
            q={filteredDataElements}
            dataSet={selectedDataSet}
            period={selectedPeriod}
            source={selectedSource}
            onSave={handleSaveValue}
            templates={templates}
            existingValues={submittedValues}
            onValuesUpdate={handleValuesUpdate}
          />
        );
        
      case 'DomsTextField':
        return (
          <Box>
            {filteredDataElements.map(element => (
              <Box key={element.uid} sx={{ mb: 2 }}>
                <DomsTextField
                  q={element}
                  dataSet={selectedDataSet}
                  period={selectedPeriod}
                  source={selectedSource}
                  onSave={handleSaveValue}
                  existingValues={submittedValues}
                  onValuesUpdate={handleValuesUpdate}
                />
              </Box>
            ))}
          </Box>
        );
      
      case 'HorizontalMatrixTextFieldBlock':
        return (
          <Box>
            {filteredDataElements.map(element => (
              <Box key={element.uid} sx={{ mb: 2 }}>
                <HorizontalMatrixTextFieldBlock
                  q={element}
                  coc={getCategoryOptionCombos(element.categoryCombo.id)}
                  dataSet={selectedDataSet}
                  period={selectedPeriod}
                  source={selectedSource}
                  onSave={handleSaveValue}
                  existingValues={submittedValues}
                  onValuesUpdate={handleValuesUpdate}
                />
              </Box>
            ))}
          </Box>
        );
      
      case 'VerticalMatrixTextFieldBlock':
        return (
          <Box>
            {filteredDataElements.map(element => (
              <Box key={element.uid} sx={{ mb: 2 }}>
                <VerticalMatrixTextFieldBlock
                  q={element}
                  coc={getCategoryOptionCombos(element.categoryCombo.id)}
                  dataSet={selectedDataSet}
                  period={selectedPeriod}
                  source={selectedSource}
                  onSave={handleSaveValue}
                  existingValues={submittedValues}
                  onValuesUpdate={handleValuesUpdate}
                />
              </Box>
            ))}
          </Box>
        );
      
      case 'TemplateMenuMatrixBlock':
          return (
            <TemplateMenuMatrixBlock
              q={filteredDataElements}
              coc={coc}
              dataSet={selectedDataSet}
              period={selectedPeriod}
              source={selectedSource}
              onSave={handleSaveValue}
              templates={templates}
              onNext={handleNext}
              onBack={handleBack}
              existingValues={submittedValues}
              onValuesUpdate={handleValuesUpdate}
            />
          );
        
      default:
        return (
          <Typography color="text.secondary">
            Unknown form block type: {section.formBlock}
          </Typography>
        );
    }
  };

  // Render dataset info form
  const renderDatasetInfoForm = () => {
    // omitted
  };

  // Render general patient statistics form with better organization
  const renderDatasetSections = () => {
    return (
      <Box sx={{
        height: '100%',
        overflow: 'visible'
      }}>
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          width: '100%', 
          maxWidth: '100%', 
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}>
          <Typography variant="h5" gutterBottom>
            Hospital Report Form
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please complete all applicable sections below. Your report will be saved automatically as you progress.
          </Typography>
          
          {/* Main Sections - Always Visible but collapsible */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Required Information
            </Typography>
            
            {/* Render main sections dynamically from metadata */}
            {mainSections.map(section => (
              <Accordion 
                key={section.id}
                expanded={expandedSections[section.id] !== undefined ? expandedSections[section.id] : section.enabled} 
                onChange={() => toggleSectionExpansion(section.id)}
                sx={{ mb: 2 }}
                slotProps={{ transition: { unmountOnExit: true } }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls={`section-${section.id}-content`}
                  id={`section-${section.id}-header`}
                >
                  <Typography variant="subtitle1">{section.name}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ 
                  padding: { xs: 1, sm: 2 },
                  maxHeight: '70vh', // Limit height on small screens
                  overflow: 'auto'   // Allow scrolling inside if needed
                }}>
                  {renderSectionComponent(section)}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
          
          {/* Dynamic Sections Selection */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Specialized Services
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the specialized services offered by your facility to enable the corresponding form sections.
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                {dynamicSections.map(section => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={section.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={enabledDynamicSections[section.id] || false}
                          onChange={() => toggleDynamicSection(section.id)}
                        />
                      }
                      label={section.name}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
          
          {/* Render sections for enabled dynamic services */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Active Specialized Service Forms
            </Typography>
            
            {/* Dynamically render enabled dynamic sections */}
            {dynamicSections
              .filter(section => enabledDynamicSections[section.id])
              .map(section => (
                <Accordion key={section.id} sx={{ mb: 2 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls={`section-${section.id}-content`}
                    id={`section-${section.id}-header`}
                  >
                    <Typography variant="subtitle1">{section.name}</Typography>
                  </AccordionSummary>
                    <AccordionDetails sx={{ padding: { xs: 1, sm: 2 } }}>
                      {renderSectionComponent(section)}
                    </AccordionDetails>
                </Accordion>
              ))
            }
            
            {/* No dynamic sections enabled message */}
            {!dynamicSections.some(section => enabledDynamicSections[section.id]) && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
                No specialized services selected. Enable services above to see their form sections here.
              </Typography>
            )}
          </Box>
          
          {/* Navigation Buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 4,
            position: 'fixed', // Changed from sticky to fixed
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'background.paper',
            padding: 2,
            zIndex: 1050,
            boxShadow: '0px -2px 4px rgba(0,0,0,0.1)', // Add shadow for visual separation
            maxWidth: 1100, // Match the container width
            margin: '0 auto', // Center the buttons
            boxSizing: 'border-box'
          }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(0)}
              startIcon={<ArrowBack />}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              endIcon={<ArrowForward />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Review & Submit'}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  };
  // Render the active step
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return renderDatasetInfoForm();
      case 1:
        return renderDatasetSections();
      case 2:
        return renderReviewForm();
      default:
        return null;
    }
  };

  // Main render
  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: 1100,
      margin: '0 auto',
      height: '100vh', // Set to viewport height
      maxHeight: '100vh', // Constrain to viewport height
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden', // Don't allow overflow at container level
      padding: { xs: 1, sm: 2 },
      boxSizing: 'border-box' // Ensure padding doesn't affect total width/height
    }}>
      <HeaderAppBar>
        <Toolbar sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          overflowX: 'hidden',
          width: '100%'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton edge="start" color="inherit" aria-label="back" sx={{ mr: 1 }}>
              <DomsSvgIcon>heroicons-outline:arrow-left</DomsSvgIcon>
            </IconButton>
            <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
              Hospital Report
            </Typography>
          </Box>    
          <IconButton 
            color="inherit" 
            onClick={() => setCollapsed(prev => !prev)}
            aria-label={collapsed ? "expand" : "collapse"}
          >
            <DomsSvgIcon>
              {collapsed ? 'heroicons-outline:chevron-down' : 'heroicons-outline:chevron-up'}
            </DomsSvgIcon>
          </IconButton>
        </Toolbar>
      </HeaderAppBar>
      
      <Box sx={{ 
        display: collapsed || (!showStepper && window.innerWidth < 600) ? 'none' : 'block',
        flexShrink: 0,
        transition: 'all 0.3s ease-in-out', // Add smooth transition
        position: 'sticky',
        top: 64, // Adjust based on your header height
        backgroundColor: 'background.paper',
        zIndex: 1000
      }}>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }} orientation="vertical">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      
      <Box sx={{ 
        flex: '1 1 auto',
        overflow: 'auto',
        overscrollBehavior: 'contain',
        paddingBottom: '100px',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        '& > *': { // Apply to all immediate children
          maxWidth: '100%',
          overflowX: 'hidden'
        }
      }}>
        {renderStep()}
      </Box>
    </Box>
  );
};

export default HospitalReportLandingPage;