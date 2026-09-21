interface StatCardProps {
  title: string;
  value: string;
  color: string;
}

export default function StatCard({
  title,
  value,
  color,
}: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h2 className="mt-3 text-4xl font-bold text-gray-900">
            {value}
          </h2>

        </div>

        <div
          className={`h-14 w-14 rounded-xl ${color} flex items-center justify-center shadow-md`}
        >
          <div className="h-4 w-4 rounded-full bg-white"></div>
        </div>

      </div>

      <div className="mt-6 h-2 w-full rounded-full bg-gray-100">

        <div
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: "70%" }}
        ></div>

      </div>

    </div>
  );
}