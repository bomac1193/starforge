import React from 'react';

/**
 * Influence Genealogy Tree - Elite Tastemaker Aesthetic
 * Didot typography, centered layout, minimal editorial style
 */
const InfluenceGenealogyTree = ({ genealogyData }) => {
  if (!genealogyData || !genealogyData.available) {
    return (
      <div className="p-8 text-center border border-brand-border">
        <p className="text-body-sm text-brand-secondary">
          {genealogyData?.message || 'Upload tracks to analyze your influence genealogy.'}
        </p>
      </div>
    );
  }

  const { influences, narrative, lineage } = genealogyData;

  return (
    <div className="space-y-6">
      {/* Multiple Influences - Percentage Breakdown */}
      {influences && influences.length > 0 && (
        <div className="border border-brand-border p-6">
          <p className="uppercase-label text-brand-secondary mb-4">YOUR TASTE SPECTRUM</p>

          <div className="space-y-3">
            {influences.map((influence, i) => (
              <div key={i} className="border border-brand-text p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <h4 className="text-display-sm text-brand-text">
                    {influence.genre.name}
                  </h4>
                  <span className="text-body-sm text-brand-text font-medium">
                    {influence.percentage}%
                  </span>
                </div>

                <p className="text-body-xs text-brand-secondary mb-3 leading-relaxed">
                  {influence.genre.cultural_context}
                </p>

                <div className="flex flex-wrap gap-3 text-body-xs text-brand-secondary">
                  {influence.avgBpm && (
                    <span>{influence.avgBpm} BPM</span>
                  )}
                  {influence.avgEnergy !== null && (
                    <>
                      <span>•</span>
                      <span>{Math.round(influence.avgEnergy * 100)}% energy</span>
                    </>
                  )}
                  {influence.avgValence !== null && influence.avgValence !== undefined && (
                    <>
                      <span>•</span>
                      <span>{Math.round(influence.avgValence * 100)}% valence</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{influence.trackCount} tracks</span>
                  {influence.genre.origin_location && (
                    <>
                      <span>•</span>
                      <span>{influence.genre.origin_location}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lineage - Vertical Timeline */}
      {lineage && lineage.length > 0 && (
        <div className="border border-brand-border p-6">
          <p className="uppercase-label text-brand-secondary mb-4">PRIMARY LINEAGE</p>

          <div className="max-w-2xl mx-auto">
            {lineage.map((genre, i) => (
              <div key={genre.id} className="relative">
                {/* Connector line */}
                {i < lineage.length - 1 && (
                  <div className="absolute left-[11px] top-10 bottom-0 w-px bg-brand-border" />
                )}

                <div className="flex items-start gap-4 pb-6">
                  {/* Era indicator */}
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-brand-text bg-brand-bg flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-brand-text" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-display-sm text-brand-text">
                        {genre.name}
                      </h4>
                      <span className="text-body-xs text-brand-secondary">
                        {genre.decade}
                      </span>
                    </div>

                    <p className="text-body-xs text-brand-secondary leading-relaxed">
                      {genre.cultural_context}
                    </p>

                    {genre.origin_location && (
                      <p className="text-body-xs text-brand-secondary mt-1">
                        {genre.origin_location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Narrative */}
      {narrative && (
        <div className="border border-brand-border p-6">
          <p className="uppercase-label text-brand-secondary mb-4">ANALYSIS</p>
          <p className="text-body-sm text-brand-text leading-relaxed whitespace-pre-line columns-1 md:columns-2 gap-8">
            {narrative}
          </p>
        </div>
      )}
    </div>
  );
};

export default InfluenceGenealogyTree;
