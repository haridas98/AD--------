import HeroImageBlock from './HeroImageBlock';
import ImageGridBlock from './ImageGridBlock';
import MetaInfoBlock from './MetaInfoBlock';
import TypographyBlock from './TypographyBlock';
import SideBySideBlock from './SideBySideBlock';
import CTASectionBlock from './CTASectionBlock';
import BeforeAfterBlock from './BeforeAfterBlock';

export const blockComponents: Record<string, React.ComponentType<any>> = {
  heroImage: HeroImageBlock,
  imageGrid: ImageGridBlock,
  metaInfo: MetaInfoBlock,
  typography: TypographyBlock,
  sideBySide: SideBySideBlock,
  ctaSection: CTASectionBlock,
  beforeAfter: BeforeAfterBlock,
};

export interface BlockItem {
  type: string;
  data: Record<string, any>;
  id?: string;
}

interface BlockRendererProps {
  blocks: BlockItem[];
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!blocks?.length) return null;

  return (
    <>
      {blocks.map((block, index) => {
        const Component = blockComponents[block.type];
        if (!Component) {
          console.warn(`Unknown block type: ${block.type}`);
          return null;
        }

        return <Component key={block.id || `${block.type}-${index}`} data={block.data} />;
      })}
    </>
  );
}
