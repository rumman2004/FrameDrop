import PreviewCard from '../ui/PreviewCard';

export default function MasonryGrid({ files }) {
  if (!files?.length) {
    return (
      <div className="text-center py-20 text-zinc-500">No files to display</div>
    );
  }

  return (
    <div
      className="
        columns-2
        sm:columns-3
        lg:columns-4
        xl:columns-5
        gap-2
        sm:gap-2.5
        lg:gap-3
        space-y-2
        sm:space-y-2.5
        lg:space-y-3
      "
    >
      {files.map((file, idx) => (
        <div key={file._id ?? file.url ?? idx} className="break-inside-avoid">
          <PreviewCard file={file} />
        </div>
      ))}
    </div>
  );
}