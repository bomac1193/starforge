import React, { useState } from 'react';

/**
 * Influence Genealogy Tree Visualization
 * Elite tier feature - displays user's taste lineage as a vertical tree
 * Instagram-worthy aesthetic with export functionality
 */
const InfluenceGenealogyTree = ({ genealogyData }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!genealogyData || !genealogyData.available) {
    return (
      <div className="p-6 text-center border border-brand-border">
        <p className="text-body-sm text-brand-secondary mb-2">
          {genealogyData?.message || 'Upload more tracks to analyze your influence genealogy.'}
        </p>
      </div>
    );
  }

  const { treeData, narrative, primaryGenre, matchScore, lineage, descendants } = genealogyData;

  // Calculate tree layout
  const nodeHeight = 100;
  const nodeWidth = 200;
  const horizontalSpacing = 120;
  const verticalSpacing = 150;

  // Position nodes in vertical tree layout
  const positionedNodes = treeData.nodes.map((node, index) => {
    // Main lineage in center column
    if (node.type === 'ancestor' || node.type === 'current' || node.type === 'user') {
      return {
        ...node,
        x: 300,
        y: index * verticalSpacing + 50
      };
    }
    
    // Descendants spread horizontally below user node
    const descendantIndex = treeData.nodes
      .slice(0, index)
      .filter(n => n.type === 'descendant').length;
    
    return {
      ...node,
      x: 100 + descendantIndex * horizontalSpacing,
      y: (treeData.nodes.filter(n => n.type !== 'descendant').length) * verticalSpacing + 100
    };
  });

  // Calculate SVG dimensions
  const maxX = Math.max(...positionedNodes.map(n => n.x)) + nodeWidth + 50;
  const maxY = Math.max(...positionedNodes.map(n => n.y)) + nodeHeight + 50;

  // Export as image
  const handleExport = () => {
    setIsExporting(true);
    const svgElement = document.getElementById('genealogy-tree-svg');
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = maxX;
    canvas.height = maxY;
    
    img.onload = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `influence-genealogy-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Get node color based on type
  const getNodeColor = (type) => {
    switch (type) {
      case 'ancestor': return 'stroke-gray-600 fill-gray-900';
      case 'current': return 'stroke-purple-500 fill-purple-950';
      case 'user': return 'stroke-brand-primary fill-brand-bg';
      case 'descendant': return 'stroke-gray-500 fill-gray-800 opacity-60';
      default: return 'stroke-gray-600 fill-gray-900';
    }
  };

  // Get edge color based on style
  const getEdgeColor = (style) => {
    return style === 'dashed' ? 'stroke-gray-600 stroke-dasharray-4' : 'stroke-purple-500';
  };

  return (
    <div className="space-y-6">
      {/* Narrative Section */}
      <div className="p-4 border border-brand-border bg-brand-bg">
        <p className="uppercase-label text-brand-secondary mb-2">Your Taste Heritage</p>
        <p className="text-body-sm text-brand-text leading-relaxed mb-3">
          {narrative}
        </p>
        <div className="flex gap-4 text-body-xs text-brand-secondary">
          <span>Primary Match: {primaryGenre?.name || 'N/A'}</span>
          <span>•</span>
          <span>Confidence: {Math.round(matchScore)}%</span>
          <span>•</span>
          <span>Lineage Depth: {lineage?.length || 0} generations</span>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="border border-brand-border p-6 bg-brand-bg overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <p className="uppercase-label text-brand-secondary">Genealogy Tree</p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-xs uppercase tracking-wider border border-brand-border hover:border-brand-primary transition-colors disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export Image'}
          </button>
        </div>

        <svg
          id="genealogy-tree-svg"
          viewBox={`0 0 ${maxX} ${maxY}`}
          className="w-full"
          style={{ minHeight: '600px' }}
        >
          {/* Edges */}
          {treeData.edges.map((edge, i) => {
            const fromNode = positionedNodes.find(n => n.id === edge.from);
            const toNode = positionedNodes.find(n => n.id === edge.to);
            
            if (!fromNode || !toNode) return null;
            
            const x1 = fromNode.x + nodeWidth / 2;
            const y1 = fromNode.y + nodeHeight;
            const x2 = toNode.x + nodeWidth / 2;
            const y2 = toNode.y;
            
            const midY = (y1 + y2) / 2;
            
            return (
              <g key={`edge-${i}`}>
                <path
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  className={`fill-none stroke-2 ${getEdgeColor(edge.style)}`}
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={midY}
                    className="fill-gray-500 text-xs"
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                className="fill-purple-500"
              />
            </marker>
          </defs>

          {/* Nodes */}
          {positionedNodes.map((node) => (
            <g
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              <rect
                x={node.x}
                y={node.y}
                width={nodeWidth}
                height={nodeHeight}
                rx="4"
                className={`stroke-2 ${getNodeColor(node.type)}`}
              />
              <text
                x={node.x + nodeWidth / 2}
                y={node.y + 35}
                className="fill-brand-text text-sm font-medium"
                textAnchor="middle"
              >
                {node.label}
              </text>
              <text
                x={node.x + nodeWidth / 2}
                y={node.y + 55}
                className="fill-gray-500 text-xs"
                textAnchor="middle"
              >
                {node.era}
              </text>
              {node.type === 'current' && (
                <text
                  x={node.x + nodeWidth / 2}
                  y={node.y + 75}
                  className="fill-purple-400 text-xs"
                  textAnchor="middle"
                >
                  ★ Best Match
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="p-4 border border-brand-border bg-brand-bg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-brand-text font-medium">{selectedNode.label}</p>
              <p className="text-body-xs text-brand-secondary">{selectedNode.era}</p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-brand-secondary hover:text-brand-text text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-body-sm text-brand-secondary">
            {selectedNode.description}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="p-4 border border-brand-border bg-brand-bg">
        <p className="uppercase-label text-brand-secondary mb-3">Legend</p>
        <div className="grid grid-cols-2 gap-3 text-body-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-600 bg-gray-900"></div>
            <span className="text-brand-secondary">Ancestor Genres</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-500 bg-purple-950"></div>
            <span className="text-brand-secondary">Your Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-brand-primary bg-brand-bg"></div>
            <span className="text-brand-secondary">Your Taste (2026)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-500 bg-gray-800 opacity-60"></div>
            <span className="text-brand-secondary">Descendant Genres</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfluenceGenealogyTree;
