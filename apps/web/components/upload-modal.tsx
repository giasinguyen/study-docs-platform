'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cloud,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadDocument } from '@/lib/api-client';
import { formatFileSize } from '@/lib/utils';
import type { Semester, Subject } from '@/lib/types';

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** If true, only file selection (for AI tools analysis) */
  aiMode?: boolean;
  /** Callback when file is selected in AI mode */
  onFileSelect?: (file: File) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function UploadModal({
  open,
  onOpenChange,
  onSuccess,
  aiMode = false,
  onFileSelect,
}: UploadModalProps) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingData, setLoadingData] = useState(false);

  const supabase = createClient();

  // Load semesters and subjects
  useEffect(() => {
    if (!open || aiMode) return;
    setLoadingData(true);
    Promise.all([
      supabase
        .from('semesters')
        .select('*')
        .order('year', { ascending: false })
        .order('semester_number', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
    ]).then(([semRes, subRes]) => {
      setSemesters((semRes.data as Semester[]) || []);
      setSubjects((subRes.data as Subject[]) || []);
      setLoadingData(false);
    });
  }, [open, aiMode]);

  // Filter subjects by semester
  const filteredSubjects = selectedSemester
    ? subjects.filter((s) => s.semester_id === selectedSemester)
    : subjects;

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setFile(null);
      setTitle('');
      setDescription('');
      setSelectedSemester('');
      setSelectedSubject('');
      setStatus('idle');
      setErrorMsg('');
      setUploadProgress(0);
    }
  }, [open]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, ''));
      }
    },
    [title],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, ''));
      }
    },
    [title],
  );

  const handleUpload = async () => {
    if (aiMode && file && onFileSelect) {
      onFileSelect(file);
      onOpenChange(false);
      return;
    }

    if (!file || !selectedSubject) return;

    setStatus('uploading');
    setUploadProgress(10);
    setErrorMsg('');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      await uploadDocument({
        file,
        title: title || file.name,
        description: description || undefined,
        subjectId: selectedSubject,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setStatus('success');

      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Upload failed');
    }
  };

  const canSubmit = aiMode
    ? !!file
    : !!file && !!selectedSubject && status !== 'uploading';

  const storageHint =
    file && file.size >= 10 * 1024 * 1024
      ? 'Google Drive (>10MB)'
      : 'Supabase Storage';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5 text-primary" />
            {aiMode ? 'Chọn tài liệu phân tích' : 'Tải lên tài liệu'}
          </DialogTitle>
          <DialogDescription>
            {aiMode
              ? 'Chọn file PDF, TXT để AI phân tích nội dung'
              : 'Chọn học kì, môn học và file để tải lên'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              file
                ? 'border-primary/40 bg-primary/5'
                : 'border-border hover:border-primary/30 hover:bg-muted/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept={
                aiMode
                  ? '.pdf,.txt,.md,.doc,.docx'
                  : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png'
              }
            />
            {file ? (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="size-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                    {!aiMode && (
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1"
                      >
                        {file.size >= 10 * 1024 * 1024 ? (
                          <Cloud className="size-2.5" />
                        ) : (
                          <HardDrive className="size-2.5" />
                        )}
                        {storageHint}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-primary/10 p-3 w-fit mx-auto mb-2">
                  <Upload className="size-6 text-primary" />
                </div>
                <p className="text-sm font-medium">
                  Kéo thả hoặc nhấp để chọn file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {aiMode
                    ? 'PDF, TXT, Markdown - Tối đa 50MB'
                    : 'PDF, DOCX, PPTX, Excel, Hình ảnh - Tối đa 100MB'}
                </p>
              </>
            )}
          </div>

          {/* Semester & Subject selection (non-AI mode) */}
          {!aiMode && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="semester">Học kì</Label>
                  <Select
                    value={selectedSemester}
                    onValueChange={(v) => {
                      setSelectedSemester(v);
                      setSelectedSubject('');
                    }}
                  >
                    <SelectTrigger id="semester">
                      <SelectValue placeholder="Chọn học kì" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingData ? (
                        <SelectItem value="_loading" disabled>
                          Đang tải...
                        </SelectItem>
                      ) : semesters.length === 0 ? (
                        <SelectItem value="_empty" disabled>
                          Chưa có học kì
                        </SelectItem>
                      ) : (
                        semesters.map((sem) => (
                          <SelectItem key={sem.id} value={sem.id}>
                            {sem.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subject">
                    Môn học <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Chọn môn học" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubjects.length === 0 ? (
                        <SelectItem value="_empty" disabled>
                          {selectedSemester
                            ? 'Không có môn trong HK này'
                            : 'Chọn học kì trước'}
                        </SelectItem>
                      ) : (
                        filteredSubjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: sub.color || '#6b7280',
                                }}
                              />
                              {sub.name}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tên tài liệu (tự động từ tên file)"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Mô tả (tùy chọn)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn..."
                />
              </div>
            </>
          )}

          {/* Upload Progress */}
          {status === 'uploading' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Đang tải lên...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Status Messages */}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 px-3 py-2 rounded-lg">
              <CheckCircle2 className="size-4" />
              Tải lên thành công!
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              <AlertCircle className="size-4" />
              {errorMsg || 'Tải lên thất bại'}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={status === 'uploading'}
          >
            Hủy
          </Button>
          <Button
            variant="lime"
            onClick={handleUpload}
            disabled={!canSubmit || status === 'uploading'}
            className="gap-2"
          >
            {status === 'uploading' ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang tải...
              </>
            ) : aiMode ? (
              <>
                <FileText className="size-4" />
                Chọn file
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Tải lên
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
