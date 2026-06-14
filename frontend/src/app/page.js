'use client';

import { useState, useRef } from 'react';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function Home() {
  const [doctorName, setDoctorName] = useState('');
  const [designation, setDesignation] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validate = () => {
    const errs = {};
    if (!doctorName.trim()) errs.doctorName = 'Doctor name is required';
    else if (doctorName.trim().length > 60) errs.doctorName = 'Name must be 60 characters or less';
    if (!designation.trim()) errs.designation = 'Designation is required';
    else if (designation.trim().length > 80) errs.designation = 'Designation must be 80 characters or less';
    if (!photo) errs.photo = 'Doctor photo is required';
    return errs;
  };

  const handlePhotoChange = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrors(prev => ({ ...prev, photo: 'Only JPG, PNG, or WEBP images allowed' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: 'Image must be under 10MB' }));
      return;
    }
    setPhoto(file);
    setErrors(prev => ({ ...prev, photo: null }));
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handlePhotoChange(file);
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setStatus('processing');
    setProgress(0);
    setResult(null);
    setErrors({});

    // Simulate progress during ffmpeg processing
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) return prev;
        return prev + Math.random() * 8;
      });
    }, 800);

    try {
      const formData = new FormData();
      formData.append('doctorName', doctorName.trim());
      formData.append('designation', designation.trim());
      formData.append('photo', photo);

      const response = await fetch(`${API_BASE}/generate-video`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Video generation failed');
      }

      const data = await response.json();
      
      setTimeout(() => {
        setStatus('done');
        setResult(data);
      }, 400);

    } catch (err) {
      clearInterval(progressInterval);
      setStatus('error');
      setErrors({ submit: err.message });
      setProgress(0);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setErrors({});
    setDoctorName('');
    setDesignation('');
    setPhoto(null);
    setPhotoPreview(null);
  };

  const downloadUrl = result ? `${API_BASE}${result.videoUrl}` : null;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandMark}>
            <span className={styles.brandIcon}>▶</span>
            <div>
              <span className={styles.brandName}>MedVideo</span>
              <span className={styles.brandSub}>Generator</span>
            </div>
          </div>
          <div className={styles.headerBadge}>Cipla Patient Awareness</div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Personalized Doctor<br />
            <span className={styles.heroAccent}>Video Generator</span>
          </h1>
          <p className={styles.heroDesc}>
            Upload a doctor's photo and enter their details to generate a personalized version of the master awareness video.
          </p>
        </section>

        {/* Workflow Steps */}
        <div className={styles.steps}>
          {['Fill Details', 'Upload Photo', 'Generate', 'Download'].map((step, i) => (
            <div key={i} className={`${styles.step} ${i === 0 && status === 'idle' ? styles.stepActive : ''} ${i === 2 && status === 'processing' ? styles.stepActive : ''} ${i === 3 && status === 'done' ? styles.stepActive : ''}`}>
              <div className={styles.stepNum}>{i + 1}</div>
              <span className={styles.stepLabel}>{step}</span>
            </div>
          ))}
        </div>

        {/* Form / Processing / Result */}
        {status === 'idle' || status === 'error' ? (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Doctor Information</h2>

            {/* Doctor Name */}
            <div className={styles.field}>
              <label className={styles.label}>Doctor Name</label>
              <input
                className={`${styles.input} ${errors.doctorName ? styles.inputError : ''}`}
                type="text"
                placeholder="e.g. Dr. Priya Sharma"
                value={doctorName}
                onChange={(e) => {
                  setDoctorName(e.target.value);
                  if (errors.doctorName) setErrors(prev => ({ ...prev, doctorName: null }));
                }}
                maxLength={60}
              />
              {errors.doctorName && <span className={styles.errorMsg}>{errors.doctorName}</span>}
              <span className={styles.charCount}>{doctorName.length}/60</span>
            </div>

            {/* Designation */}
            <div className={styles.field}>
              <label className={styles.label}>Designation</label>
              <input
                className={`${styles.input} ${errors.designation ? styles.inputError : ''}`}
                type="text"
                placeholder="e.g. Consultant Gastroenterologist"
                value={designation}
                onChange={(e) => {
                  setDesignation(e.target.value);
                  if (errors.designation) setErrors(prev => ({ ...prev, designation: null }));
                }}
                maxLength={80}
              />
              {errors.designation && <span className={styles.errorMsg}>{errors.designation}</span>}
              <span className={styles.charCount}>{designation.length}/80</span>
            </div>

            {/* Photo Upload */}
            <div className={styles.field}>
              <label className={styles.label}>Doctor Photo</label>
              <div
                className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''} ${errors.photo ? styles.dropzoneError : ''} ${photo ? styles.dropzoneFilled : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handlePhotoChange(e.target.files[0])}
                />
                {photoPreview ? (
                  <div className={styles.photoPreviewWrapper}>
                    <img src={photoPreview} alt="Doctor preview" className={styles.photoPreview} />
                    <div className={styles.photoInfo}>
                      <span className={styles.photoName}>{photo?.name}</span>
                      <span className={styles.photoSize}>{(photo?.size / 1024).toFixed(0)} KB</span>
                      <button className={styles.changePhoto} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        Change Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.dropzoneContent}>
                    <div className={styles.dropzoneIcon}>📷</div>
                    <p className={styles.dropzoneText}>Drag & drop or click to upload</p>
                    <p className={styles.dropzoneHint}>JPG, PNG, WEBP · Max 10MB</p>
                  </div>
                )}
              </div>
              {errors.photo && <span className={styles.errorMsg}>{errors.photo}</span>}
            </div>

            {errors.submit && (
              <div className={styles.submitError}>
                <span>⚠️</span> {errors.submit}
              </div>
            )}

            <button className={styles.generateBtn} onClick={handleSubmit}>
              <span>▶</span> Generate Video
            </button>
          </div>

        ) : status === 'processing' ? (
          <div className={styles.card}>
            <div className={styles.processingSection}>
              <div className={styles.processingIcon}>
                <div className={styles.spinner}></div>
              </div>
              <h2 className={styles.processingTitle}>Generating Your Video</h2>
              <p className={styles.processingDesc}>
                FFmpeg is overlaying the doctor's photo, name, and designation onto the master video…
              </p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${Math.min(progress, 100)}%` }}></div>
              </div>
              <div className={styles.progressSteps}>
                <span className={progress > 20 ? styles.doneStep : styles.pendingStep}>● Processing photo</span>
                <span className={progress > 50 ? styles.doneStep : styles.pendingStep}>● Overlaying elements</span>
                <span className={progress > 80 ? styles.doneStep : styles.pendingStep}>● Encoding MP4</span>
                <span className={progress >= 100 ? styles.doneStep : styles.pendingStep}>● Finalizing</span>
              </div>
            </div>
          </div>

        ) : status === 'done' ? (
          <div className={styles.card}>
            <div className={styles.successSection}>
              <div className={styles.successIcon}>✓</div>
              <h2 className={styles.successTitle}>Video Ready!</h2>
              <p className={styles.successDesc}>
                Your personalized doctor video has been generated successfully.
              </p>
              <div className={styles.videoPreviewWrapper}>
                <video
                  className={styles.videoPreview}
                  src={downloadUrl}
                  controls
                  playsInline
                />
              </div>
              <div className={styles.resultMeta}>
                <div className={styles.resultMetaItem}>
                  <span className={styles.metaLabel}>Doctor</span>
                  <span className={styles.metaValue}>{doctorName}</span>
                </div>
                <div className={styles.resultMetaItem}>
                  <span className={styles.metaLabel}>Designation</span>
                  <span className={styles.metaValue}>{designation}</span>
                </div>
                <div className={styles.resultMetaItem}>
                  <span className={styles.metaLabel}>Processing Time</span>
                  <span className={styles.metaValue}>{result?.processingTime}</span>
                </div>
              </div>
              <div className={styles.actionButtons}>
                <a className={styles.downloadBtn} href={downloadUrl} download={result?.filename}>
                  ⬇ Download MP4
                </a>
                <button className={styles.resetBtn} onClick={handleReset}>
                  + Generate Another
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <footer className={styles.footer}>
        <p>Doctor Video Generator · Cipla Patient Awareness Initiative</p>
      </footer>
    </div>
  );
}
