'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Network,
  BookOpen,
  Tag,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  LayoutGrid,
  GitBranch,
} from 'lucide-react';
import { useSubjects, useDocuments, useTags } from '@/lib/hooks';

interface GraphNode {
  id: string;
  label: string;
  type: 'subject' | 'document' | 'tag';
  x: number;
  y: number;
  connections: string[];
}

const nodeColors = {
  subject: { fill: '#01FF80', stroke: '#01CC66', text: '#000' },
  document: { fill: '#27272a', stroke: '#3f3f46', text: '#e4e4e7' },
  tag: { fill: '#1a1a2e', stroke: '#01FF80', text: '#01FF80' },
};

const nodeRadius = { subject: 32, document: 22, tag: 18 };

export default function KnowledgeGraphPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'subject' | 'document' | 'tag'>('all');
  const [zoom, setZoom] = useState(1);

  const { data: subjects, loading: subjectsLoading } = useSubjects();
  const { data: documents, loading: docsLoading } = useDocuments({ limit: 30 });
  const { data: tags, loading: tagsLoading } = useTags();

  const loading = subjectsLoading || docsLoading || tagsLoading;

  // Build graph nodes from real data
  const nodes = useMemo(() => {
    if (!subjects || !documents) return [];

    const result: GraphNode[] = [];
    const subjectMap = new Map<string, string>(); // subjectId -> nodeId

    // Place subjects in a circle in the center
    const cx = 400, cy = 260, r = 140;
    const subjectCount = subjects.length || 1;
    subjects.forEach((s, i) => {
      const angle = (2 * Math.PI * i) / subjectCount - Math.PI / 2;
      const nodeId = `s-${s.id}`;
      subjectMap.set(s.id, nodeId);
      result.push({
        id: nodeId,
        label: s.name ?? 'Unnamed',
        type: 'subject',
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        connections: [],
      });
    });

    // Place documents around their subject
    const subjectDocCount = new Map<string, number>();
    documents.slice(0, 20).forEach((doc) => {
      if (!doc.subject_id) return;
      const subjectNodeId = subjectMap.get(doc.subject_id);
      const subjectNode = result.find((n) => n.id === subjectNodeId);
      if (!subjectNode) return;

      const count = subjectDocCount.get(doc.subject_id) ?? 0;
      subjectDocCount.set(doc.subject_id, count + 1);

      const docAngle = (count * 0.8) - 1;
      const docR = 80 + count * 15;
      const nodeId = `d-${doc.id}`;
      const title = doc.title ?? doc.file_name ?? 'Untitled';

      result.push({
        id: nodeId,
        label: title.length > 16 ? title.slice(0, 16) + '…' : title,
        type: 'document',
        x: Math.max(30, Math.min(770, subjectNode.x + docR * Math.cos(docAngle))),
        y: Math.max(30, Math.min(490, subjectNode.y + docR * Math.sin(docAngle))),
        connections: [subjectNode.id],
      });

      subjectNode.connections.push(nodeId);
    });

    // Place tags at bottom
    (tags ?? []).slice(0, 8).forEach((tag, i) => {
      const nodeId = `t-${tag.id}`;
      result.push({
        id: nodeId,
        label: `#${tag.name}`,
        type: 'tag',
        x: 100 + i * 90,
        y: 480,
        connections: [],
      });
    });

    return result;
  }, [subjects, documents, tags]);

  const stats = [
    { label: 'Môn học', count: subjects?.length ?? 0, icon: <BookOpen className="size-4" /> },
    { label: 'Tài liệu', count: documents?.length ?? 0, icon: <FileText className="size-4" /> },
    { label: 'Tags', count: tags?.length ?? 0, icon: <Tag className="size-4" /> },
    { label: 'Liên kết', count: nodes.reduce((a, n) => a + n.connections.length, 0), icon: <GitBranch className="size-4" /> },
  ];

  const filteredNodes = filterType === 'all' ? nodes : nodes.filter((n) => n.type === filterType);
  const filteredIds = new Set(filteredNodes.map((n) => n.id));

  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph</h1>
          <p className="text-muted-foreground text-sm mt-1">Bản đồ tri thức — mối liên hệ giữa tài liệu, môn học và tags</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}>
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setZoom(1)}>
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{s.icon} {s.label}</div>
            <p className="text-xl font-bold">{loading ? '...' : s.count}</p>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Hiển thị:</span>
        {(['all', 'subject', 'document', 'tag'] as const).map((t) => (
          <Button key={t} variant={filterType === t ? 'lime' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setFilterType(t)}>
            {t === 'all' ? 'Tất cả' : t === 'subject' ? 'Môn học' : t === 'document' ? 'Tài liệu' : 'Tags'}
          </Button>
        ))}
      </div>

      {/* Graph Canvas */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-[#0a0a0f] overflow-auto" style={{ height: '520px' }}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Đang tải dữ liệu...</div>
            ) : nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Chưa có dữ liệu để hiển thị</div>
            ) : (
            <svg
              width={800 * zoom}
              height={520 * zoom}
              viewBox="0 0 800 520"
              className="w-full h-full"
              style={{ minWidth: 800 * zoom, minHeight: 520 * zoom }}
            >
              {/* Grid pattern */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1a2e" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="800" height="520" fill="url(#grid)" />

              {/* Edges */}
              {filteredNodes.map((node) =>
                node.connections
                  .filter((cId) => filteredIds.has(cId))
                  .map((cId) => {
                    const target = getNode(cId);
                    if (!target) return null;
                    const isSelected = selectedNode?.id === node.id || selectedNode?.id === cId;
                    return (
                      <line
                        key={`${node.id}-${cId}`}
                        x1={node.x}
                        y1={node.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={isSelected ? '#01FF80' : '#27272a'}
                        strokeWidth={isSelected ? 2 : 1}
                        strokeDasharray={node.type === 'tag' || target.type === 'tag' ? '4 4' : undefined}
                        opacity={selectedNode ? (isSelected ? 1 : 0.15) : 0.6}
                      />
                    );
                  })
              )}

              {/* Nodes */}
              {filteredNodes.map((node) => {
                const config = nodeColors[node.type];
                const r = nodeRadius[node.type];
                const isSelected = selectedNode?.id === node.id;
                const isConnected = selectedNode?.connections.includes(node.id);
                const dimmed = selectedNode && !isSelected && !isConnected;

                return (
                  <g
                    key={node.id}
                    cursor="pointer"
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                    opacity={dimmed ? 0.2 : 1}
                    className="transition-opacity duration-200"
                  >
                    {isSelected && (
                      <circle cx={node.x} cy={node.y} r={r + 6} fill="none" stroke="#01FF80" strokeWidth="2" opacity="0.5">
                        <animate attributeName="r" from={r + 4} to={r + 10} dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r}
                      fill={config.fill}
                      stroke={isSelected ? '#01FF80' : config.stroke}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={node.x}
                      y={node.y + r + 14}
                      textAnchor="middle"
                      fill={config.text}
                      fontSize={node.type === 'subject' ? 11 : 9}
                      fontWeight={node.type === 'subject' ? 600 : 400}
                    >
                      {node.label}
                    </text>
                    {/* Icon hint */}
                    <text x={node.x} y={node.y + 4} textAnchor="middle" fill={config.text} fontSize={node.type === 'subject' ? 14 : 10}>
                      {node.type === 'subject' ? '📚' : node.type === 'document' ? '📄' : '#'}
                    </text>
                  </g>
                );
              })}
            </svg>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Info */}
      {selectedNode && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Network className="size-4 text-primary" />
              {selectedNode.label}
              <Badge variant={selectedNode.type === 'subject' ? 'lime' : selectedNode.type === 'document' ? 'secondary' : 'outline'} className="text-[10px] ml-2">
                {selectedNode.type === 'subject' ? 'Môn học' : selectedNode.type === 'document' ? 'Tài liệu' : 'Tag'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Liên kết ({selectedNode.connections.length}):</p>
            <div className="flex flex-wrap gap-2">
              {selectedNode.connections.map((cId) => {
                const target = getNode(cId);
                if (!target) return null;
                return (
                  <Badge key={cId} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setSelectedNode(target)}>
                    {target.type === 'subject' ? '📚' : target.type === 'document' ? '📄' : '#'} {target.label}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-primary" /> Môn học
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-zinc-800 border border-zinc-600" /> Tài liệu
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#1a1a2e] border border-primary" /> Tag
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 border-t border-zinc-600" /> Liên kết
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 border-t border-dashed border-zinc-600" /> Liên kết tag
        </div>
      </div>
    </div>
  );
}
