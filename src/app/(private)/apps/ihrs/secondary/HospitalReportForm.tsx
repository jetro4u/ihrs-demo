import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Box,
  Card,
  CardContent,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  IconButton,
  AppBar,
  Toolbar,
  Snackbar,
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import SignatureCanvas, { Point } from '../components/SignatureCanvas';
import QuestionBlock from '../components/QuestionBlock';
import metadata from '../metadata.json';

export const QuestionTypes = {
  INTEGER_SELECT: 1,
  TEXT_SELECT: 2,
  BOOLEAN_SELECT: 3,
  MULTIPLE_SELECT: 4,
  INTEGER_DESCRIPTIVE: 5,
  TEXT_DESCRIPTIVE: 6,
  CUSTOM: 7,
  INTEGER_INPUT: 8,
  TEXT_INPUT: 9,
  HIDDEN: 10
}

// Define interfaces for our data
interface CategoryOption {
  id: number;
  uid: string;
  category_id: string;
  name: string;
  shortname: string;
  code: string;
  description: string;
}

interface CategoryOptionCombo {
  id: number;
  uid: string;
  name: string;
  code: string;
  category_combination_id: string;
}

interface DataElement {
  id: number;
  uuid: string;
  name: string;
  shortname: string;
  code: string;
  description: string;
  valuetype: string;
  aggregationtype: string;
  categorycomboid: number;
  domaintype: string;
  dataelementgroupid?: number;
}

interface DataValue {
  dataElementId: number;
  categoryOptionComboId: number;
  value: string;
}

interface ReporterInfo {
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  facility: string;
  reportingMonth: Date | null;
  bedCapacity: string;
  submissionDate: Date | null;
}

// Styled components
const FormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 12
}));

const HeaderAppBar = styled(AppBar)(({ theme }) => ({
  position: 'relative',
  boxShadow: theme.shadows[1],
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(3)
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.grey[100],
}));

interface HospitalReportFormProps {
  metadata: any;
}      

const HospitalReportForm = () => {
  const steps = ['Reporter Details', 'Submit Report', 'Review & Submit'];
  
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lines, setLines] = useState<Point[][]>([]);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [reporterInfo, setReporterInfo] = useState<ReporterInfo>({
    firstName: '',
    lastName: '',
    contactNumber: '',
    email: '',
    facility: '',
    reportingMonth: null,
    bedCapacity: '',
    submissionDate: new Date()
  });
  const [dataValues, setDataValues] = useState<DataValue[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [offeredServices, setOfferedServices] = useState({
    bloodBank: false,
    surgicalProcedures: false,
    specialistServices: false,
    laboratoryTest: false,
    radiologyTest: false,
    pathologyTest: false,
    opticianClinic: false,
    dermatologyServices: false,
    dermatologyProcedures: false,
    dentalServices: false,
    dentalProcedures: false,
    ophthalmologyServices: false,
    ophthalmologyProcedures: false
  });
  const toggleService = (service: keyof typeof offeredServices) => {
    setOfferedServices(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };
  
  // Get data elements, category options, etc. from metadata
  const dataElements = metadata?.dataelement?.filter(
    (de: DataElement) => 
      metadata?.dataelementgroup?.find(
        (deg: any) => deg.code === 'GENERAL_STATS'
      )?.id === de.dataelementgroupid
  ) || [];
  
  const genderCategory = metadata?.category?.find((cat: any) => cat.code === 'GENDER');
  const ageGroupCategory = metadata?.category?.find((cat: any) => cat.code === 'AGE_GROUP');
  
  const genderOptions = metadata?.categoryoption?.filter(
    (option: CategoryOption) => option.category_id === genderCategory?.id
  ) || [];
  
  const ageGroupOptions = metadata?.categoryoption?.filter(
    (option: CategoryOption) => option.category_id === ageGroupCategory?.id
  ) || [];
  
  const categoryOptionCombos = metadata?.categoryoptioncombo?.filter(
    (combo: CategoryOptionCombo) => 
      combo.category_combination_id === metadata?.categorycombo?.find(
        (cc: any) => cc.code === 'GENDER_AGE'
      )?.id
  ) || [];
  
  // Helper to handle onBlur for data element inputs
  const handleDataElementChange = (dataElementId: string, categoryOptionComboId: string) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      
      // Find if this data value already exists
      const existingIndex = dataValues.findIndex(
        dv => dv.dataElementId === dataElementId && dv.categoryOptionComboId === categoryOptionComboId
      );
      
      // Update or add the data value
      if (existingIndex >= 0) {
        const updatedValues = [...dataValues];
        updatedValues[existingIndex] = {
          ...updatedValues[existingIndex],
          value
        };
        setDataValues(updatedValues);
      } else {
        setDataValues([
          ...dataValues,
          {
            dataElementId,
            categoryOptionComboId,
            value
          }
        ]);
      }
    };

  // Helper to create question for QuestionBlock component
  const createQuestion = (element: any, description: string) => {
    return {
      description,
      text: element.name,
      questiontypeId: 
        element.valuetype === 'NUMBER' 
          ? QuestionTypes.INTEGER_DESCRIPTIVE 
          : QuestionTypes.TEXT_DESCRIPTIVE,
      fields: [
        {
          uid: element.id,
          label: "Enter value",
          placeholder: "Enter a number",
          forder: 1
        }
      ]
    };
  };

  // Helper to find the current value for a data element
  const findDataValue = (dataElementId: string, categoryOptionComboId: string) => {
    const found = dataValues.find(
      dv => dv.dataElementId === dataElementId && dv.categoryOptionComboId === categoryOptionComboId
    );
    return found ? found.value : '';
  };

  // Get data elements for different sections
  const generalStatsElements = metadata?.dataelement?.filter(
    (de: DataElement) => 
      metadata?.dataelementgroup?.find(
        (deg: any) => deg.code === 'GENERAL_STATS'
      )?.id === de.dataelementgroupid
  ) || [];

  const maternalHealthElements = metadata?.dataelement?.filter(
    (de: DataElement) => 
      metadata?.dataelementgroup?.find(
        (deg: any) => deg.code === 'MATERNAL_CHILD'
      )?.id === de.dataelementgroupid
  ) || [];

  const emergencyServicesElements = metadata?.dataelement?.filter(
    (de: DataElement) => 
      metadata?.dataelementgroup?.find(
        (deg: any) => deg.code === 'EMERGENCY'
      )?.id === de.dataelementgroupid
  ) || [];

  const bloodBankElements = metadata?.dataelement?.filter(
    (de: DataElement) => 
      metadata?.dataelementgroup?.find(
        (deg: any) => deg.code === 'BLOOD_BANK'
      )?.id === de.dataelementgroupid
  ) || [];

  const surgicalProceduresElements = metadata?.dataelement?.filter(
    (de: DataElement) => 
      metadata?.dataelementgroup?.find(
        (deg: any) => deg.code === 'SURGICAL'
      )?.id === de.dataelementgroupid
  ) || [];

  // Lists for dropdown menus
  const diseasesList = [
    'Malaria', 'Tuberculosis', 'Stroke', 'HIV/AIDS', 'Diarrheal disease',
    'Malnutrition', 'Cancer', 'Meningitis', 'COVID-19', 'M-pox',
    'Diabetes', 'Pneumonia', 'Ischemic heart disease', 'Others'
  ];

  const specialistServicesList = [
    'Internal Medicine (General Medicine)', 'Pediatrics', 'Obstetrics & Gynecology',
    'General Surgery', 'Orthopedics', 'Ophthalmology', 'ENT (Ear, Nose, and Throat)',
    'Dermatology', 'Psychiatry/Behavioral Health', 'Urology'
  ];

  const laboratoryTestsList = ['Blood tests', 'Urinalysis', 'Hormonal tests'];
  const radiologyTestsList = ['X-rays', 'USS', 'CT Scans', 'MRIs'];
  const pathologyTestsList = ['Blood', 'Urine', 'Histopath', 'Swab', 'Stool', 'Breath'];
  const opticianServicesList = ['Dilation', 'Irrigation', 'Foreign body'];
  const dermatologyServicesList = ['Cosmetic', 'Clinical', 'Pediatrics'];
  const dermatologyProceduresList = ['Skin biopsy', 'Shave removal', 'Cryosurgery', 'Topical chemotherapy'];
  const dentalServicesList = [
    'Dental consultation', 'Oral health education and counseling', 'Risk assessment',
    'Emergency triage', 'Preventive care counseling', 'Follow-up and monitoring services'
  ];
  const dentalProceduresList = ['Fillings', 'Extractions', 'Root canals', 'Crowns', 'Teeth whitening'];
  const ophthalmologyServicesList = [
    'Comprehensive eye examination', 'Vision screening', 'Ocular health risk assessment',
    'Low vision evaluation', 'Patient education and counseling', 'Follow-up visits',
    'Contact lens consultation'
  ];
  const ophthalmologyProceduresList = [
    'Cataract Extraction', 'Trabeculectomy', 'Pterygium Excision',
    'Excision Biopsies', 'Eyelid Surgeries'
  ];

  // Template for disease surveillance data object
  const [diseaseData, setDiseaseData] = useState({
    selected: '',
    cases: '',
    deaths: '',
    referredCases: ''
  });

  // Handle disease selection
  const handleDiseaseSelect = (event: React.ChangeEvent<{ value: unknown }>) => {
    setDiseaseData({
      selected: event.target.value as string,
      cases: '',
      deaths: '',
      referredCases: ''
    });
  };

  // Handle disease data change
  const handleDiseaseDataChange = (field: keyof typeof diseaseData) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDiseaseData({
        ...diseaseData,
        [field]: event.target.value
      });
    };

  // Add disease data to the dataValues
  const addDiseaseData = () => {
    // In a real app, you would map these to actual data element IDs
    const diseasePrefix = `DISEASE_${diseaseData.selected.replace(/\s+/g, '_').toUpperCase()}`;
    
    // Add the disease data values
    setDataValues([
      ...dataValues,
      {
        dataElementId: `${diseasePrefix}_CASES`,
        categoryOptionComboId: 'default',
        value: diseaseData.cases
      },
      {
        dataElementId: `${diseasePrefix}_DEATHS`,
        categoryOptionComboId: 'default',
        value: diseaseData.deaths
      },
      {
        dataElementId: `${diseasePrefix}_REFERRED`,
        categoryOptionComboId: 'default',
        value: diseaseData.referredCases
      }
    ]);
    
    // Reset the form
    setDiseaseData({
      selected: '',
      cases: '',
      deaths: '',
      referredCases: ''
    });
  };

  // Template for specialist service data
  const [specialistData, setSpecialistData] = useState({
    selected: '',
    patientsSeen: ''
  });

  // Handle specialist selection
  const handleSpecialistSelect = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSpecialistData({
      selected: event.target.value as string,
      patientsSeen: ''
    });
  };

  // Handle specialist data change
  const handleSpecialistDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpecialistData({
      ...specialistData,
      patientsSeen: event.target.value
    });
  };

  // Add specialist data to the dataValues
  const addSpecialistData = () => {
    const specialistPrefix = `SPECIALIST_${specialistData.selected.replace(/\s+/g, '_').toUpperCase()}`;
    
    setDataValues([
      ...dataValues,
      {
        dataElementId: specialistPrefix,
        categoryOptionComboId: 'default',
        value: specialistData.patientsSeen
      }
    ]);
    
    // Reset the form
    setSpecialistData({
      selected: '',
      patientsSeen: ''
    });
  };

  // Template for general object form data - used by specialized services
  const [objectFormData, setObjectFormData] = useState({
    service: '',
    type: '',
    section: '',
    data: {
      sampleProcessed: '',
      positiveCases: '',
      negativeCases: '',
      pendingCases: '',
      numberConducted: '',
      reportsIssued: '',
      referredCases: '',
      patientsSeen: '',
      prescriptionIssued: ''
    }
  });

  // Handle service type selection
  const handleServiceTypeSelect = (section: string, service: string) => 
    (event: React.ChangeEvent<{ value: unknown }>) => {
      setObjectFormData({
        ...objectFormData,
        section,
        service,
        type: event.target.value as string,
        data: {
          sampleProcessed: '',
          positiveCases: '',
          negativeCases: '',
          pendingCases: '',
          numberConducted: '',
          reportsIssued: '',
          referredCases: '',
          patientsSeen: '',
          prescriptionIssued: ''
        }
      });
    };

  // Handle object form data change
  const handleObjectDataChange = (field: keyof typeof objectFormData.data) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setObjectFormData({
        ...objectFormData,
        data: {
          ...objectFormData.data,
          [field]: event.target.value
        }
      });
    };

  // Add object form data to the dataValues
  const addObjectData = () => {
    const { section, service, type } = objectFormData;
    const prefix = `${section}_${service}_${type.replace(/\s+/g, '_').toUpperCase()}`;
    
    // Create array of data values to add based on section
    const newDataValues = Object.entries(objectFormData.data)
      .filter(([_, value]) => value !== '') // Only include non-empty values
      .map(([key, value]) => ({
        dataElementId: `${prefix}_${key.toUpperCase()}`,
        categoryOptionComboId: 'default',
        value
      }));
    
    setDataValues([...dataValues, ...newDataValues]);
    
    // Reset the form
    setObjectFormData({
      ...objectFormData,
      type: '',
      data: {
        sampleProcessed: '',
        positiveCases: '',
        negativeCases: '',
        pendingCases: '',
        numberConducted: '',
        reportsIssued: '',
        referredCases: '',
        patientsSeen: '',
        prescriptionIssued: ''
      }
    });
  };

  // Render the TemplateMenuObjectForm component
  const renderTemplateMenuObjectForm = (
    title: string,
    sectionCode: string,
    serviceCode: string,
    options: string[],
    fields: Array<{key: keyof typeof objectFormData.data, label: string}>
  ) => {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        <Paper sx={{ p: 3, mb: 2 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Select Type</InputLabel>
                <Select
                  value={objectFormData.type}
                  onChange={handleServiceTypeSelect(sectionCode, serviceCode)}
                  label="Select Type"
                >
                  {options.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {objectFormData.type && objectFormData.section === sectionCode && objectFormData.service === serviceCode && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Enter data for {objectFormData.type}
              </Typography>
              
              <Grid container spacing={3}>
                {fields.map((field) => (
                  <Grid key={field.key} size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      label={field.label}
                      type="number"
                      value={objectFormData.data[field.key]}
                      onChange={handleObjectDataChange(field.key)}
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={addObjectData}
                >
                  Add Data
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  // Initialize data values
  useEffect(() => {
    if (dataElements.length > 0 && categoryOptionCombos.length > 0 && dataValues.length === 0) {
      const initialValues: DataValue[] = [];
      dataElements.forEach((element: DataElement) => {
        categoryOptionCombos.forEach((combo: CategoryOptionCombo) => {
          initialValues.push({
            dataElementId: element.id,
            categoryOptionComboId: combo.id,
            value: ''
          });
        });
      });
      setDataValues(initialValues);
    }
  }, [dataElements, categoryOptionCombos]);

  const handleReporterInfoChange = (prop: keyof ReporterInfo) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setReporterInfo({ ...reporterInfo, [prop]: event.target.value });
  };

  const handleDateChange = (field: 'reportingMonth' | 'submissionDate') => (date: Date | null) => {
    setReporterInfo({ ...reporterInfo, [field]: date });
  };

  const handleFacilityChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setReporterInfo({ ...reporterInfo, facility: event.target.value as string });
  };

  const handleDataValueChange = (dataElementId: number, categoryOptionComboId: number) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      
      // Only allow numeric values
      if (newValue !== '' && !/^\d+$/.test(newValue)) {
        return;
      }
      
      setDataValues(dataValues.map(dv => 
        dv.dataElementId === dataElementId && dv.categoryOptionComboId === categoryOptionComboId
          ? { ...dv, value: newValue }
          : dv
      ));
    };
      
  const handleDrawing = (newLines: Point[][]) => {
    setLines(newLines);
  };

  // Clear signature
  const clearSignature = () => {
    setSignature('');
  };

  // Handle form submission
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Create payload
      const payload = {
        reportingPeriod: reporterInfo.reportingMonth ? format(reporterInfo.reportingMonth, 'yyyy-MM') : null,
        submissionDate: reporterInfo.submissionDate ? format(reporterInfo.submissionDate, 'yyyy-MM-dd') : null,
        reporter: {
          firstName: reporterInfo.firstName,
          lastName: reporterInfo.lastName,
          contactNumber: reporterInfo.contactNumber,
          email: reporterInfo.email,
        },
        facility: reporterInfo.facility,
        bedCapacity: reporterInfo.bedCapacity,
        dataValues: dataValues.filter(dv => dv.value !== '').map(dv => ({
          dataElement: dataElements.find(de => de.id === dv.dataElementId)?.code,
          categoryOptionCombo: categoryOptionCombos.find(coc => coc.id === dv.categoryOptionComboId)?.code,
          value: dv.value
        })),
        signature
      };
      
      // In a real app, you would send this to your backend
      console.log('Submitting data:', payload);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAlertInfo({
        open: true,
        message: 'Report submitted successfully!',
        severity: 'success'
      });
      
      // Reset form
      setActiveStep(0);
      setReporterInfo({
        firstName: '',
        lastName: '',
        contactNumber: '',
        email: '',
        facility: '',
        reportingMonth: null,
        bedCapacity: '',
        submissionDate: new Date()
      });
      setDataValues([]);
      setSignature('');
    } catch (error) {
      setAlertInfo({
        open: true,
        message: 'Error submitting report. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle step navigation
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };


  // Check if reporter info is complete
  const isReporterInfoComplete = () => {
    return (
      reporterInfo.firstName.trim() !== '' &&
      reporterInfo.lastName.trim() !== '' &&
      reporterInfo.contactNumber.trim() !== '' &&
      reporterInfo.facility.trim() !== '' &&
      reporterInfo.reportingMonth !== null &&
      reporterInfo.bedCapacity.trim() !== ''
    );
  };

  // Render reporter info form
  const renderReporterInfoForm = () => {
    return (
      <FormPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Reporter Information
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="First Name"
              value={reporterInfo.firstName}
              onChange={handleReporterInfoChange('firstName')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Last Name"
              value={reporterInfo.lastName}
              onChange={handleReporterInfoChange('lastName')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Contact Number"
              value={reporterInfo.contactNumber}
              onChange={handleReporterInfoChange('contactNumber')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={reporterInfo.email}
              onChange={handleReporterInfoChange('email')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Facility</InputLabel>
              <Select
                value={reporterInfo.facility}
                label="Facility"
                onChange={(e) => setReporterInfo({ ...reporterInfo, facility: e.target.value as string })}
              >
                {facilities.map((facility) => (
                  <MenuItem key={facility.id} value={facility.name}>
                    {facility.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Reporting Month"
              views={['year', 'month']}
              value={reporterInfo.reportingMonth}
              onChange={handleDateChange('reportingMonth')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Bed Capacity"
              type="number"
              value={reporterInfo.bedCapacity}
              onChange={handleReporterInfoChange('bedCapacity')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Submission Date"
              value={reporterInfo.submissionDate}
              onChange={handleDateChange('submissionDate')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true
                }
              }}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={!isReporterInfoComplete()}
          >
            Next
          </Button>
        </Box>
      </FormPaper>
    );
  };

  // Render general patient statistics form
  const renderDatasetSections = () => {
  
    return (
      <FormPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Dataset Sections
        </Typography>
        
        {/* Main Sections - Always Visible */}
        
        {/* 1. General Patient Statistics */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            General Patient Statistics
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Data is disaggregated by gender and age
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Indicator</StyledTableCell>
                    {genderOptions.map(gender => (
                      ageGroupOptions.map(ageGroup => (
                        <StyledTableCell key={`${gender.id}_${ageGroup.id}`}>
                          {gender.name} / {ageGroup.name}
                        </StyledTableCell>
                      ))
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generalStatsElements.map(element => (
                    <TableRow key={element.id}>
                      <TableCell>{element.name}</TableCell>
                      {genderOptions.map(gender => (
                        ageGroupOptions.map(ageGroup => {
                          // Find the correct category option combo
                          const categoryOptionCombo = categoryOptionCombos.find(
                            combo => combo.id === `${gender.id}_${ageGroup.id}`
                          )?.id || 'default';
                          
                          return (
                            <TableCell key={`${element.id}_${gender.id}_${ageGroup.id}`}>
                              <TextField
                                type="number"
                                size="small"
                                value={findDataValue(element.id, categoryOptionCombo)}
                                onChange={handleDataElementChange(element.id, categoryOptionCombo)}
                                onBlur={handleDataElementChange(element.id, categoryOptionCombo)}
                                InputProps={{ inputProps: { min: 0 } }}
                              />
                            </TableCell>
                          );
                        })
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
        
        {/* 2. Maternal & Child Health */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Maternal & Child Health
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {maternalHealthElements.map(element => (
                <Grid key={element.id} size={{ xs: 12, sm: 6 }}>
                  <QuestionBlock
                    q={createQuestion(element, "Maternal & Child Health")}
                    result={{ value: findDataValue(element.id, 'default') }}
                    handleTextChange={handleDataElementChange(element.id, 'default')}
                    handleOptionChange={() => {}}
                    handleCheckboxChange={() => {}}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
        
        {/* 3. Disease Surveillance */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Disease Surveillance
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Disease</InputLabel>
                  <Select
                    value={diseaseData.selected}
                    onChange={handleDiseaseSelect}
                    label="Select Disease"
                  >
                    {diseasesList.map((disease) => (
                      <MenuItem key={disease} value={disease}>
                        {disease}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            {diseaseData.selected && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Enter data for {diseaseData.selected}
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Number of Cases"
                      type="number"
                      value={diseaseData.cases}
                      onChange={handleDiseaseDataChange('cases')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Number of Deaths"
                      type="number"
                      value={diseaseData.deaths}
                      onChange={handleDiseaseDataChange('deaths')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Number of Referred Cases"
                      type="number"
                      value={diseaseData.referredCases}
                      onChange={handleDiseaseDataChange('referredCases')}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={addDiseaseData}
                  >
                    Add Disease Data
                  </Button>
                </Box>
              </Box>
            )}
            
            {/* Display added disease data */}
            {dataValues.some(dv => dv.dataElementId.startsWith('DISEASE_')) && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Recorded Disease Data
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Disease</StyledTableCell>
                        <StyledTableCell>Cases</StyledTableCell>
                        <StyledTableCell>Deaths</StyledTableCell>
                        <StyledTableCell>Referred</StyledTableCell>
                        <StyledTableCell>Actions</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Group and display disease data */}
                      {/* In a real app, you would need to properly format and group this data */}
                      {/* This is simplified for demonstration */}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Paper>
        </Box>
        
        {/* 4. Emergency Services */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Emergency Services
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {emergencyServicesElements.map(element => (
                <Grid key={element.id} size={{ xs: 12, sm: 6 }}>
                  <QuestionBlock
                    q={createQuestion(element, "Emergency Services")}
                    result={{ value: findDataValue(element.id, 'default') }}
                    handleTextChange={handleDataElementChange(element.id, 'default')}
                    handleOptionChange={() => {}}
                    handleCheckboxChange={() => {}}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
        
        {/* Conditional Sections - Toggle to show/hide */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Specialized Services
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Select the specialized services offered by your facility
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.bloodBank}
                      onChange={() => toggleService('bloodBank')}
                    />
                  }
                  label="Blood Bank"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.surgicalProcedures}
                      onChange={() => toggleService('surgicalProcedures')}
                    />
                  }
                  label="Surgical Procedures"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.specialistServices}
                      onChange={() => toggleService('specialistServices')}
                    />
                  }
                  label="Specialist Services"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.laboratoryTest}
                      onChange={() => toggleService('laboratoryTest')}
                    />
                  }
                  label="Laboratory Test"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.radiologyTest}
                      onChange={() => toggleService('radiologyTest')}
                    />
                  }
                  label="Radiology Test"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.pathologyTest}
                      onChange={() => toggleService('pathologyTest')}
                    />
                  }
                  label="Pathology Test"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.opticianClinic}
                      onChange={() => toggleService('opticianClinic')}
                    />
                  }
                  label="Optician Clinic"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.dermatologyServices}
                      onChange={() => toggleService('dermatologyServices')}
                    />
                  }
                  label="Dermatology Services"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.dermatologyProcedures}
                      onChange={() => toggleService('dermatologyProcedures')}
                    />
                  }
                  label="Dermatology Procedures"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.dentalServices}
                      onChange={() => toggleService('dentalServices')}
                    />
                  }
                  label="Dental Services"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.dentalProcedures}
                      onChange={() => toggleService('dentalProcedures')}
                    />
                  }
                  label="Dental Procedures"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.ophthalmologyServices}
                      onChange={() => toggleService('ophthalmologyServices')}
                    />
                  }
                  label="Ophthalmology Services"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offeredServices.ophthalmologyProcedures}
                      onChange={() => toggleService('ophthalmologyProcedures')}
                    />
                  }
                  label="Ophthalmology Procedures"
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>
        
        {/* Conditional Section: Blood Bank */}
        {offeredServices.bloodBank && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Blood Bank
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {bloodBankElements.map(element => (
                  <Grid key={element.id} size={{ xs: 12, sm: 6 }}>
                    <QuestionBlock
                      q={createQuestion(element, "Blood Bank")}
                      result={{ value: findDataValue(element.id, 'default') }}
                      handleTextChange={handleDataElementChange(element.id, 'default')}
                      handleOptionChange={() => {}}
                      handleCheckboxChange={() => {}}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        )}
        
        {/* Conditional Section: Surgical Procedures */}
        {offeredServices.surgicalProcedures && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Surgical Procedures
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {surgicalProceduresElements.map(element => (
                  <Grid key={element.id} size={{ xs: 12, sm: 6 }}>
                    <QuestionBlock
                      q={createQuestion(element, "Surgical Procedures")}
                      result={{ value: findDataValue(element.id, 'default') }}
                      handleTextChange={handleDataElementChange(element.id, 'default')}
                      handleOptionChange={() => {}}
                      handleCheckboxChange={() => {}}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        )}
        
        {/* Conditional Section: Specialist Services */}
        {offeredServices.specialistServices && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Specialist Services
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Select Specialist Service</InputLabel>
                    <Select
                      value={specialistData.selected}
                      onChange={handleSpecialistSelect}
                      label="Select Specialist Service"
                    >
                      {specialistServicesList.map((service) => (
                        <MenuItem key={service} value={service}>
                          {service}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {specialistData.selected && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Enter data for {specialistData.selected}
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Number of Patients Seen"
                        type="number"
                        value={specialistData.patientsSeen}
                        onChange={handleSpecialistDataChange}
                        />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={addSpecialistData}
                    >
                      Add Specialist Data
                    </Button>
                  </Box>
                </Box>
              )}
              
              {/* Display added specialist data */}
              {dataValues.some(dv => dv.dataElementId.startsWith('SPECIALIST_')) && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Recorded Specialist Services
                  </Typography>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <StyledTableCell>Specialist Service</StyledTableCell>
                          <StyledTableCell>Patients Seen</StyledTableCell>
                          <StyledTableCell>Actions</StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Group and display specialist data */}
                        {/* In a real app, you would need to properly format and group this data */}
                        {/* This is simplified for demonstration */}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>
          </Box>
        )}
        
        {/* Conditional Section: Laboratory Test */}
        {offeredServices.laboratoryTest && 
          renderTemplateMenuObjectForm(
            "Laboratory Test",
            "LAB",
            "TEST",
            laboratoryTestsList,
            [
              { key: 'sampleProcessed', label: 'Samples Processed' },
              { key: 'positiveCases', label: 'Positive Cases' },
              { key: 'negativeCases', label: 'Negative Cases' },
              { key: 'pendingCases', label: 'Pending Cases' }
            ]
          )
        }
        
        {/* Conditional Section: Radiology Test */}
        {offeredServices.radiologyTest && 
          renderTemplateMenuObjectForm(
            "Radiology Test",
            "RAD",
            "TEST",
            radiologyTestsList,
            [
              { key: 'numberConducted', label: 'Number Conducted' },
              { key: 'reportsIssued', label: 'Reports Issued' },
              { key: 'referredCases', label: 'Referred Cases' }
            ]
          )
        }
        
        {/* Conditional Section: Pathology Test */}
        {offeredServices.pathologyTest && 
          renderTemplateMenuObjectForm(
            "Pathology Test",
            "PATH",
            "TEST",
            pathologyTestsList,
            [
              { key: 'sampleProcessed', label: 'Samples Processed' },
              { key: 'positiveCases', label: 'Positive Cases' },
              { key: 'negativeCases', label: 'Negative Cases' },
              { key: 'pendingCases', label: 'Pending Cases' },
              { key: 'reportsIssued', label: 'Reports Issued' }
            ]
          )
        }
        
        {/* Conditional Section: Optician Clinic */}
        {offeredServices.opticianClinic && 
          renderTemplateMenuObjectForm(
            "Optician Clinic",
            "OPT",
            "CLINIC",
            opticianServicesList,
            [
              { key: 'patientsSeen', label: 'Patients Seen' },
              { key: 'prescriptionIssued', label: 'Prescriptions Issued' },
              { key: 'referredCases', label: 'Referred Cases' }
            ]
          )
        }
        
        {/* Conditional Section: Dermatology Services */}
        {offeredServices.dermatologyServices && 
          renderTemplateMenuObjectForm(
            "Dermatology Services",
            "DERM",
            "SERVICES",
            dermatologyServicesList,
            [
              { key: 'patientsSeen', label: 'Patients Seen' },
              { key: 'prescriptionIssued', label: 'Prescriptions Issued' },
              { key: 'referredCases', label: 'Referred Cases' }
            ]
          )
        }
        
        {/* Conditional Section: Dermatology Procedures */}
        {offeredServices.dermatologyProcedures && 
          renderTemplateMenuObjectForm(
            "Dermatology Procedures",
            "DERM",
            "PROCEDURES",
            dermatologyProceduresList,
            [
              { key: 'numberConducted', label: 'Number Conducted' },
              { key: 'referredCases', label: 'Referred Cases' }
            ]
          )
        }
        
        {/* Conditional Section: Dental Services */}
        {offeredServices.dentalServices && 
          renderTemplateMenuObjectForm(
            "Dental Services",
            "DENTAL",
            "SERVICES",
            dentalServicesList,
            [
              { key: 'patientsSeen', label: 'Patients Seen' },
              { key: 'prescriptionIssued', label: 'Prescriptions Issued' },
              { key: 'referredCases', label: 'Referred Cases' }
            ]
          )
        }
        
        {/* Conditional Section: Dental Procedures */}
        {offeredServices.dentalProcedures && 
          renderTemplateMenuObjectForm(
            "Dental Procedures",
            "DENTAL",
            "PROCEDURES",
            dentalProceduresList,
            [
              { key: 'numberConducted', label: 'Number Conducted' },
              { key: 'referredCases', label: 'Referred Cases' }
            ]
          )
        }
        
        {/* Conditional Section: Ophthalmology Services */}
        {offeredServices.ophthalmologyServices && 
          renderTemplateMenuObjectForm(
            "Ophthalmology Services",
            "OPHTH",
            "SERVICES",
            ophthalmologyServicesList,
            [
              { key: 'patientsSeen', label: 'Patients Seen' },
              { key: 'prescriptionIssued', label: 'Prescriptions Issued' },
              { key: 'referredCases', label: 'Referred Cases' }
            ]
          )
        }
        
        {/* Conditional Section: Ophthalmology Procedures */}
        {offeredServices.ophthalmologyProcedures && 
          renderTemplateMenuObjectForm(
            "Ophthalmology Procedures",
            "OPHTH",
            "PROCEDURES",
            ophthalmologyProceduresList,
            [
              { key: 'numberConducted', label: 'Number Conducted' },
              { key: 'referredCases', label: 'Referred Cases' }
            ]
          )
        }
        
        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => setActiveStep(activeStep - 1)}
            startIcon={<ArrowBack />}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            onClick={() => setActiveStep(activeStep + 1)}
            endIcon={<ArrowForward />}
          >
            Next
          </Button>
        </Box>
      </FormPaper>
    );
  };

  // Render review and submit form
  const renderReviewForm = () => {
    return (
      <FormPaper elevation={2}>
        <Typography variant="h6" gutterBottom>
          Review & Submit
        </Typography>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Reporter Information
            </Typography>
            <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Name:</strong> {reporterInfo.firstName} {reporterInfo.lastName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Contact:</strong> {reporterInfo.contactNumber}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Email:</strong> {reporterInfo.email || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Facility:</strong> {reporterInfo.facility}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Reporting Month:</strong> {reporterInfo.reportingMonth 
                    ? format(reporterInfo.reportingMonth, 'MMMM yyyy') 
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Bed Capacity:</strong> {reporterInfo.bedCapacity}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2">
                  <strong>Submission Date:</strong> {reporterInfo.submissionDate 
                    ? format(reporterInfo.submissionDate, 'dd MMMM yyyy') 
                    : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              General Patient Statistics
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Indicators</StyledTableCell>
                    {categoryOptionCombos.map((combo: CategoryOptionCombo) => (
                      <StyledTableCell key={combo.id} align="center">
                        {combo.name}
                      </StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataElements.map((element: DataElement) => (
                    <TableRow key={element.id}>
                      <TableCell component="th" scope="row">
                        {element.name}
                      </TableCell>
                      {categoryOptionCombos.map((combo: CategoryOptionCombo) => {
                        const dataValue = dataValues.find(
                          dv => dv.dataElementId === element.id && dv.categoryOptionComboId === combo.id
                        );
                        return (
                          <TableCell key={`${element.id}-${combo.id}`} align="center">
                            {dataValue?.value || '-'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Signature
            </Typography>
            <Box sx={{ border: '1px dashed grey', p: 2, mb: 2 }}>
              <SignatureCanvas
                lines={lines}
                onDraw={handleDrawing}
                width={400}
                height={200}
                className="w-[400px] h-[200px] border-2 border-gray-300 rounded shadow-sm"
              />
            </Box>
            {signature ? (
              <Box>
                <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                  Signature recorded
                </Typography>
                <Button size="small" variant="outlined" onClick={clearSignature}>
                  Clear Signature
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="error">
                Please sign above to complete the submission
              </Typography>
            )}
          </CardContent>
        </Card>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button variant="outlined" onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting || !signature}
          >
            {submitting ? (
              <CircularProgress size={24} />
            ) : (
              'Submit Report'
            )}
          </Button>
        </Box>
      </FormPaper>
    );
  };

  // Render the active step
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return renderReporterInfoForm();
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
    <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
      <HeaderAppBar>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="back" sx={{ mr: 2 }}>
            <FuseSvgIcon>heroicons-outline:arrow-left</FuseSvgIcon>
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Hospital Report
          </Typography>
        </Toolbar>
      </HeaderAppBar>
      
      <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }} orientation="vertical">
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {renderStep()}
      
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={() => setAlertInfo({ ...alertInfo, open: false })}
      >
        <Alert 
          onClose={() => setAlertInfo({ ...alertInfo, open: false })} 
          severity={alertInfo.severity}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HospitalReportForm;