import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { motion } from 'framer-motion';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: theme.shadows[1],
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  }
}));

const CategoryIcon = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
  color: theme.palette.common.white,
}));

/**
 * Health Report Home Dashboard
 * Landing page for the Health Report application
 */
function LandingPage() {
  const [activeTab, setActiveTab] = useState('forms');
  const [newReportDialogOpen, setNewReportDialogOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [recentSubmissions, setRecentSubmissions] = useState([]);

  useEffect(() => {
    // Fetch recent submissions from API or local storage
    // This is a mock of what might be fetched
    setRecentSubmissions([
      {
        id: '1',
        reportType: 'Hospital Report',
        facility: 'General Hospital',
        submittedBy: 'John Doe',
        submittedOn: '2025-02-28',
        status: 'Complete'
      },
      {
        id: '2',
        reportType: 'Laboratory Report',
        facility: 'Central Lab',
        submittedBy: 'Jane Smith',
        submittedOn: '2025-02-26',
        status: 'Pending'
      },
      {
        id: '3',
        reportType: 'Radiology Report',
        facility: 'Imaging Center',
        submittedBy: 'Robert Johnson',
        submittedOn: '2025-02-24',
        status: 'Complete'
      }
    ]);
  }, []);

  const container = {
    show: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const reportCategories = [
    {
      title: 'Hospital Report',
      icon: 'heroicons-outline:building-office-2',
      description: 'Complete hospital data reporting including patient statistics, maternal health, and more',
      color: '#1E88E5',
      url: '/apps/ihrs/hospital-report'
    },
    {
      title: 'Laboratory Report',
      icon: 'heroicons-outline:beaker',
      description: 'Pathology tests and laboratory services data collection',
      color: '#43A047',
      url: '/apps/ihrs/laboratory-report'
    },
    {
      title: 'Radiology Report',
      icon: 'heroicons-outline:film',
      description: 'X-Ray, Ultrasound, CT Scan and MRI services reporting',
      color: '#FB8C00',
      url: '/apps/ihrs/radiology-report'
    },
    {
      title: 'Dermatology Clinic/Department',
      icon: 'heroicons-outline:eye-dropper',
      description: 'Dermatology services and procedures tracking',
      color: '#EC407A',
      url: '/apps/ihrs/dermatology-clinic-report'
    },
    {
      title: 'Dental Clinic',
      icon: 'heroicons-outline:ticket',
      description: 'Dental services and procedures reporting',
      color: '#7E57C2',
      url: '/apps/ihrs/dental-clinic-report'
    },
    {
      title: 'Ophthalmology Clinic/Department',
      icon: 'heroicons-outline:eye',
      description: 'Ophthalmology services and surgeries reporting',
      color: '#26A69A',
      url: '/apps/ihrs/opthalmology-clinic-report'
    },
    {
      title: 'Optician Clinic/Department',
      icon: 'heroicons-outline:eye',
      description: 'Optician services and prescription data',
      color: '#5C6BC0',
      url: '/apps/ihrs/optician-clinic-report'
    }
  ];

  const handleNewReportOpen = () => {
    setNewReportDialogOpen(true);
  };

  const handleNewReportClose = () => {
    setNewReportDialogOpen(false);
    setSelectedReportType('');
  };

  const handleSupportDialogOpen = () => {
    setSupportDialogOpen(true);
  };

  const handleSupportDialogClose = () => {
    setSupportDialogOpen(false);
  };

  const handleCreateNewReport = () => {
    // Navigate to the selected report form
    if (selectedReportType) {
      const selectedCategory = reportCategories.find(cat => cat.title === selectedReportType);
      if (selectedCategory) {
        window.location.href = selectedCategory.url;
      }
    }
    handleNewReportClose();
  };

  const handleSubmitSupport = () => {
    // Handle support request submission
    // This would typically involve an API call
    handleSupportDialogClose();
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 p-6 w-full bg-primary-50 dark:bg-primary-900 rounded-xl mb-8">
        <div className="flex flex-col flex-1">
          <Typography 
            className="text-2xl md:text-3xl font-bold" 
            color="primary"
          >
            Integrated Health Report System App
          </Typography>
          <Typography className="mt-2 text-lg">
            Welcome to the DATAORB Integrated Health Report System. Select a form category below to begin data entry or review submitted reports.
          </Typography>
          
          <Box className="flex space-x-4 mt-4">
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              startIcon={<FuseSvgIcon>heroicons-outline:clipboard-document-check</FuseSvgIcon>}
              onClick={handleNewReportOpen}
            >
              New Report
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              startIcon={<FuseSvgIcon>heroicons-outline:chart-bar</FuseSvgIcon>}
            >
              View Statistics
            </Button>
          </Box>
        </div>
        <div className="flex justify-center sm:justify-end">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.3 }}
          >
            <img 
              src="/assets/images/ilogo/firebase.svg" 
              alt="Health Report" 
              className="w-64 h-64 object-contain"
            />
          </motion.div>
        </div>
      </div>

      <Paper className="mb-8 overflow-hidden">
        <Box className="border-b px-6 py-2">
          <Box className="flex">
            <Button 
              className={activeTab === 'forms' ? 'border-b-2 border-primary-500' : ''}
              onClick={() => setActiveTab('forms')}
            >
              Report Forms
            </Button>
            <Button 
              className={activeTab === 'submissions' ? 'border-b-2 border-primary-500' : ''}
              onClick={() => setActiveTab('submissions')}
            >
              Recent Submissions
            </Button>
            <Button 
              className={activeTab === 'help' ? 'border-b-2 border-primary-500' : ''}
              onClick={() => setActiveTab('help')}
            >
              Help & Guidelines
            </Button>
          </Box>
        </Box>

        {activeTab === 'forms' && (
          <Box className="p-6">
            <Typography className="text-xl font-semibold mb-6">Available Report Forms</Typography>
            
            <motion.div
              className="flex flex-wrap"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <Grid container spacing={3}>
                {reportCategories.map((category, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                    <motion.div variants={item}>
                      <StyledCard className="h-full">
                        <CardContent className="flex flex-col h-full p-4">
                          <CategoryIcon style={{ backgroundColor: category.color }}>
                            <FuseSvgIcon size={24}>{category.icon}</FuseSvgIcon>
                          </CategoryIcon>
                          <Typography className="text-lg font-medium mb-2">{category.title}</Typography>
                          <Typography className="text-secondary flex-1 mb-4">{category.description}</Typography>
                          <Button 
                            variant="text" 
                            color="primary" 
                            className="mt-auto self-end"
                            href={category.url}
                            endIcon={<FuseSvgIcon size={18}>heroicons-outline:arrow-right</FuseSvgIcon>}
                          >
                            Open Form
                          </Button>
                        </CardContent>
                      </StyledCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Box>
        )}

        {activeTab === 'submissions' && (
          <Box className="p-6">
            <Typography className="text-xl font-semibold mb-6">Recent Submissions</Typography>
            <TableContainer>
              <Table aria-label="recent submissions table">
                <TableHead>
                  <TableRow>
                    <TableCell>Report Type</TableCell>
                    <TableCell>Facility</TableCell>
                    <TableCell>Submitted By</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.reportType}</TableCell>
                      <TableCell>{submission.facility}</TableCell>
                      <TableCell>{submission.submittedBy}</TableCell>
                      <TableCell>{submission.submittedOn}</TableCell>
                      <TableCell>
                        <Chip 
                          label={submission.status} 
                          color={submission.status === 'Complete' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          startIcon={<FuseSvgIcon size={16}>heroicons-outline:eye</FuseSvgIcon>}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeTab === 'help' && (
          <Box className="p-6">
            <Typography className="text-xl font-semibold mb-6">Help & Guidelines</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Reporting Guidelines</Typography>
                    <Typography paragraph>
                      All health facilities must submit their reports by the 5th of the following month.
                      Ensure all data is verified before submission.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<FuseSvgIcon>heroicons-outline:document-text</FuseSvgIcon>}
                    >
                      Download Guidelines
                    </Button>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Video Tutorials</Typography>
                    <Typography paragraph>
                      Watch step-by-step tutorials on how to use the DATAORB Health Report system.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<FuseSvgIcon>heroicons-outline:play</FuseSvgIcon>}
                    >
                      View Tutorials
                    </Button>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Frequently Asked Questions</Typography>
                    <Typography paragraph>
                      Find answers to common questions about the reporting process and system usage.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<FuseSvgIcon>heroicons-outline:question-mark-circle</FuseSvgIcon>}
                    >
                      View FAQs
                    </Button>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      <Box className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-8">
        <StyledCard className="flex-1">
          <CardContent>
            <Typography className="text-lg font-medium mb-2">Reporting Deadlines</Typography>
            <Typography color="textSecondary" className="mb-4">
              Monthly reports are due by the 5th of the following month.
            </Typography>
            <Box className="flex justify-between items-center">
              <Typography className="text-lg font-bold text-error">
                Next Deadline: April 5, 2025
              </Typography>
              <FuseSvgIcon color="error">heroicons-outline:clock</FuseSvgIcon>
            </Box>
          </CardContent>
        </StyledCard>
        
        <StyledCard className="flex-1">
          <CardContent>
            <Typography className="text-lg font-medium mb-2">Need Assistance?</Typography>
            <Typography color="textSecondary" className="mb-4">
              Contact your district health information officer or technical support.
            </Typography>
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<FuseSvgIcon>heroicons-outline:chat-bubble-left-right</FuseSvgIcon>}
              onClick={handleSupportDialogOpen}
            >
              Contact Support
            </Button>
          </CardContent>
        </StyledCard>
      </Box>

      {/* New Report Dialog */}
      <Dialog open={newReportDialogOpen} onClose={handleNewReportClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Report</DialogTitle>
        <DialogContent>
          <Typography paragraph className="mt-2">
            Select the type of report you want to create:
          </Typography>
          <FormControl fullWidth className="mt-4">
            <InputLabel id="report-type-label">Report Type</InputLabel>
            <Select
              labelId="report-type-label"
              value={selectedReportType}
              label="Report Type"
              onChange={(e) => setSelectedReportType(e.target.value)}
            >
              {reportCategories.map((category) => (
                <MenuItem key={category.title} value={category.title}>
                  {category.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewReportClose}>Cancel</Button>
          <Button 
            onClick={handleCreateNewReport} 
            variant="contained" 
            color="primary"
            disabled={!selectedReportType}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Support Dialog */}
      <Dialog open={supportDialogOpen} onClose={handleSupportDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Contact Support</DialogTitle>
        <DialogContent>
          <Typography paragraph className="mt-2">
            Please provide details about your issue or question:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Your Name"
            type="text"
            fullWidth
            variant="outlined"
            className="mb-4"
          />
          <TextField
            margin="dense"
            id="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            className="mb-4"
          />
          <TextField
            margin="dense"
            id="facility"
            label="Facility Name"
            type="text"
            fullWidth
            variant="outlined"
            className="mb-4"
          />
          <FormControl fullWidth className="mb-4">
            <InputLabel id="issue-type-label">Issue Type</InputLabel>
            <Select
              labelId="issue-type-label"
              label="Issue Type"
              defaultValue=""
            >
              <MenuItem value="technical">Technical Problem</MenuItem>
              <MenuItem value="data">Data Question</MenuItem>
              <MenuItem value="account">Account Access</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            id="message"
            label="Message"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSupportDialogClose}>Cancel</Button>
          <Button onClick={handleSubmitSupport} variant="contained" color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default LandingPage;