import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';
import { fileApi } from '../../services/api';
import DataTable from '../../components/DataTable/DataTable';
import type { PunchDataFile } from '../../types';
import './Files.css';

export default function Files() {
  const [files, setFiles] = useState<PunchDataFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response: any = await fileApi.getAll();
      
      console.log('Files API Response:', response);
      
      if (response.error) {
        setError(response.error);
        setFiles([]);
      } else {
        // Handle different response formats
        let filesData: PunchDataFile[] = [];
        if (Array.isArray(response)) {
          filesData = response;
        } else if (response.files) {
          filesData = Array.isArray(response.files) ? response.files : [response.files];
        } else if (response.data) {
          filesData = Array.isArray(response.data) ? response.data : [response.data];
        }
        console.log('Files data:', filesData);
        setFiles(filesData);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (fileId: number) => {
    try {
      const response = await fileApi.process(fileId);
      if (response.error) {
        alert(`Error: ${response.error}`);
      } else {
        alert('File processed successfully!');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const columns = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'filename', header: 'Filename', sortable: true },
    { 
      key: 'from_date', 
      header: 'From Date', 
      sortable: true,
      render: (value: string) => value || '-'
    },
    { 
      key: 'to_date', 
      header: 'To Date', 
      sortable: true,
      render: (value: string) => value || '-'
    },
    { 
      key: 'total_records', 
      header: 'Total Records', 
      sortable: true,
      render: (value: number) => value?.toLocaleString() || '0'
    },
    { 
      key: 'unique_employees', 
      header: 'Unique Employees', 
      sortable: true,
      render: (value: number) => value?.toLocaleString() || '0'
    },
    { 
      key: 'created_at', 
      header: 'Created At', 
      sortable: true,
      render: (value: string) => value ? new Date(value).toLocaleString() : '-'
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_: any, row: PunchDataFile) => (
        <div className="action-buttons">
          {row.blob_url && (
            <a
              href={row.blob_url}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn download-btn"
            >
              <Download size={14} />
            </a>
          )}
          <button
            className="action-btn process-btn"
            onClick={() => handleProcess(row.id)}
          >
            Process
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="files-page">
      <div className="page-header">
        <div>
          <h2>Punch Data Files</h2>
          <p>View and manage stored punch data files</p>
        </div>
        <button className="refresh-btn" onClick={loadFiles} disabled={loading}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <DataTable
        data={files}
        columns={columns}
        loading={loading}
        searchable={true}
        searchKeys={['filename', 'from_date', 'to_date']}
      />

      {!loading && files.length === 0 && !error && (
        <div className="empty-state">
          <FileText size={48} />
          <p>No files found</p>
        </div>
      )}
    </div>
  );
}

