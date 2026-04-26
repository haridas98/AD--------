import HeroImageBlock from './HeroImageBlock';
import ImageGridBlock from './ImageGridBlock';
import MetaInfoBlock from './MetaInfoBlock';
import TypographyBlock from './TypographyBlock';
import SideBySideBlock from './SideBySideBlock';
import CTASectionBlock from './CTASectionBlock';
import BeforeAfterBlock from './BeforeAfterBlock';
import RefinedSliderBlock from './RefinedSliderBlock';
import CircleDetailBlock from './CircleDetailBlock';
import EditorialNoteBlock from './EditorialNoteBlock';
import MosaicPresetBlock from './MosaicPresetBlock';

export const blockComponents: Record<string, React.ComponentType<any>> = {
  heroImage: HeroImageBlock,
  imageGrid: ImageGridBlock,
  metaInfo: MetaInfoBlock,
  typography: TypographyBlock,
  sideBySide: SideBySideBlock,
  ctaSection: CTASectionBlock,
  beforeAfter: BeforeAfterBlock,
  refinedSlider: RefinedSliderBlock,
  circleDetail: CircleDetailBlock,
  editorialNote: EditorialNoteBlock,
  mosaicPreset: MosaicPresetBlock,
};

export interface BlockItem {
  type: string;
  data: Record<string, any>;
  id?: string;
}

export interface BlockRenderContext {
  project?: {
    title?: string;
    cityName?: string;
    year?: string | number | null;
    completedAt?: string | null;
    categoryName?: string;
  };
}

interface BlockRendererProps {
  blocks: BlockItem[];
  context?: BlockRenderContext;
}

export function BlockRenderer({ blocks, context }: BlockRendererProps) {
  if (!blocks?.length) return null;

  return (
    <>
      {blocks.map((block, index) => {
        const Component = blockComponents[block.type];
        if (!Component) {
          console.warn(`Unknown block type: ${block.type}`);
          return null;
        }

        return <Component key={block.id || `${block.type}-${index}`} data={block.data} context={context} />;
      })}
    </>
  );
}
