'use client';

import React, { useState } from 'react';
import { parseMatchesCSV } from '../lib/csv';
import { useMatches } from '../app/contexts/MatchesContext';
import { track } from '../lib/analytics';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AlertModal {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function CSVImportModal({ isOpen, onClose }: CSVImportModalProps) {
  const { addMatchesBulk, matches } = useMatches();
  const [csvText, setCsvText] = useState('');
  const [previewData, setPreviewData] = useState<{ validMatches: any[]; errors: string[]; duplicateCount: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [alertModal, setAlertModal] = useState<AlertModal>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  if (!isOpen) return null;

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  const handlePreview = () => {
    if (!csvText.trim()) {
      showAlert('Missing Data', 'Please paste CSV data first', 'error');
      return;
    }
    
    const result = parseMatchesCSV(csvText, matches);
    setPreviewData(result);
  };

  const handleImport = async () => {
    if (!previewData || previewData.validMatches.length === 0) {
      showAlert('Import Error', 'No valid matches to import', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const importedCount = addMatchesBulk(previewData.validMatches);
      
      // Track the CSV import success
      track('csv_import', {
        rows_added: importedCount,
        rows_error: previewData.errors.length,
        rows_duplicate: previewData.duplicateCount,
      });
      
      // Success modal with detailed feedback
      const successMessage = `Import complete: ${importedCount} matches added, ${previewData.errors.length} rows with errors skipped, ${previewData.duplicateCount} duplicates skipped.`;
      
      showAlert('Import Successful', successMessage, 'success');
      
      // Auto-close the main modal after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      showAlert('Import Failed', `Import failed: ${error}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setCsvText('');
    setPreviewData(null);
    setIsImporting(false);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvText(text);
      };
      reader.readAsText(file);
    } else {
      showAlert('Invalid File', 'Please select a valid CSV file', 'error');
    }
  };

  const copyHeaders = () => {
    // ORIGINAL FORMAT - Individual player columns with scores and winner
    const headers = 'date,time,status,tournamentName,drawName,round,court,team1player1,team1player2,team1seed,team2player1,team2player2,team2seed,scores,winner';
    navigator.clipboard.writeText(headers).then(() => {
      showAlert('Success', 'Headers copied to clipboard!', 'success');
    }).catch(() => {
      showAlert('Copy Failed', 'Failed to copy headers', 'error');
    });
  };

  // Create a map of row errors for highlighting
  const getRowErrorMap = () => {
    const errorMap: { [key: number]: string } = {};
    if (previewData) {
      previewData.errors.forEach(error => {
        const match = error.match(/Row (\d+):/);
        if (match) {
          const rowNum = parseInt(match[1]) - 2; // Convert to 0-based index, excluding header
          errorMap[rowNum] = error;
        }
      });
    }
    return errorMap;
  };

  const rowErrorMap = getRowErrorMap();

  const getAlertModalColors = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-surface-light rounded-lg p-4 sm:p-6 w-full max-w-5xl mx-2 sm:mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-onSurface">Import Matches from CSV</h2>
            <button
              onClick={handleClose}
              className="text-onSurface/60 hover:text-onSurface text-2xl"
            >
              ×
            </button>
          </div>

          {/* CSV Format Help - ORIGINAL FORMAT */}
          <div className="mb-4 p-3 sm:p-4 bg-surface rounded border border-divider">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
              <h3 className="font-medium text-onSurface">Required CSV Format:</h3>
              <button
                onClick={copyHeaders}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white self-start sm:self-auto"
              >
                Copy Headers
              </button>
            </div>
            <code className="text-xs sm:text-sm text-onSurface/80 bg-surface-light p-2 rounded block overflow-x-auto">
              date,time,status,tournamentName,drawName,round,court,team1player1,team1player2,team1seed,team2player1,team2player2,team2seed,scores,winner
            </code>
            <div className="text-xs sm:text-sm text-onSurface/60 mt-2 space-y-1">
              <p><strong>• Individual Player Columns:</strong> team1player1, team1player2, team2player1, team2player2</p>
              <p><strong>• For Singles:</strong> Leave team1player2 and team2player2 empty</p>
              <p><strong>• Scores Format:</strong> "11-5, 5-11, 11-8" (comma-separated games, hyphen-separated scores)</p>
              <p><strong>• Winner:</strong> "team1" or "team2" (for completed matches)</p>
              <p><strong>• Date:</strong> YYYY-MM-DD format</p>
              <p><strong>• Time:</strong> HH:MM format (24-hour)</p>
              <p><strong>• Status:</strong> Live, Upcoming, Completed, Forfeit, or Walkover</p>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Upload CSV File:</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer"
            />
          </div>

          {/* CSV Text Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Or Paste CSV Data:</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste your CSV data here..."
              className="w-full h-32 sm:h-40 px-3 py-2 bg-surface text-onSurface rounded border border-divider focus:border-green-500 focus:outline-none text-xs sm:text-sm font-mono"
            />
          </div>

          {/* Preview Button */}
          <div className="mb-4">
            <button
              onClick={handlePreview}
              disabled={!csvText.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 px-4 py-2 rounded text-white font-medium w-full sm:w-auto"
            >
              Preview Matches
            </button>
          </div>

          {/* Preview Results */}
          {previewData && (
            <div className="mb-6">
              {/* Summary Stats */}
              <div className="mb-4 p-3 bg-surface rounded border border-divider">
                <div className="text-sm text-onSurface">
                  <strong>Preview Summary:</strong> {previewData.validMatches.length} valid matches, {previewData.errors.length} errors, {previewData.duplicateCount} duplicates
                </div>
              </div>

              {/* Errors */}
              {previewData.errors.length > 0 && (
                <div className="mb-4 p-3 sm:p-4 bg-red-900/20 border border-red-600 rounded">
                  <h3 className="font-medium text-red-400 mb-2">Errors ({previewData.errors.length}):</h3>
                  <ul className="text-xs sm:text-sm text-red-300 space-y-1 max-h-32 overflow-y-auto">
                    {previewData.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Valid Matches Preview */}
              {previewData.validMatches.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-onSurface mb-3">
                    Valid Matches ({previewData.validMatches.length}):
                  </h3>
                  <div className="max-h-60 overflow-y-auto bg-surface rounded border border-divider overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-full">
                      <thead className="bg-surface-light sticky top-0">
                        <tr>
                          <th className="text-left p-2 border-b border-divider whitespace-nowrap">Date</th>
                          <th className="text-left p-2 border-b border-divider whitespace-nowrap">Tournament</th>
                          <th className="text-left p-2 border-b border-divider whitespace-nowrap">Draw</th>
                          <th className="text-left p-2 border-b border-divider whitespace-nowrap">Team 1</th>
                          <th className="text-left p-2 border-b border-divider whitespace-nowrap">Team 2</th>
                          <th className="text-left p-2 border-b border-divider whitespace-nowrap">Scores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.validMatches.map((match, index) => {
                          const hasError = rowErrorMap[index] !== undefined;
                          const formatScores = (scores1: number[], scores2: number[]) => {
                            if (scores1.length === 0) return '-';
                            return scores1.map((s1, i) => `${s1}-${scores2[i] || 0}`).join(', ');
                          };
                          
                          return (
                            <tr 
                              key={index} 
                              className={`border-b border-divider ${hasError ? 'bg-red-700/40 text-red-100' : ''}`}
                              title={hasError ? rowErrorMap[index] : undefined}
                            >
                              <td className="p-2 text-onSurface whitespace-nowrap">{match.date}</td>
                              <td className="p-2 text-onSurface">{match.tournamentName}</td>
                              <td className="p-2 text-onSurface">{match.drawName}</td>
                              <td className="p-2 text-onSurface">
                                {match.team1.players.map((p: any) => p.name).join(' / ')}
                                {hasError && <span className="ml-2 px-1 py-0.5 bg-red-600 text-white text-xs rounded">Error</span>}
                              </td>
                              <td className="p-2 text-onSurface">
                                {match.team2.players.map((p: any) => p.name).join(' / ')}
                              </td>
                              <td className="p-2 text-onSurface whitespace-nowrap">
                                {formatScores(match.setScoresTeam1, match.setScoresTeam2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-surface rounded hover:bg-surface-light border border-divider order-2 sm:order-1"
            >
              Cancel
            </button>
            {previewData && previewData.validMatches.length > 0 && (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 px-4 py-2 rounded text-white font-medium order-1 sm:order-2"
              >
                {isImporting ? 'Importing...' : `Import ${previewData.validMatches.length} Matches`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Elegant Alert Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-surface-light rounded-lg p-6 w-full max-w-md mx-4 border border-divider">
            <h3 className="text-xl font-semibold mb-4 text-onSurface">
              {alertModal.title}
            </h3>
            <p className="text-onSurface/80 mb-6 whitespace-pre-line">
              {alertModal.message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={closeAlert}
                className={`px-4 py-2 rounded font-medium text-white transition-colors ${getAlertModalColors(alertModal.type)}`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}