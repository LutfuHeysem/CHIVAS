import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Layout from '../Layout/Layout';
import reportStyles from './Reports.module.css';

const API = 'http://localhost:8080';

/* ── Toolbar button for the rich-text editor ── */
const ToolbarBtn = ({ title, icon, cmd, value }) => {
  const exec = (e) => {
    e.preventDefault();
    document.execCommand(cmd, false, value || null);
  };
  return (
    <button
      title={title}
      onMouseDown={exec}
      className={reportStyles.toolbarBtn}
      type="button"
    >
      {icon}
    </button>
  );
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const editorRef = useRef(null);

  const location = useLocation();

  const fetchReports = () => {
    setLoading(true);
    const token = localStorage.getItem('chivas_token');
    axios.get(`${API}/api/clinicmanager/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setReports(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, []);

  // Auto-open composer if navigated here with ?compose=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('compose') === 'true') {
      setShowComposer(true);
    }
  }, [location.search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const html = editorRef.current?.innerHTML || '';
    if (!html || html === '<br>') return alert('Report cannot be empty.');
    setSubmitting(true);
    const token = localStorage.getItem('chivas_token');
    axios.post(`${API}/api/clinicmanager/reports`, { content: html }, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setShowComposer(false);
        if (editorRef.current) editorRef.current.innerHTML = '';
        fetchReports();
      })
      .catch(err => alert(err.response?.data || 'An error occurred'))
      .finally(() => setSubmitting(false));
  };

  return (
    <Layout>
      {/* ── Page Header ── */}
      <div className={reportStyles.pageHeader}>
        <div>
          <h2 className={reportStyles.pageTitle}>📄 Clinic Reports</h2>
          <p className={reportStyles.pageSubtitle}>{reports.length} report{reports.length !== 1 ? 's' : ''} on file</p>
        </div>
        <button className={reportStyles.newBtn} onClick={() => setShowComposer(true)}>
          <span>✏️</span> New Report
        </button>
      </div>

      {/* ── Report Cards ── */}
      {loading ? (
        <div className={reportStyles.loading}>Loading reports…</div>
      ) : reports.length === 0 ? (
        <div className={reportStyles.emptyState}>
          <div className={reportStyles.emptyIcon}>📋</div>
          <p>No reports filed yet. Create the first one!</p>
        </div>
      ) : (
        <div className={reportStyles.reportGrid}>
          {reports.map(rep => (
            <div key={rep.reportId} className={reportStyles.reportCard}>
              <div className={reportStyles.reportCardTop}>
                <div className={reportStyles.reportMeta}>
                  <span className={reportStyles.reportDate}>📅 {rep.date}</span>
                  <span className={reportStyles.reportTime}>🕐 {rep.time}</span>
                </div>
                <span className={reportStyles.authorBadge}>{rep.managerName}</span>
              </div>
              <div className={reportStyles.reportPreview}
                dangerouslySetInnerHTML={{ __html: rep.content }}
              />
              <div className={reportStyles.reportCardFooter}>
                <button
                  className={reportStyles.viewBtn}
                  onClick={() => setViewReport(rep)}
                >
                  👁 View Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Composer Modal ── */}
      {showComposer && (
        <div className={reportStyles.overlay}>
          <div className={reportStyles.composer}>
            <div className={reportStyles.composerHeader}>
              <h3>New Clinic Report</h3>
              <button className={reportStyles.closeBtn} onClick={() => setShowComposer(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={reportStyles.composerForm}>
              {/* Formatting toolbar */}
              <div className={reportStyles.toolbar}>
                <ToolbarBtn title="Bold" icon={<b>B</b>} cmd="bold" />
                <ToolbarBtn title="Italic" icon={<i>I</i>} cmd="italic" />
                <ToolbarBtn title="Underline" icon={<u>U</u>} cmd="underline" />
                <div className={reportStyles.toolbarDivider} />
                <ToolbarBtn title="Bullet List" icon="• ≡" cmd="insertUnorderedList" />
                <ToolbarBtn title="Numbered List" icon="1. ≡" cmd="insertOrderedList" />
                <div className={reportStyles.toolbarDivider} />
                <ToolbarBtn title="Heading" icon="H1" cmd="formatBlock" value="h3" />
                <ToolbarBtn title="Paragraph" icon="¶" cmd="formatBlock" value="p" />
                <div className={reportStyles.toolbarDivider} />
                <ToolbarBtn title="Align Left" icon="⬛▭▭" cmd="justifyLeft" />
                <ToolbarBtn title="Align Center" icon="▭⬛▭" cmd="justifyCenter" />
                <ToolbarBtn title="Align Right" icon="▭▭⬛" cmd="justifyRight" />
              </div>

              {/* Editable area */}
              <div
                ref={editorRef}
                className={reportStyles.editor}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Start typing your report here…"
              />

              <div className={reportStyles.composerFooter}>
                <button type="button" className={reportStyles.cancelBtn} onClick={() => setShowComposer(false)}>
                  Cancel
                </button>
                <button type="submit" className={reportStyles.submitBtn} disabled={submitting}>
                  {submitting ? 'Saving…' : '✓ Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Report Modal ── */}
      {viewReport && (
        <div className={reportStyles.overlay} onClick={() => setViewReport(null)}>
          <div className={reportStyles.viewer} onClick={e => e.stopPropagation()}>
            <div className={reportStyles.viewerHeader}>
              <div>
                <div className={reportStyles.viewerTitle}>Clinic Report</div>
                <div className={reportStyles.viewerMeta}>
                  {viewReport.date} at {viewReport.time} · by {viewReport.managerName}
                </div>
              </div>
              <button className={reportStyles.closeBtn} onClick={() => setViewReport(null)}>✕</button>
            </div>
            <div
              className={reportStyles.viewerBody}
              dangerouslySetInnerHTML={{ __html: viewReport.content }}
            />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Reports;
