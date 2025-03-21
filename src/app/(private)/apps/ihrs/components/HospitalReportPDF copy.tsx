import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { DataValuePayload, DataRecordPayload, DataSet, Section, Point } from '../types';
import SignatureRenderer from './SignatureRenderer';

// Define interfaces for props and internal data structures
interface HospitalReportPDFProps {
  dataset: DataSet;
  organization: {
    id: string;
    name: string;
    level?: number;
  };
  period: string;
  reporterName: string; // Added new prop
  signature: Point[][]; // Added new prop
  mainSectionData: SectionData[];
  dynamicSectionData: SectionData[];
  submittedValues: DataValuePayload[];
  submittedRecords: DataRecordPayload[];
  metadata: {
    dataElements: Array<{
      uid: string;
      name: string;
    }>;
    categoryOptionCombos: Array<{
      id: string;
      name: string;
    }>;
  };
}

interface SectionData {
  section: Section;
  elements: Array<{
    uid: string;
    name: string;
  }>;
  values: DataValuePayload[];
  records: DataRecordPayload[];
}

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    justifyContent: 'space-between'
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottom: '1pt solid #ddd',
    paddingBottom: 10
  },
  infoColumn: {
    flex: 1
  },
  infoLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2
  },
  infoValue: {
    fontSize: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8
  },
  dataRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #eee',
    paddingVertical: 6,
    alignItems: 'center'
  },
  dataLabel: {
    flex: 2,
    fontSize: 10
  },
  dataValue: {
    flex: 1,
    fontSize: 10,
    textAlign: 'right',
    fontWeight: 'bold'
  },
  recordContainer: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4
  },
  recordTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    borderTop: '0.5pt solid #ddd',
    paddingTop: 10
  },
  signature: {
    marginTop: 30,
    marginBottom: 30,
    height: 80,
    borderBottom: '1pt solid #000'
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 10,
    color: '#666'
  },
  summaryBox: {
    marginTop: 20,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
    borderLeft: '4pt solid #4682b4'
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#4682b4'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3
  },
  noData: {
    fontStyle: 'italic',
    color: '#666',
    marginTop: 5
  },
  signatureSection: {
    marginTop: 40,
    borderTop: '1pt solid #ddd',
    paddingTop: 20
  },
  signatureBox: {
    height: 100,
    border: '1pt solid #ddd',
    marginBottom: 10
  },
  signatureLine: {
    width: 250,
    borderBottom: '1pt solid #000',
    marginTop: 60,
    marginBottom: 5
  },
  signatureLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center'
  },
  dateLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 20
  }
});

/**
 * Component for rendering a hospital report as a PDF
 */
const HospitalReportPDF: React.FC<HospitalReportPDFProps> = ({ 
  dataset, 
  organization, 
  period, 
  reporterName,
  signature,
  mainSectionData,
  dynamicSectionData,
  submittedValues,
  submittedRecords,
  metadata
}) => {
  /**
   * Get the name of a data element by its ID
   */
  const getElementName = (elementId: string): string => {
    const element = metadata.dataElements.find(el => el.uid === elementId);
    return element ? element.name : elementId;
  };
  
  /**
   * Get the name of a category option combo by its ID
   */
  const getCategoryOptionComboName = (cocId: string): string => {
    const coc = metadata.categoryOptionCombos.find(c => c.id === cocId);
    return coc ? coc.name : cocId;
  };
  
  /**
   * Calculate summary statistics
   */
  const calculateSummary = () => {
    const totalValues = submittedValues.length;
    const totalRecords = submittedRecords.length;
    const uniqueDataElements = new Set([
      ...submittedValues.map(v => v.dataElement),
      ...submittedRecords.map(r => r.dataElement)
    ]).size;
    
    return {
      totalEntries: totalValues + totalRecords,
      totalValues,
      totalRecords,
      uniqueDataElements,
      completedSections: [...mainSectionData, ...dynamicSectionData].filter(
        section => section.values.length > 0 || section.records.length > 0
      ).length
    };
  };

  /**
   * Render a section's data in the PDF
   */
  const renderSectionData = (sectionData: SectionData) => {
    const { section, values, records } = sectionData;
    
    return (
      <View key={section.id} style={{ marginBottom: 20 }}>
        <Text style={styles.sectionTitle}>{section.name}</Text>
        
        {/* Render values */}
        {values.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.subsectionTitle}>Data Values</Text>
            {values.map((value, index) => (
              <View key={`value-${section.id}-${index}`} style={styles.dataRow}>
                <Text style={styles.dataLabel}>
                  {getElementName(value.dataElement)}
                  {value.categoryOptionCombo && ` - ${getCategoryOptionComboName(value.categoryOptionCombo)}`}
                </Text>
                <Text style={styles.dataValue}>{value.value}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Render records */}
        {records.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.subsectionTitle}>Records</Text>
            {records.map((record, index) => (
              <View key={`record-${section.id}-${index}`} style={styles.recordContainer}>
                <Text style={styles.recordTitle}>{getElementName(record.dataElement) || 'Record'}</Text>
                {Object.entries(record.data || {}).map(([key, value], idx) => (
                  <View key={`record-item-${index}-${idx}`} style={styles.dataRow}>
                    <Text style={styles.dataLabel}>{key}</Text>
                    <Text style={styles.dataValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
        
        {/* No data message */}
        {values.length === 0 && records.length === 0 && (
          <Text style={styles.noData}>
            No data entered for this section
          </Text>
        )}
      </View>
    );
  };

  /**
   * Format current date for report
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const currentDate = formatDate(new Date());
  const summary = calculateSummary();

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image 
            src="/assets/images/logo/logo.svg" 
            style={{ width: 120, marginBottom: 40 }} 
          />
          <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 20 }}>Hospital Report</Text>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>{dataset?.name || 'Unknown Dataset'}</Text>
          <Text style={{ fontSize: 16, marginBottom: 30 }}>{organization?.name || 'Unknown Organization'}</Text>
          <Text style={{ fontSize: 14 }}>Reporting Period: {period}</Text>
          <Text style={{ fontSize: 14, marginBottom: 40 }}>Generated on: {currentDate}</Text>
          <Text style={{ marginBottom: 10 }}>Reporter: {reporterName}</Text>
        </View>
        <Text style={styles.pageNumber}>1</Text>
      </Page>

      {/* Dataset Information Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Hospital Report</Text>
            <Text style={styles.subtitle}>{dataset?.name || 'Unknown Dataset'}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text>Report ID: {Math.random().toString(36).slice(2, 9).toUpperCase()}</Text>
            <Text>Date: {currentDate}</Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Organization</Text>
            <Text style={styles.infoValue}>{organization?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Reporting Period</Text>
            <Text style={styles.infoValue}>{period}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Dataset</Text>
            <Text style={styles.infoValue}>{dataset?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Reporter</Text>
            <Text style={styles.infoValue}>{reporterName || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Report Summary</Text>
          <View style={styles.summaryRow}>
            <Text>Total Data Entries:</Text>
            <Text>{summary.totalEntries}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Data Values:</Text>
            <Text>{summary.totalValues}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Data Records:</Text>
            <Text>{summary.totalRecords}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Unique Data Elements:</Text>
            <Text>{summary.uniqueDataElements}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Completed Sections:</Text>
            <Text>{summary.completedSections}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 30, marginBottom: 10 }}>
          Required Information
        </Text>
        
        {mainSectionData.length > 0 ? (
          mainSectionData.map(renderSectionData)
        ) : (
          <Text style={styles.noData}>No required information data available</Text>
        )}

        <Text style={styles.pageNumber}>2</Text>
      </Page>

      {/* Specialized Services Page */}
      {dynamicSectionData.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Hospital Report</Text>
              <Text style={styles.subtitle}>{dataset?.name || 'Unknown Dataset'}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text>Date: {currentDate}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 10 }}>
            Specialized Services
          </Text>
          
          {dynamicSectionData.map(renderSectionData)}
          
          <Text style={styles.pageNumber}>3</Text>
        </Page>
      )}

      {/* Signature Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Hospital Report</Text>
            <Text style={styles.subtitle}>{dataset?.name || 'Unknown Dataset'}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text>Date: {currentDate}</Text>
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' }}>
            Certification
          </Text>
          
          <Text style={{ marginBottom: 20 }}>
            I hereby certify that the information provided in this report is true, accurate, and complete to the best of my knowledge.
          </Text>
          
          <View style={styles.signatureSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: '45%' }}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Signature of Hospital Director</Text>
                <Text style={styles.dateLabel}>Date: _________________</Text>
              </View>
              
              <View style={{ width: '45%' }}>
                <View style={styles.signatureBox}>
                  {signature && signature.length > 0 && (
                    <SignatureRenderer paths={signature} />
                  )}
                </View>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Signature of Data Officer</Text>
              </View>
            </View>
          </View>
          
          <View style={{ marginTop: 50 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Official Use Only</Text>
            <View style={{ borderTop: '1pt solid #ddd', paddingTop: 10 }}>
              <Text style={{ marginBottom: 20 }}>Received by: __________________________ Date: __________________</Text>
              <Text>Verified by: __________________________ Date: __________________</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>This report was generated using the Hospital Reporting System © {new Date().getFullYear()}</Text>
          <Text>Confidential - For authorized use only</Text>
        </View>
        
        <Text style={styles.pageNumber}>{dynamicSectionData.length > 0 ? '4' : '3'}</Text>
      </Page>
    </Document>
  );
};

export default HospitalReportPDF;