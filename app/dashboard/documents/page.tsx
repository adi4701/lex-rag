'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import { UploadCloud, FileText, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [docType, setDocType] = useState('NDA');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchDocuments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${apiUrl}/api/documents`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000); // Poll for status updates
    return () => clearInterval(interval);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);
      
      setUploadProgress(40);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData
      });
      
      setUploadProgress(90);
      
      if (res.ok) {
        await fetchDocuments();
      } else {
        alert("Upload failed");
      }
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [docType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    await fetch(`${apiUrl}/api/documents/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    
    fetchDocuments();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto w-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Document Library</h1>
        <p className="text-slate-400">Upload and manage your legal documents. Supported formats: PDF, DOCX.</p>
      </div>

      {/* Upload Zone */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Document Type (Required)</label>
          <select 
            value={docType} 
            onChange={(e) => setDocType(e.target.value)}
            className="w-full md:w-64 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="NDA">NDA</option>
            <option value="EMPLOYMENT_CONTRACT">Employment Contract</option>
            <option value="BOARD_RESOLUTION">Board Resolution</option>
            <option value="SHAREHOLDER_AGREEMENT">Shareholder Agreement</option>
          </select>
        </div>

        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-4" />
          {isUploading ? (
            <div>
              <p className="text-white font-medium mb-2">Uploading...</p>
              <div className="w-full max-w-xs mx-auto bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-white font-medium mb-1">Drag & drop a file here, or click to select</p>
              <p className="text-sm text-slate-500">Max file size: 50MB</p>
            </>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/20 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Filename</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Type</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Chunks</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <span className="font-medium text-white truncate max-w-[200px]">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {doc.document_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {doc.chunk_count || 0}
                    </td>
                    <td className="px-6 py-4">
                      {doc.status === 'ready' && <span className="flex items-center gap-1.5 text-emerald-400 text-sm"><CheckCircle2 className="w-4 h-4" /> Ready</span>}
                      {doc.status === 'processing' && <span className="flex items-center gap-1.5 text-blue-400 text-sm"><Clock className="w-4 h-4 animate-pulse" /> Processing</span>}
                      {doc.status === 'failed' && <span className="flex items-center gap-1.5 text-red-400 text-sm"><AlertCircle className="w-4 h-4" /> Failed</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
