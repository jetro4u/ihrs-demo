const VALUE_COMPONENTS = ['DomsTextField', 'DomsRadioButton', 'DomsCheckbox'];
const RECORD_COMPONENTS = ['DomsTextRecord', 'DomsObjectRecord'];
const MIXED_FORMBLOCK = ['MixedFormBlock' ];
const VALUE_FORMBLOCK = ['DomsTextBlock', 'TemplateMenuVerticalMatrix', 'TemplateMenuValueForm', 'HorizontalMatrixTextFieldBlock', 'VerticalMatrixTextFieldBlock'];
const RECORD_FORMBLOCK = ['TemplateMenuObjectForm'];

/**
   * Determines the appropriate storage type based on dataset, section, element, and data configuration
   * @param {Object} params - Parameters to determine storage type
   * @returns {string} - Either 'dataValueStore' or 'dataRecordStore'
   */
const determineStorageType = ({
  dataSets,
  datasetId,
  sectionId,
  dataElement,
  formBlockType,
  componentName,
  data
}) => {
  console.log('Determining storage type with params:', {
    datasetId, sectionId, dataElement, formBlockType, componentName, data
  });
  
  const selectedDataset = dataSets.find(ds => ds.uid === datasetId);
  
  // If data has explicit metrics, it's a record
  if (data && data.metrics && Object.keys(data.metrics).length > 0) {
    console.log('Data has metrics, using dataRecordStore');
    return 'dataRecordStore';
  }
  
  // If no dataset found, rely on component name or formBlock
  if (!selectedDataset) {
    if (VALUE_COMPONENTS.includes(componentName)) return 'dataValueStore';
    if (RECORD_COMPONENTS.includes(componentName)) return 'dataRecordStore';
    if (VALUE_FORMBLOCK.includes(formBlockType)) return 'dataValueStore';
    if (RECORD_FORMBLOCK.includes(formBlockType)) return 'dataRecordStore';
    
    // Default to value if we can't determine
    return 'dataValueStore';
  }
  
  // Case 3 & 4: Section exists, check its formBlock
  if (sectionId && selectedDataset.sections) {
    const section = selectedDataset.sections.find(s => s.id === sectionId);
    
    if (section) {
      // If section has a formBlock defined
      if (section.formBlock) {
        if (VALUE_FORMBLOCK.includes(section.formBlock)) return 'dataValueStore';
        if (RECORD_FORMBLOCK.includes(section.formBlock)) return 'dataRecordStore';
        if (MIXED_FORMBLOCK.includes(section.formBlock)) {
          // For mixed form blocks in a section, check the component name
          if (VALUE_COMPONENTS.includes(componentName)) return 'dataValueStore';
          if (RECORD_COMPONENTS.includes(componentName)) return 'dataRecordStore';
        }
      } else {
        // Case 3: Section with mixed types (no formBlock)
        if (VALUE_COMPONENTS.includes(componentName)) return 'dataValueStore';
        if (RECORD_COMPONENTS.includes(componentName)) return 'dataRecordStore';
      }
    }
  }
  
  // Case 1 & 2: No section defined or section not found
  if (!selectedDataset.sections || selectedDataset.sections.length === 0) {
    // Check if dataset has a formBlock
    if (selectedDataset.formBlock) {
      if (VALUE_FORMBLOCK.includes(selectedDataset.formBlock)) return 'dataValueStore';
      if (RECORD_FORMBLOCK.includes(selectedDataset.formBlock)) return 'dataRecordStore';
    } else {
      // Case 1: Single section with mixed types (no formBlock)
      if (VALUE_COMPONENTS.includes(componentName)) return 'dataValueStore';
      if (RECORD_COMPONENTS.includes(componentName)) return 'dataRecordStore';
    }
  }
  
  // Final fallback: use the direct formBlock type provided to this function
  if (VALUE_FORMBLOCK.includes(formBlockType)) return 'dataValueStore';
  if (RECORD_FORMBLOCK.includes(formBlockType)) return 'dataRecordStore';
  
  // If all else fails, default to value store
  console.log('Could not determine storage type, defaulting to dataValueStore');
  return 'dataValueStore';
};