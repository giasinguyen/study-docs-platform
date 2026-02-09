'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  SlidersHorizontal,
  FileText,
  Calendar,
  Tag,
  GraduationCap,
  Bot,
  Sparkles,
  X,
} from 'lucide-react';
import { useSubjects, useTags } from '@/lib/hooks';
import { fetchDocuments, type DbDocument } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';

const fileTypes = ['PDF', 'DOCX', 'PPTX', 'IMG', 'XLS'];

function getMimeTypeShort(mime: string | null): string {
  if (!mime) return 'file';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('word') || mime.includes('docx')) return 'docx';
  if (mime.includes('presentation') || mime.includes('pptx')) return 'pptx';
  if (mime.includes('image')) return 'img';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'xls';
  return 'file';
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<DbDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: subjects } = useSubjects();
  const { data: tags } = useTags();

  const subjectNames = (subjects ?? []).map((s) => s.name);
  const tagNames = (tags ?? []).map((t) => t.name);

  function toggleFilter(arr: string[], item: string, setter: (v: string[]) => void) {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  }

  const activeFilterCount = selectedTypes.length + selectedSubjects.length + selectedTags.length;

  const handleSearch = useCallback(async () => {
    if (!query.trim() && activeFilterCount === 0) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const docs = await fetchDocuments({
        search: query.trim() || undefined,
        limit: 50,
      });
      // Client-side filter by selected subject names
      let filtered = docs;
      if (selectedSubjects.length > 0) {
        filtered = filtered.filter((d) =>
          selectedSubjects.includes((d as any).subjects?.name ?? ''),
        );
      }
      // Client-side filter by file type
      if (selectedTypes.length > 0) {
        filtered = filtered.filter((d) => {
          const short = getMimeTypeShort(d.mime_type).toUpperCase();
          return selectedTypes.includes(short);
        });
      }
      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedSubjects, selectedTypes, activeFilterCount]);

  // Trigger search when Enter is pressed
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tìm kiếm nâng cao</h1>
        <p className="text-muted-foreground text-sm mt-1">Tìm kiếm theo nội dung, từ khóa và bộ lọc thông minh</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm tài liệu, nội dung, câu hỏi..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 h-11 text-base"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <SlidersHorizontal className="size-4 mr-2" />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="ml-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button variant="lime" className="gap-2" onClick={handleSearch} disabled={loading}>
          <Search className="size-4" />
          {loading ? 'Đang tìm...' : 'Tìm kiếm'}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="animate-in fade-in-0 slide-in-from-top-2">
          <CardContent className="p-5 space-y-4">
            {/* File Types */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" /> Loại file
              </p>
              <div className="flex flex-wrap gap-2">
                {fileTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => toggleFilter(selectedTypes, type, setSelectedTypes)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Subjects */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <GraduationCap className="size-4 text-muted-foreground" /> Môn học
              </p>
              <div className="flex flex-wrap gap-2">
                {subjectNames.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Chưa có môn học</span>
                ) : subjectNames.map((subject) => (
                  <Badge
                    key={subject}
                    variant={selectedSubjects.includes(subject) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => toggleFilter(selectedSubjects, subject, setSelectedSubjects)}
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Tag className="size-4 text-muted-foreground" /> Thẻ
              </p>
              <div className="flex flex-wrap gap-2">
                {tagNames.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Chưa có thẻ</span>
                ) : tagNames.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => toggleFilter(selectedTags, tag, setSelectedTags)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedTypes([]); setSelectedSubjects([]); setSelectedTags([]); }}>
                <X className="size-3 mr-1" /> Xóa tất cả bộ lọc
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Đang tìm kiếm...</div>
        ) : !hasSearched ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-2xl bg-primary/10 p-4 mb-4">
                <Search className="size-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Tìm kiếm tài liệu</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Nhập từ khóa hoặc sử dụng bộ lọc để tìm tài liệu trong kho của bạn.
              </p>
            </CardContent>
          </Card>
        ) : results.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-2xl bg-muted p-4 mb-4">
                <Search className="size-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Không tìm thấy kết quả</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Thử thay đổi từ khóa hoặc bộ lọc
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{results.length} kết quả</p>
            {results.map((doc) => {
              const fileType = getMimeTypeShort(doc.mime_type);
              return (
                <Card key={doc.id} className="hover:border-primary/30 transition-colors cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        fileType === 'pdf' ? 'text-red-400 bg-red-400/10' :
                        fileType === 'docx' ? 'text-blue-400 bg-blue-400/10' :
                        fileType === 'pptx' ? 'text-orange-400 bg-orange-400/10' :
                        'text-muted-foreground bg-muted'
                      }`}>
                        <FileText className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium group-hover:text-primary transition-colors">{doc.title}</h3>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-[10px]">{(doc as any).subjects?.name ?? 'Chưa phân loại'}</Badge>
                          <span className="text-xs text-muted-foreground">{formatFileSize(Number(doc.file_size) || 0)}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
