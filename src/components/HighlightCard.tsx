// Interface for a single highlight, ensuring property names match the API
interface Highlight {
  id: string;
  embedUrl: string;
  title: string;
}

interface HighlightSlideProps {
  highlight: Highlight;
}

export default function HighlightSlide({ highlight }: HighlightSlideProps) {
  return (
    // The slide itself is a responsive container for the iframe
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <iframe
        src={highlight.embedUrl}
        title={highlight.title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
        loading="lazy" // Added for better performance
      ></iframe>
    </div>
  );
}
