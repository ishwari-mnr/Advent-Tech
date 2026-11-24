export default function FeatureCard({ icon: Icon, title, description, points = [], wide = false }) {
  return (
    <div
      className={`flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${
        wide ? "md:col-span-2 lg:col-span-3" : ""
      }`}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
        <Icon size={22} />
      </div>
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      <ul className={`mt-4 space-y-2 text-sm text-gray-700 ${wide ? "md:columns-2 md:gap-8" : ""}`}>
        {points.map((point) => (
          <li key={point} className="flex gap-2 break-inside-avoid">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-orange-500" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
