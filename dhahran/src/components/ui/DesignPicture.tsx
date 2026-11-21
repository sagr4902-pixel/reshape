/**
 * Responsive AVIF/WebP picture for an owner-supplied design render.
 * No client code; safe in Server and Client Components.
 */
export interface DesignPictureSource {
  id: string;
  w: number;
  h: number;
  widths: number[];
  webp: number[];
}

const srcset = (id: string, widths: number[], ext: string) => widths.map((w) => `/assets/design/${id}-${w}.${ext} ${w}w`).join(', ');

export function DesignPicture({
  image,
  alt,
  sizes,
  priority = false,
  className,
  onError,
}: {
  image: DesignPictureSource;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  onError?: () => void;
}) {
  const largest = image.webp[image.webp.length - 1];
  return (
    <picture>
      <source type="image/avif" srcSet={srcset(image.id, image.widths, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcset(image.id, image.webp, 'webp')} sizes={sizes} />
      <img
        src={`/assets/design/${image.id}-${largest}.webp`}
        alt={alt}
        width={image.w}
        height={image.h}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        draggable={false}
        onError={onError}
      />
    </picture>
  );
}
